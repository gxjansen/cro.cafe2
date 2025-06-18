#!/usr/bin/env tsx

// NocoDB Content Generation Script - Manual trigger test
import { ContentGenerator } from '../src/lib/engines/content-generator.js'
import { NocoDBService } from '../src/lib/services/nocodb-service.js'
import type { Language } from '../src/types/index.js'

/**
 * CROCAFE Content Generation Script
 * 
 * Generates MDX files from NocoDB data for Astro Content Collections
 * Supports multi-language content and cross-references
 */

interface CLIOptions {
  overwrite?: boolean
  languages?: Language[]
  outputDir?: string
  help?: boolean
}

async function main() {
  const args = process.argv.slice(2)
  const options = parseArguments(args)

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  console.log('🚀 CROCAFE Content Generator')
  console.log('============================')

  try {
    // Initialize NocoDB service
    const nocodbService = new NocoDBService({
      nocodb: {
        server: process.env.NOCODB_BASE_URL || 'http://localhost:8080',
        apiKey: process.env.NOCODB_API_KEY || 'test-api-key',
        timeout: 30000,
        retryPolicy: {
          maxAttempts: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 10000
        }
      },
      connection: {
        poolSize: 5,
        keepAlive: true,
        reconnectInterval: 30000
      }
    })

    // Initialize content generator
    const generator = new ContentGenerator(nocodbService, {
      outputDir: options.outputDir || 'src/content',
      overwriteExisting: options.overwrite || false,
      generateRelationships: true,
      validateFrontmatter: true,
      languages: options.languages || ['en', 'nl', 'de', 'es'],
      defaultLanguage: 'en'
    })

    // Generate all content
    const stats = await generator.generateAll()

    // Display results
    console.log('\n📊 Generation Summary')
    console.log('=====================')
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
      process.exit(1)
    }

    console.log('\n✅ Content generation completed successfully!')
    
    // Disconnect from NocoDB
    await nocodbService.disconnect()

  } catch (error) {
    console.error('\n❌ Content generation failed:')
    console.error(error instanceof Error ? error.message : String(error))
    
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    
    process.exit(1)
  }
}

function parseArguments(args: string[]): CLIOptions {
  const options: CLIOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--overwrite':
      case '-o':
        options.overwrite = true
        break

      case '--languages':
      case '-l':
        const langArg = args[++i]
        if (langArg) {
          options.languages = langArg.split(',') as Language[]
        }
        break

      case '--output':
      case '-d':
        options.outputDir = args[++i]
        break

      case '--help':
      case '-h':
        options.help = true
        break

      default:
        if (arg.startsWith('-')) {
          console.warn(`Unknown option: ${arg}`)
        }
        break
    }
  }

  return options
}

function showHelp() {
  console.log(`
CROCAFE Content Generator

Usage: npm run generate-content [options]

Options:
  -o, --overwrite          Overwrite existing files
  -l, --languages <langs>  Comma-separated list of languages (default: en,nl,de,es)
  -d, --output <dir>       Output directory (default: src/content)
  -h, --help               Show this help message

Examples:
  npm run generate-content                    # Generate all content
  npm run generate-content --overwrite        # Overwrite existing files
  npm run generate-content -l en,nl           # Generate only EN and NL content
  npm run generate-content -d dist/content    # Custom output directory

Environment Variables:
  NOCODB_BASE_URL     NocoDB server URL (required)
  NOCODB_API_KEY      NocoDB API key (required)

Data Flow:
  NocoDB → Content Generator → MDX/JSON files → Astro Content Collections
`)
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Run the script
main().catch((error) => {
  console.error('Script execution failed:', error)
  process.exit(1)
})