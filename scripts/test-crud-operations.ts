#!/usr/bin/env tsx

import { SimpleContentGenerator } from '../src/lib/engines/simple-content-generator.js'
import { DeletionTracker } from '../src/lib/engines/deletion-tracker.js'
import { promises as fs } from 'fs'
import { join } from 'path'

/**
 * Test CRUD Operations - Create, Update, Delete
 */

// Mock NocoDB Service for testing
class MockNocoDBService {
  private mockData: {
    episodes: any[]
    guests: any[]
    hosts: any[]
    platforms: any[]
  }
  
  constructor() {
    this.mockData = {
      episodes: [],
      guests: [],
      hosts: [],
      platforms: []
    }
  }

  async testConnection() {
    console.log('Connected to mock NocoDB service')
    return true
  }

  async disconnect() {
    console.log('Disconnected from mock NocoDB service')
  }

  setMockData(data: typeof this.mockData) {
    this.mockData = data
  }

  async getEpisodes() {
    return this.mockData.episodes
  }

  async getGuests() {
    return this.mockData.guests
  }

  async getHosts() {
    return this.mockData.hosts
  }

  async getPlatforms() {
    return this.mockData.platforms
  }
}

async function cleanTestDirectory(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true })
  } catch {}
}

async function countFiles(dir: string): Promise<number> {
  let count = 0
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        count += await countFiles(fullPath)
      } else {
        count++
      }
    }
  } catch {}
  
  return count
}

async function testCRUDOperations() {
  console.log('🧪 Testing CRUD Operations (Create, Update, Delete)')
  console.log('=================================================')

  const testOutputDir = 'test-crud-output'
  
  try {
    // Clean up before starting
    await cleanTestDirectory(testOutputDir)

    // Initialize mock service and generator
    const mockService = new MockNocoDBService()
    const generator = new SimpleContentGenerator(mockService, {
      outputDir: testOutputDir,
      overwriteExisting: true,
      languages: ['en', 'nl'],
      defaultLanguage: 'en'
    })

    // Test 1: CREATE - Initial content generation
    console.log('\n📝 Test 1: CREATE - Initial content generation')
    console.log('----------------------------------------------')
    
    mockService.setMockData({
      episodes: [
        {
          Id: 1,
          slug: 'episode-1',
          title: 'First Episode',
          description: 'The first episode',
          episode_number: 1,
          season: 1,
          language: 'en',
          duration: '30:00',
          media_url: 'https://example.com/ep1.mp3',
          published_at: new Date('2024-01-01'),
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-01')
        }
      ],
      guests: [
        {
          Id: 1,
          slug: 'john-doe',
          name: 'John Doe',
          bio: 'Expert in CRO',
          image_url: 'john-doe.jpeg',
          episode_count: 1,
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-01')
        }
      ],
      hosts: [
        {
          Id: 1,
          slug: 'host-1',
          name: 'Main Host',
          bio: 'The main host',
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-01')
        }
      ],
      platforms: [
        {
          Id: 1,
          Name: 'Spotify',
          slug: 'spotify',
          url: 'https://spotify.com',
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-01')
        }
      ]
    })

    let stats = await generator.generateAll()
    console.log(`✅ Created: ${stats.episodesGenerated} episodes, ${stats.guestsGenerated} guests, ${stats.hostsGenerated} hosts, ${stats.platformsGenerated} platforms`)
    console.log(`📁 Total files: ${await countFiles(testOutputDir)}`)

    // Test 2: UPDATE - Add more content
    console.log('\n📝 Test 2: UPDATE - Add more content')
    console.log('------------------------------------')
    
    mockService.setMockData({
      episodes: [
        // Keep existing
        {
          Id: 1,
          slug: 'episode-1',
          title: 'First Episode - Updated Title',  // Updated
          description: 'The first episode with updated content',  // Updated
          episode_number: 1,
          season: 1,
          language: 'en',
          duration: '35:00',  // Updated
          media_url: 'https://example.com/ep1.mp3',
          published_at: new Date('2024-01-01'),
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-02')  // Updated
        },
        // Add new
        {
          Id: 2,
          slug: 'episode-2',
          title: 'Second Episode',
          description: 'The second episode',
          episode_number: 2,
          season: 1,
          language: 'en',
          duration: '40:00',
          media_url: 'https://example.com/ep2.mp3',
          published_at: new Date('2024-01-15'),
          CreatedAt: new Date('2024-01-15'),
          UpdatedAt: new Date('2024-01-15')
        }
      ],
      guests: [
        // Keep existing
        {
          Id: 1,
          slug: 'john-doe',
          name: 'John Doe',
          bio: 'Senior Expert in CRO',  // Updated
          image_url: 'john-doe.jpeg',
          episode_count: 2,  // Updated
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-15')  // Updated
        },
        // Add new
        {
          Id: 2,
          slug: 'jane-smith',
          name: 'Jane Smith',
          bio: 'Conversion Specialist',
          image_url: 'jane-smith.jpg',
          episode_count: 1,
          CreatedAt: new Date('2024-01-15'),
          UpdatedAt: new Date('2024-01-15')
        }
      ],
      hosts: [
        // Keep existing (unchanged)
        {
          Id: 1,
          slug: 'host-1',
          name: 'Main Host',
          bio: 'The main host',
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-01')
        }
      ],
      platforms: [
        // Keep existing
        {
          Id: 1,
          Name: 'Spotify',
          slug: 'spotify',
          url: 'https://spotify.com',
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-01')
        },
        // Add new
        {
          Id: 2,
          Name: 'Apple Podcasts',
          slug: 'apple-podcasts',
          url: 'https://podcasts.apple.com',
          CreatedAt: new Date('2024-01-15'),
          UpdatedAt: new Date('2024-01-15')
        }
      ]
    })

    stats = await generator.generateAll()
    console.log(`✅ Generated: ${stats.episodesGenerated} episodes, ${stats.guestsGenerated} guests, ${stats.hostsGenerated} hosts, ${stats.platformsGenerated} platforms`)
    console.log(`📁 Total files: ${await countFiles(testOutputDir)}`)

    // Test 3: DELETE - Remove some content
    console.log('\n📝 Test 3: DELETE - Remove content from NocoDB')
    console.log('----------------------------------------------')
    
    mockService.setMockData({
      episodes: [
        // Keep only episode 2
        {
          Id: 2,
          slug: 'episode-2',
          title: 'Second Episode',
          description: 'The second episode',
          episode_number: 2,
          season: 1,
          language: 'en',
          duration: '40:00',
          media_url: 'https://example.com/ep2.mp3',
          published_at: new Date('2024-01-15'),
          CreatedAt: new Date('2024-01-15'),
          UpdatedAt: new Date('2024-01-15')
        }
      ],
      guests: [
        // Keep only Jane
        {
          Id: 2,
          slug: 'jane-smith',
          name: 'Jane Smith',
          bio: 'Conversion Specialist',
          image_url: 'jane-smith.jpg',
          episode_count: 1,
          CreatedAt: new Date('2024-01-15'),
          UpdatedAt: new Date('2024-01-15')
        }
      ],
      hosts: [
        // Keep existing
        {
          Id: 1,
          slug: 'host-1',
          name: 'Main Host',
          bio: 'The main host',
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-01')
        }
      ],
      platforms: [
        // Keep only Spotify
        {
          Id: 1,
          Name: 'Spotify',
          slug: 'spotify',
          url: 'https://spotify.com',
          CreatedAt: new Date('2024-01-01'),
          UpdatedAt: new Date('2024-01-01')
        }
      ]
    })

    stats = await generator.generateAll()
    console.log(`✅ Generated: ${stats.episodesGenerated} episodes, ${stats.guestsGenerated} guests, ${stats.hostsGenerated} hosts, ${stats.platformsGenerated} platforms`)
    console.log(`🗑️ Deleted: ${stats.filesDeleted} files`)
    console.log(`📁 Total files: ${await countFiles(testOutputDir)}`)

    // Verify final state
    console.log('\n📊 Final State Verification')
    console.log('---------------------------')
    
    const finalFiles = await getAllFiles(testOutputDir)
    console.log('Remaining files:')
    finalFiles.forEach(file => console.log(`  - ${file}`))

    // Expected remaining files:
    // - episode-2.mdx
    // - jane-smith.mdx
    // - host-1.mdx
    // - spotify.json
    
    const expectedCount = 4
    const actualCount = finalFiles.length
    
    if (actualCount === expectedCount) {
      console.log(`\n✅ Test PASSED! Expected ${expectedCount} files, found ${actualCount}`)
    } else {
      console.log(`\n❌ Test FAILED! Expected ${expectedCount} files, found ${actualCount}`)
    }

    console.log('\n✅ All CRUD tests completed!')
    console.log(`\n💡 Test output available in: ${testOutputDir}/`)

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

async function getAllFiles(dir: string, basePath: string = ''): Promise<string[]> {
  const files: string[] = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      const relativePath = basePath ? join(basePath, entry.name) : entry.name
      
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, relativePath)
        files.push(...subFiles)
      } else {
        files.push(relativePath)
      }
    }
  } catch {}
  
  return files
}

// Run the test
testCRUDOperations().catch(console.error)