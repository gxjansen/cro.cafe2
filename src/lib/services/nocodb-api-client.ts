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
  Id: number
  transistor_id?: string
  title: string
  slug: string
  description?: string
  formatted_description?: string
  summary?: string
  formatted_summary?: string
  episode_number: number
  season?: number
  language: string
  duration?: number
  media_url?: string
  published_at?: string
  status: string
  host?: any[]
  guest?: any[]
  _nc_m2m_Episodes_Hosts?: any[]
  _nc_m2m_Episodes_Guests?: any[]
  ai_keywords?: string
  ai_summary?: string
  ai_transcript_text?: string
  show_notes?: string
  CreatedAt: string
  UpdatedAt: string
}

interface Guest {
  Id: number
  slug: string
  name: string
  bio?: string
  ai_bio?: string
  company?: string
  role?: string
  episode_count?: number
  Episodes?: any[]
  Language?: string[]
  LinkedIn?: string
  image_url?: string
  CreatedAt: string
  UpdatedAt: string
}

interface Host {
  Id: number
  slug: string
  name: string
  bio?: string
  Episodes?: any[]
  social_links?: any
  role?: string
  image_url?: string
  CreatedAt: string
  UpdatedAt: string
}

interface Platform {
  Id: number
  name: string
  slug: string
  display_order?: number
  is_active: boolean
  urls?: Record<string, string>
  CreatedAt: string
  UpdatedAt: string
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
      console.error(`NocoDB API error for ${url}: ${response.status} ${response.statusText}`)
      throw new Error(`NocoDB API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getEpisodes(options: { limit?: number } = {}): Promise<Episode[]> {
    const { limit = 1000 } = options
    // Use the v1 API endpoint structure which seems to work
    const response = await this.request(`/meta/tables/${this.getTableId('episodes')}/rows?limit=${limit}`)
    return response.list || []
  }

  async getGuests(options: { limit?: number } = {}): Promise<Guest[]> {
    const { limit = 1000 } = options
    const response = await this.request(`/meta/tables/${this.getTableId('guests')}/rows?limit=${limit}`)
    return response.list || []
  }

  async getHosts(options: { limit?: number } = {}): Promise<Host[]> {
    const { limit = 100 } = options
    const response = await this.request(`/meta/tables/${this.getTableId('hosts')}/rows?limit=${limit}`)
    return response.list || []
  }

  async getPlatforms(options: { limit?: number } = {}): Promise<Platform[]> {
    const { limit = 100 } = options
    const response = await this.request(`/meta/tables/${this.getTableId('platforms')}/rows?limit=${limit}`)
    return response.list || []
  }

  private getTableId(tableName: string): string {
    // Use actual NocoDB table names (capitalized)
    const tableMap: Record<string, string> = {
      episodes: 'Episodes',
      guests: 'Guests', 
      hosts: 'Hosts',
      platforms: 'Platforms'
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