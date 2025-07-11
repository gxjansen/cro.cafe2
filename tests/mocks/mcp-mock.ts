// Mock data for testing
export const mockEpisodes = [
  {
    id: 1,
    transistorId: 'ep-001',
    title: { en: 'Episode 1', nl: 'Aflevering 1' },
    description: { en: 'Description', nl: 'Beschrijving' },
    summary: { en: 'Summary', nl: 'Samenvatting' },
    duration: 3600,
    episodeNumber: 1,
    season: 1,
    slug: 'episode-1',
    status: 'published',
    language: 'en',
    mediaUrl: 'https://example.com/ep1.mp3',
    publishedAt: new Date('2024-01-01'),
    hosts: [],
    guests: [],
    platforms: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

export const mockGuests = [
  {
    id: 1,
    slug: 'john-doe',
    name: 'John Doe',
    bio: { en: 'Bio' },
    company: 'ACME Corp',
    role: 'CEO',
    socialLinks: [],
    episodeCount: 1,
    episodes: [{ id: 1, title: 'Episode 1' }], // Match episodeCount
    languages: ['en'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

export const mockHosts = [
  {
    id: 1,
    slug: 'jane-smith',
    name: 'Jane Smith',
    bio: { en: 'Host bio' },
    socialLinks: [],
    episodes: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

export const mockPlatforms = [
  {
    id: 1,
    name: 'Spotify',
    slug: 'spotify',
    displayOrder: 1,
    isActive: true,
    urls: {
      en: 'https://spotify.com/show/en',
      nl: 'https://spotify.com/show/nl',
      de: 'https://spotify.com/show/de',
      es: 'https://spotify.com/show/es'
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

export class MockMCPClient {
  private connected = false
  private shouldFailConnection = false
  
  setConnectionFailure(shouldFail: boolean) {
    this.shouldFailConnection = shouldFail
  }
  
  async connect() {
    if (this.shouldFailConnection) {
      throw new Error('Connection failed')
    }
    this.connected = true
  }
  
  async close() {
    this.connected = false
  }
  
  async callTool(toolName: string, params: any) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50))
    
    if (!this.connected) {
      throw new Error('Not connected')
    }
    
    // Return mock data based on table
    let data: any[] = []
    
    switch (params.tableName) {
      case 'Episodes':
        data = mockEpisodes
        break
      case 'Guests':
        data = mockGuests
        break
      case 'Hosts':
        data = mockHosts
        break
      case 'Platforms':
        data = mockPlatforms
        break
      case '_changes':
        data = []
        break
    }
    
    // Apply filters
    if (params.filters) {
      // Simple filter implementation for testing
      const filters = params.filters.split('~and')
      data = data.filter(item => {
        return filters.every((filter: string) => {
          const match = filter.match(/\((\w+),(\w+),([^)]+)\)/)
          if (!match) return true
          
          const [_, field, op, value] = match
          const itemValue = item[field]
          
          switch (op) {
            case 'eq':
              return itemValue == value
            case 'gt':
              return itemValue > value
            default:
              return true
          }
        })
      })
    }
    
    // Apply pagination
    if (params.offset) {
      data = data.slice(params.offset)
    }
    if (params.limit) {
      data = data.slice(0, params.limit)
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ list: data })
      }]
    }
  }
}

export class MockStdioTransport {
  async close() {
    // Mock implementation
  }
}