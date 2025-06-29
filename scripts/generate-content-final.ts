#!/usr/bin/env tsx

/**
 * Final Working NocoDB Content Generation Script
 * Uses the confirmed working API patterns from diagnostic
 */

import { config } from 'dotenv'
config() // Load environment variables from .env file

import { SimpleContentGenerator } from '../src/lib/engines/simple-content-generator.js'
import { NocoDBWorkingClient } from '../src/lib/services/nocodb-working-client.js'
import type { Language } from '../src/types/index.js'

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

  console.log('🚀 CROCAFE Final Content Generator (Working API)')
  console.log('===============================================')

  try {
    // Get environment variables
    const baseUrl = process.env.NOCODB_BASE_URL
    const apiKey = process.env.NOCODB_API_KEY
    const baseId = process.env.NOCODB_BASE_ID

    if (!baseUrl || !apiKey || !baseId) {
      throw new Error('Missing required environment variables: NOCODB_BASE_URL, NOCODB_API_KEY, NOCODB_BASE_ID')
    }

    console.log('🔗 Connecting to NocoDB with confirmed working API...')
    console.log(`📍 Base URL: ${baseUrl}`)
    console.log(`🆔 Base ID: ${baseId}`)
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`)

    // Initialize working NocoDB client
    const client = new NocoDBWorkingClient({
      baseUrl,
      apiKey,
      baseId
    })

    // Test connection
    const connected = await client.testConnection()
    if (!connected) {
      throw new Error('Failed to connect to NocoDB - check your credentials')
    }
    console.log('✅ Connected to NocoDB successfully')

    // Initialize content generator
    const generator = new SimpleContentGenerator(client, {
      outputDir: options.outputDir || 'src/content',
      overwriteExisting: options.overwrite !== false, // Default to true unless explicitly set to false
      languages: options.languages || ['en', 'nl', 'de', 'es'],
      defaultLanguage: 'en'
    })

    // Generate all content
    const stats = await generator.generateAll()

    // Display results
    console.log('\\n📊 Generation Summary')
    console.log('=====================')
    console.log(`Episodes: ${stats.episodesGenerated}`)
    console.log(`Guests: ${stats.guestsGenerated}`)
    console.log(`Hosts: ${stats.hostsGenerated}`)
    console.log(`Platforms: ${stats.platformsGenerated}`)

    // Add the format expected by the GitHub Action
    console.log(`📊 Generated: ${stats.episodesGenerated} episodes, ${stats.guestsGenerated} guests, ${stats.hostsGenerated} hosts, ${stats.platformsGenerated} platforms`)

    if (stats.endTime) {
      const duration = stats.endTime.getTime() - stats.startTime.getTime()
      console.log(`Duration: ${duration}ms`)
    }

    if (stats.errors.length > 0) {
      console.log(`\\n⚠️ Errors (${stats.errors.length}):`)
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
      process.exit(1)
    }

    console.log('\\n✅ Content generation completed successfully!')

  } catch (error) {
    console.error('\\n❌ Content generation failed:')
    console.error(error instanceof Error ? error.message : String(error))

    if (error instanceof Error && error.stack) {
      console.error('\\nStack trace:')
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
CROCAFE Final Content Generator (Working NocoDB API)

Usage: tsx scripts/generate-content-final.ts [options]

Options:
  -o, --overwrite          Overwrite existing files
  -l, --languages <langs>  Comma-separated list of languages (default: en,nl,de,es)
  -d, --output <dir>       Output directory (default: src/content)
  -h, --help               Show this help message

Examples:
  tsx scripts/generate-content-final.ts                    # Generate all content
  tsx scripts/generate-content-final.ts --overwrite        # Overwrite existing files
  tsx scripts/generate-content-final.ts -l en,nl           # Generate only EN and NL content
  tsx scripts/generate-content-final.ts -d dist/content    # Custom output directory

Environment Variables (Required):
  NOCODB_BASE_URL     NocoDB server URL
  NOCODB_API_KEY      NocoDB API key
  NOCODB_BASE_ID      NocoDB base/project ID

Data Flow:
  NocoDB API (Working Endpoints) → Content Generator → MDX/JSON files → Astro Content Collections
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