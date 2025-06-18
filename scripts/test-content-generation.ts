#!/usr/bin/env tsx

import { ContentGenerator } from '../src/lib/engines/content-generator.js'
import { promises as fs } from 'fs'
import { join } from 'path'

/**
 * Test Content Generation with Mock Data
 */

// Mock NocoDB Service for testing
class MockNocoDBService {
  async connect() {
    console.log('Connected to mock NocoDB service')
  }

  async disconnect() {
    console.log('Disconnected from mock NocoDB service')
  }

  isConnected() {
    return true
  }

  async getEpisodes() {
    return [
      {
        id: 1,
        transistorId: 'ep-001',
        title: 'Introduction to Conversion Rate Optimization',
        slug: 'intro-to-cro',
        description: 'Learn the fundamentals of CRO and how to improve your website conversions.',
        summary: 'An introduction to CRO basics, testing methodologies, and best practices.',
        episodeNumber: 1,
        season: 1,
        language: 'en',
        duration: 2400,
        mediaUrl: 'https://example.com/episodes/ep001.mp3',
        publishedAt: new Date('2024-01-15'),
        status: 'published',
        hosts: [{ slug: 'guido-jansen', name: 'Guido X Jansen' }],
        guests: [{ slug: 'sarah-johnson', name: 'Sarah Johnson' }],
        platforms: [{ slug: 'spotify', name: 'Spotify' }],
        aiKeywords: 'CRO, conversion optimization, testing, analytics',
        aiSummary: 'Introduction to CRO fundamentals and testing strategies',
        aiTranscriptText: 'Welcome to the CROCAFE podcast. Today we discuss...',
        showNotes: '- CRO fundamentals\n- Testing methodologies\n- Best practices',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 2,
        transistorId: 'ep-002',
        title: 'Introductie tot Conversie Optimalisatie',
        slug: 'introductie-conversie',
        description: 'Leer de fundamenten van conversie optimalisatie voor Nederlandse websites.',
        summary: 'Een introductie tot CO basics en best practices.',
        episodeNumber: 2,
        season: 1,
        language: 'nl',
        duration: 2700,
        mediaUrl: 'https://example.com/episodes/ep002.mp3',
        publishedAt: new Date('2024-01-20'),
        status: 'published',
        hosts: [{ slug: 'guido-jansen', name: 'Guido X Jansen' }],
        guests: [{ slug: 'piet-vries', name: 'Piet de Vries' }],
        platforms: [{ slug: 'spotify', name: 'Spotify' }],
        aiKeywords: 'conversie optimalisatie, testen, analyse',
        aiSummary: 'Introductie tot conversie optimalisatie fundamenten',
        aiTranscriptText: 'Welkom bij de CROCAFE podcast. Vandaag bespreken we...',
        showNotes: '- CO fundamenten\n- Test methodologieën\n- Beste praktijken',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      }
    ]
  }

  async getGuests() {
    return [
      {
        id: 1,
        slug: 'sarah-johnson',
        name: 'Sarah Johnson',
        bio: 'Senior CRO Specialist with 8+ years of experience in e-commerce optimization.',
        company: 'ConversionLab',
        role: 'Senior CRO Specialist',
        episodeCount: 1,
        episodes: [{ slug: 'intro-to-cro', id: 1 }],
        languages: ['en'],
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com/in/sarahjohnson' },
          { platform: 'twitter', url: 'https://twitter.com/sarahcro' }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10')
      },
      {
        id: 2,
        slug: 'piet-vries',
        name: 'Piet de Vries',
        bio: 'Nederlandse conversie expert gespecialiseerd in e-commerce optimalisatie.',
        company: 'ConversieExperts BV',
        role: 'Lead Conversion Consultant',
        episodeCount: 1,
        episodes: [{ slug: 'introductie-conversie', id: 2 }],
        languages: ['nl'],
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com/in/pietdevries' }
        ],
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-15')
      }
    ]
  }

  async getHosts() {
    return [
      {
        id: 1,
        slug: 'guido-jansen',
        name: 'Guido X Jansen',
        bio: 'Global Business & Technology Evangelist, CRO expert, and podcast host.',
        episodes: [
          { slug: 'intro-to-cro', id: 1 },
          { slug: 'introductie-conversie', id: 2 }
        ],
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com/in/guidoxjansen' },
          { platform: 'twitter', url: 'https://twitter.com/guidojansen' },
          { platform: 'website', url: 'https://gui.do' }
        ],
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-01')
      }
    ]
  }

  async getPlatforms() {
    return [
      {
        id: 1,
        name: 'Spotify',
        slug: 'spotify',
        displayOrder: 1,
        isActive: true,
        urls: {
          en: 'https://open.spotify.com/show/crocafe-en',
          nl: 'https://open.spotify.com/show/crocafe-nl',
          de: 'https://open.spotify.com/show/crocafe-de',
          es: 'https://open.spotify.com/show/crocafe-es'
        },
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 2,
        name: 'Apple Podcasts',
        slug: 'apple-podcasts',
        displayOrder: 2,
        isActive: true,
        urls: {
          en: 'https://podcasts.apple.com/show/crocafe-en',
          nl: 'https://podcasts.apple.com/show/crocafe-nl',
          de: 'https://podcasts.apple.com/show/crocafe-de',
          es: 'https://podcasts.apple.com/show/crocafe-es'
        },
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-01')
      }
    ]
  }
}

async function testContentGeneration() {
  console.log('🧪 Testing Content Generation with Mock Data')
  console.log('=============================================')

  try {
    // Create test output directory
    const testOutputDir = 'test-content-output'
    
    // Clean up previous test output
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true })
    } catch {}

    // Initialize mock service and generator
    const mockService = new MockNocoDBService() as any
    const generator = new ContentGenerator(mockService, {
      outputDir: testOutputDir,
      overwriteExisting: true,
      generateRelationships: true,
      validateFrontmatter: true,
      languages: ['en', 'nl'],
      defaultLanguage: 'en'
    })

    // Generate content
    const stats = await generator.generateAll()

    // Display results
    console.log('\n📊 Test Results')
    console.log('================')
    console.log(`Episodes: ${stats.episodesGenerated}`)
    console.log(`Guests: ${stats.guestsGenerated}`)
    console.log(`Hosts: ${stats.hostsGenerated}`)
    console.log(`Platforms: ${stats.platformsGenerated}`)
    
    if (stats.endTime) {
      const duration = stats.endTime.getTime() - stats.startTime.getTime()
      console.log(`Duration: ${duration}ms`)
    }

    if (stats.errors.length > 0) {
      console.log(`\n⚠️ Errors (${stats.errors.length}):`)
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }

    // List generated files
    console.log('\n📁 Generated Files:')
    await listGeneratedFiles(testOutputDir)

    // Show sample content
    console.log('\n📄 Sample Content:')
    await showSampleContent(testOutputDir)

    console.log('\n✅ Test completed successfully!')
    console.log(`\n💡 Generated content available in: ${testOutputDir}/`)

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

async function listGeneratedFiles(dir: string) {
  try {
    const files = await getAllFiles(dir)
    files.forEach(file => {
      console.log(`  ${file}`)
    })
  } catch (error) {
    console.log('  No files generated or directory not found')
  }
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath)
        files.push(...subFiles)
      } else {
        files.push(fullPath)
      }
    }
  } catch {}
  
  return files
}

async function showSampleContent(dir: string) {
  try {
    // Show first episode
    const episodeFile = join(dir, 'episodes/en/season-1/episode-001-intro-to-cro.mdx')
    const episodeContent = await fs.readFile(episodeFile, 'utf8')
    console.log('\n📝 Sample Episode (first 20 lines):')
    console.log(episodeContent.split('\n').slice(0, 20).join('\n'))
    console.log('...')

    // Show first guest
    const guestFile = join(dir, 'guests/sarah-johnson.mdx')
    const guestContent = await fs.readFile(guestFile, 'utf8')
    console.log('\n👤 Sample Guest (first 15 lines):')
    console.log(guestContent.split('\n').slice(0, 15).join('\n'))
    console.log('...')

    // Show platform
    const platformFile = join(dir, 'platforms/spotify.json')
    const platformContent = await fs.readFile(platformFile, 'utf8')
    console.log('\n🎵 Sample Platform:')
    console.log(platformContent)

  } catch (error) {
    console.log('Could not read sample files:', error)
  }
}

// Run the test
testContentGeneration().catch(console.error)