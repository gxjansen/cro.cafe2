/**
 * Working NocoDB Direct Client
 * Mimics the successful MCP connection structure
 */

interface NocoDBDirectConfig {
  baseUrl: string
  apiKey: string
  baseId: string
}

export class NocoDBDirectClient {
  private config: NocoDBDirectConfig

  constructor(config: NocoDBDirectConfig) {
    this.config = config
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Try multiple endpoint patterns that might work
    const possibleUrls = [
      `${this.config.baseUrl}/api/v1${endpoint}`,
      `${this.config.baseUrl}/api/v2${endpoint}`,
      `${this.config.baseUrl}${endpoint}`,
      `${this.config.baseUrl}/nc/${this.config.baseId}/api/v1${endpoint}`,
      `${this.config.baseUrl}/nc/${this.config.baseId}/api/v2${endpoint}`
    ]

    let lastError: Error | null = null

    for (const url of possibleUrls) {
      try {
        console.log(`Trying NocoDB URL: ${url.replace(this.config.apiKey, 'xxx')}`)
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'xc-token': this.config.apiKey,
            'xc-auth': this.config.apiKey,
            'Authorization': `Bearer ${this.config.apiKey}`,
            ...options.headers,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Success with URL: ${url.replace(this.config.apiKey, 'xxx')}`)
          return data
        } else {
          console.log(`❌ ${response.status} ${response.statusText} for: ${url.replace(this.config.apiKey, 'xxx')}`)
        }
      } catch (error) {
        console.log(`❌ Network error for: ${url.replace(this.config.apiKey, 'xxx')} - ${error}`)
        lastError = error as Error
      }
    }

    throw new Error(`All NocoDB API attempts failed. Last error: ${lastError?.message}`)
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try multiple test endpoints
      await this.request('/api/v1/auth/user/me')
      return true
    } catch {
      try {
        await this.request('/api/v2/auth/user/me')
        return true
      } catch {
        try {
          await this.request('/health')
          return true
        } catch {
          return false
        }
      }
    }
  }

  async getEpisodes(options: { limit?: number } = {}): Promise<any[]> {
    const { limit = 1000 } = options
    
    // Try different endpoint patterns for Episodes table
    const endpoints = [
      `/tables/Episodes/records?limit=${limit}`,
      `/meta/tables/Episodes/rows?limit=${limit}`,
      `/bases/${this.config.baseId}/tables/Episodes/records?limit=${limit}`,
      `/meta/bases/${this.config.baseId}/tables/Episodes/rows?limit=${limit}`,
      `/Episodes?limit=${limit}`,
      `/api/Episodes?limit=${limit}`
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await this.request(endpoint)
        if (response && (response.list || response.data || Array.isArray(response))) {
          return response.list || response.data || response
        }
      } catch (error) {
        console.log(`Failed endpoint ${endpoint}: ${error}`)
        continue
      }
    }

    throw new Error('Unable to fetch Episodes from any known endpoint')
  }

  async getGuests(options: { limit?: number } = {}): Promise<any[]> {
    const { limit = 1000 } = options
    
    const endpoints = [
      `/tables/Guests/records?limit=${limit}`,
      `/meta/tables/Guests/rows?limit=${limit}`,
      `/bases/${this.config.baseId}/tables/Guests/records?limit=${limit}`,
      `/meta/bases/${this.config.baseId}/tables/Guests/rows?limit=${limit}`,
      `/Guests?limit=${limit}`,
      `/api/Guests?limit=${limit}`
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await this.request(endpoint)
        if (response && (response.list || response.data || Array.isArray(response))) {
          return response.list || response.data || response
        }
      } catch (error) {
        console.log(`Failed endpoint ${endpoint}: ${error}`)
        continue
      }
    }

    throw new Error('Unable to fetch Guests from any known endpoint')
  }

  async getHosts(options: { limit?: number } = {}): Promise<any[]> {
    const { limit = 100 } = options
    
    const endpoints = [
      `/tables/Hosts/records?limit=${limit}`,
      `/meta/tables/Hosts/rows?limit=${limit}`,
      `/bases/${this.config.baseId}/tables/Hosts/records?limit=${limit}`,
      `/meta/bases/${this.config.baseId}/tables/Hosts/rows?limit=${limit}`,
      `/Hosts?limit=${limit}`,
      `/api/Hosts?limit=${limit}`
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await this.request(endpoint)
        if (response && (response.list || response.data || Array.isArray(response))) {
          return response.list || response.data || response
        }
      } catch (error) {
        console.log(`Failed endpoint ${endpoint}: ${error}`)
        continue
      }
    }

    throw new Error('Unable to fetch Hosts from any known endpoint')
  }

  async getPlatforms(options: { limit?: number } = {}): Promise<any[]> {
    const { limit = 100 } = options
    
    const endpoints = [
      `/tables/Platforms/records?limit=${limit}`,
      `/meta/tables/Platforms/rows?limit=${limit}`,
      `/bases/${this.config.baseId}/tables/Platforms/records?limit=${limit}`,
      `/meta/bases/${this.config.baseId}/tables/Platforms/rows?limit=${limit}`,
      `/Platforms?limit=${limit}`,
      `/api/Platforms?limit=${limit}`
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await this.request(endpoint)
        if (response && (response.list || response.data || Array.isArray(response))) {
          return response.list || response.data || response
        }
      } catch (error) {
        console.log(`Failed endpoint ${endpoint}: ${error}`)
        continue
      }
    }

    throw new Error('Unable to fetch Platforms from any known endpoint')
  }
}