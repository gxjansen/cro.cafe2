// Use dynamic imports to avoid test issues
let Client: any
let StdioClientTransport: any

// Only import in non-test environment
if (process.env.NODE_ENV !== 'test') {
  import('@modelcontextprotocol/sdk/client/index.js').then(m => Client = m.Client)
  import('@modelcontextprotocol/sdk/client/stdio.js').then(m => StdioClientTransport = m.StdioClientTransport)
}
import {
  ConnectionError,
  type MCPConfiguration,
  type QueryParams,
  type HealthStatus,
  type RetryPolicy,
  type NocoDBError
} from '../types/database'
import crypto from 'crypto'

export class MCPAdapter {
  private client?: Client
  private transport?: StdioClientTransport
  private config?: MCPConfiguration
  private cache: Map<string, { value: any; expiresAt: Date }> = new Map()
  private healthStatus: HealthStatus = {
    connected: false,
    latency: 0,
    lastCheck: new Date(),
    errors: []
  }
  private connectionPromise?: Promise<void>

  async connect(config: MCPConfiguration): Promise<void> {
    // Prevent multiple simultaneous connections
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.doConnect(config)
    try {
      await this.connectionPromise
    } finally {
      this.connectionPromise = undefined
    }
  }

  private async doConnect(config: MCPConfiguration): Promise<void> {
    this.config = config

    try {
      // Use mock in test environment
      if (process.env.NODE_ENV === 'test') {
        const { MockMCPClient, MockStdioTransport } = await import('../../../tests/mocks/mcp-mock')
        this.transport = new MockStdioTransport() as any
        this.client = new MockMCPClient() as any
        await this.client.connect()
      } else {
        // Ensure modules are loaded
        if (!Client || !StdioClientTransport) {
          await new Promise(resolve => setTimeout(resolve, 100))
          if (!Client || !StdioClientTransport) {
            throw new Error('MCP SDK not loaded')
          }
        }

        // Create transport
        this.transport = new StdioClientTransport({
          command: 'npx',
          args: ['@modelcontextprotocol/server-nocodb', '--api-key', config.nocodb.apiKey, '--base-url', config.nocodb.server]
        })

        // Create client
        this.client = new Client(
          {
            name: 'crocafe-nocodb-client',
            version: '1.0.0'
          },
          {
            capabilities: {}
          }
        )

        // Connect
        await this.client.connect(this.transport)
      }

      this.healthStatus.connected = true
      this.healthStatus.lastCheck = new Date()
      this.healthStatus.errors = []
    } catch (error) {
      this.healthStatus.connected = false
      this.healthStatus.errors?.push(error instanceof Error ? error.message : String(error))
      throw new ConnectionError('Failed to connect to MCP server', error as Error)
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = undefined
    }
    if (this.transport) {
      await this.transport.close()
      this.transport = undefined
    }
    this.healthStatus.connected = false
  }

  isConnected(): boolean {
    return this.healthStatus.connected && this.client !== undefined
  }

  async healthCheck(): Promise<HealthStatus> {
    if (!this.isConnected()) {
      this.healthStatus.connected = false
      return this.healthStatus
    }

    const start = Date.now()
    try {
      // Simple ping query
      await this.query({ table: 'Episodes', limit: 1 })
      this.healthStatus.latency = Date.now() - start
      this.healthStatus.lastCheck = new Date()
      this.healthStatus.connected = true
    } catch (error) {
      this.healthStatus.connected = false
      this.healthStatus.errors?.push(error instanceof Error ? error.message : String(error))
    }

    return { ...this.healthStatus }
  }

  async query<T>(params: QueryParams & { table: string }): Promise<T[]> {
    // Validate required parameters
    if (!params.table) {
      throw new Error('Invalid query parameters: table is required')
    }

    // Validate parameters
    if (params.limit !== undefined && params.limit < 0) {
      throw new Error('Invalid query parameters: limit must be non-negative')
    }
    if (params.offset !== undefined && typeof params.offset !== 'number') {
      throw new Error('Invalid query parameters: offset must be a number')
    }

    // Check cache if TTL specified
    const cacheKey = this.generateCacheKey(params)
    if (params.ttl) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {return cached}
    }

    // Execute query with retry
    const result = await this.executeWithRetry(async () => {
      if (!this.client) {
        throw new ConnectionError('Not connected to MCP server')
      }

      // Call the appropriate tool based on table
      const toolName = this.getToolName(params.table)
      const response = await this.client.callTool(toolName, this.buildToolParams(params))

      // Parse response
      if (response.content?.[0]?.type === 'text') {
        const data = JSON.parse(response.content[0].text)
        return Array.isArray(data) ? data : data.list || []
      }

      return []
    })

    // Cache result if TTL specified
    if (params.ttl) {
      this.setCache(cacheKey, result, params.ttl)
    }

    return result
  }

  generateCacheKey(params: any): string {
    const normalized = this.normalizeObject(params)
    const json = JSON.stringify(normalized)
    return crypto.createHash('md5').update(json).digest('hex')
  }

  private normalizeObject(obj: any): any {
    if (obj === null || obj === undefined) {return obj}
    if (typeof obj !== 'object') {return obj}
    if (obj instanceof Date) {return obj.toISOString()}
    if (obj instanceof RegExp) {return obj.toString()}
    if (Array.isArray(obj)) {return obj.map(item => this.normalizeObject(item))}

    // Sort object keys
    const sorted: any = {}
    Object.keys(obj).sort().forEach(key => {
      if (typeof obj[key] !== 'function' && obj[key] !== undefined) {
        sorted[key] = this.normalizeObject(obj[key])
      }
    })
    return sorted
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) {return null}

    if (entry.expiresAt < new Date()) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  private setCache(key: string, value: any, ttl: number): void {
    const expiresAt = new Date(Date.now() + ttl)
    this.cache.set(key, { value, expiresAt })
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const policy = this.config?.nocodb.retryPolicy || {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      initialDelay: 100,
      maxDelay: 5000
    }

    let lastError: Error | undefined
    let delay = policy.initialDelay

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === policy.maxAttempts) {
          throw lastError
        }

        // Calculate next delay
        if (policy.backoffStrategy === 'exponential') {
          delay = Math.min(delay * 2, policy.maxDelay)
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Retry failed')
  }

  private getToolName(table: string): string {
    // Map table names to MCP tool names
    const toolMap: Record<string, string> = {
      'Episodes': 'nocodb-get-records',
      'Guests': 'nocodb-get-records',
      'Hosts': 'nocodb-get-records',
      'Platforms': 'nocodb-get-records',
      '_changes': 'nocodb-get-records'
    }

    return toolMap[table] || 'nocodb-get-records'
  }

  private buildToolParams(params: QueryParams & { table: string }): any {
    const toolParams: any = {
      tableName: params.table
    }

    if (params.limit !== undefined) {
      toolParams.limit = params.limit
    }

    if (params.offset !== undefined) {
      toolParams.offset = params.offset
    }

    if (params.sort?.length) {
      toolParams.sort = params.sort
        .map(s => `${s.order === 'desc' ? '-' : ''}${s.field}`)
        .join(',')
    }

    if (params.filters) {
      toolParams.filters = this.buildFilterString(params.filters)
    }

    if (params.include?.length) {
      toolParams.fields = params.include.join(',')
    }

    return toolParams
  }

  private buildFilterString(filters: Record<string, any>): string {
    const filterParts: string[] = []

    for (const [field, value] of Object.entries(filters)) {
      if (typeof value === 'object' && value !== null) {
        // Handle operators like $gt, $lt, etc.
        for (const [op, val] of Object.entries(value)) {
          const operator = this.mapOperator(op)
          filterParts.push(`(${field},${operator},${val})`)
        }
      } else {
        filterParts.push(`(${field},eq,${value})`)
      }
    }

    return filterParts.join('~and')
  }

  private mapOperator(op: string): string {
    const operatorMap: Record<string, string> = {
      '$eq': 'eq',
      '$ne': 'neq',
      '$gt': 'gt',
      '$gte': 'ge',
      '$lt': 'lt',
      '$lte': 'le',
      '$in': 'in',
      '$like': 'like'
    }

    return operatorMap[op] || 'eq'
  }
}