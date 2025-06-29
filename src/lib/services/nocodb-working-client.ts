/**
 * Working NocoDB API Client
 * Based on diagnostic results from GitHub Actions
 */

interface NocoDBConfig {
  baseUrl: string
  apiKey: string
  baseId: string
}

export class NocoDBWorkingClient {
  private config: NocoDBConfig
  private tableIds: Map<string, string> = new Map()

  constructor(config: NocoDBConfig) {
    this.config = config
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'xc-token': this.config.apiKey,
        ...options.headers
      }
    })

    if (!response.ok) {
      console.error(`NocoDB API error for ${url}: ${response.status} ${response.statusText}`)
      throw new Error(`NocoDB API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/api/v1/auth/user/me')
      return true
    } catch (error) {
      console.error('NocoDB connection test failed:', error)
      return false
    }
  }

  private async getTableId(tableName: string): Promise<string> {
    if (this.tableIds.has(tableName)) {
      return this.tableIds.get(tableName)!
    }

    // Get table list from the working endpoint
    const response = await this.request(`/api/v2/meta/bases/${this.config.baseId}/tables`)
    const tables = response.list || []

    // Find the table by name
    const table = tables.find((t: any) => t.table_name === tableName || t.title === tableName)
    if (!table) {
      throw new Error(`Table ${tableName} not found`)
    }

    const tableId = table.id
    this.tableIds.set(tableName, tableId)
    console.log(`Found table ${tableName} with ID: ${tableId}`)
    return tableId
  }

  async getEpisodes(options: { limit?: number } = {}): Promise<any[]> {
    const { limit = 1000 } = options
    const tableId = await this.getTableId('Episodes')

    // Use the working table data endpoint pattern
    const response = await this.request(`/api/v2/tables/${tableId}/records?limit=${limit}&offset=0`)
    return response.list || []
  }

  async getGuests(options: { limit?: number } = {}): Promise<any[]> {
    const { limit = 1000 } = options
    const tableId = await this.getTableId('Guests')

    // Don't specify fields to get all available fields and avoid 404 errors
    // This will help us debug what fields are actually available
    console.log('📋 Fetching guests from table:', tableId)
    const response = await this.request(`/api/v2/tables/${tableId}/records?limit=${limit}&offset=0`)

    // Debug: log available fields from first record
    if (response.list && response.list.length > 0) {
      console.log('🔍 Available fields in NocoDB:', Object.keys(response.list[0]))
    }

    return response.list || []
  }

  async getHosts(options: { limit?: number } = {}): Promise<any[]> {
    const { limit = 100 } = options
    const tableId = await this.getTableId('Hosts')

    const response = await this.request(`/api/v2/tables/${tableId}/records?limit=${limit}&offset=0`)
    return response.list || []
  }

  async getPlatforms(options: { limit?: number } = {}): Promise<any[]> {
    const { limit = 100 } = options
    const tableId = await this.getTableId('Platforms')

    const response = await this.request(`/api/v2/tables/${tableId}/records?limit=${limit}&offset=0`)
    return response.list || []
  }
}