/**
 * Direct NocoDB API Client for GitHub Actions
 * Uses standard HTTP requests instead of MCP
 */

interface NocoDBConfig {
  baseUrl: string
  apiKey: string
  baseId: string
}

interface Episode {
  id: number
  transistorId?: string
  title: string
  slug: string
  description?: string
  summary?: string
  episodeNumber: number
  season?: number
  language: string
  duration?: number
  mediaUrl?: string
  publishedAt?: string
  status: string
  hosts?: any[]
  guests?: any[]
  platforms?: any[]
  aiKeywords?: string
  aiSummary?: string
  aiTranscriptText?: string
  showNotes?: string
  createdAt: string
  updatedAt: string
}

interface Guest {
  id: number
  slug: string
  name: string
  bio?: string
  company?: string
  role?: string
  episodeCount?: number
  episodes?: any[]
  languages?: string[]
  socialLinks?: any[]
  createdAt: string
  updatedAt: string
}

interface Host {
  id: number
  slug: string
  name: string
  bio?: string
  episodes?: any[]
  socialLinks?: any[]
  createdAt: string
  updatedAt: string
}

interface Platform {
  id: number
  name: string
  slug: string
  displayOrder?: number
  isActive: boolean
  urls?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export class NocoDBAPIClient {
  private config: NocoDBConfig

  constructor(config: NocoDBConfig) {
    this.config = config
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}/api/v2${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'xc-token': this.config.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`NocoDB API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getEpisodes(options: { limit?: number } = {}): Promise<Episode[]> {
    const { limit = 1000 } = options
    const response = await this.request(`/tables/${this.getTableId('episodes')}/records?limit=${limit}`)
    return response.list || []
  }

  async getGuests(options: { limit?: number } = {}): Promise<Guest[]> {
    const { limit = 1000 } = options
    const response = await this.request(`/tables/${this.getTableId('guests')}/records?limit=${limit}`)
    return response.list || []
  }

  async getHosts(options: { limit?: number } = {}): Promise<Host[]> {
    const { limit = 100 } = options
    const response = await this.request(`/tables/${this.getTableId('hosts')}/records?limit=${limit}`)
    return response.list || []
  }

  async getPlatforms(options: { limit?: number } = {}): Promise<Platform[]> {
    const { limit = 100 } = options
    const response = await this.request(`/tables/${this.getTableId('platforms')}/records?limit=${limit}`)
    return response.list || []
  }

  private getTableId(tableName: string): string {
    // In a real implementation, you might need to fetch table IDs dynamically
    // For now, we'll assume standard table names or IDs
    const tableMap: Record<string, string> = {
      episodes: 'episodes',
      guests: 'guests', 
      hosts: 'hosts',
      platforms: 'platforms'
    }
    
    return tableMap[tableName] || tableName
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request(`/meta/bases/${this.config.baseId}/info`)
      return true
    } catch (error) {
      console.error('NocoDB connection test failed:', error)
      return false
    }
  }
}