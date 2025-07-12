#!/usr/bin/env tsx

/**
 * Robust NocoDB Content Generation Script
 * Tests multiple API patterns to find the working connection
 */

import { SimpleContentGenerator } from '../src/lib/engines/simple-content-generator.js'
import { NocoDBDirectClient } from '../src/lib/services/nocodb-direct-client.js'
import type { Language } from '../src/types/index.js'

async function main() {
  console.log('🚀 CROCAFE Robust Content Generator')
  console.log('===================================')

  try {
    // Get environment variables
    const baseUrl = process.env.NOCODB_BASE_URL
    const apiKey = process.env.NOCODB_API_KEY
    const baseId = process.env.NOCODB_BASE_ID

    if (!baseUrl || !apiKey || !baseId) {
      throw new Error('Missing required environment variables: NOCODB_BASE_URL, NOCODB_API_KEY, NOCODB_BASE_ID')
    }

    console.log('🔗 Testing NocoDB connection with multiple API patterns...')
    console.log(`📍 Base URL: ${baseUrl}`)
    console.log(`🆔 Base ID: ${baseId}`)
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`)

    // Initialize robust NocoDB client
    const client = new NocoDBDirectClient({
      baseUrl,
      apiKey,
      baseId
    })

    // Test connection
    console.log('🧪 Testing connection...')
    const connected = await client.testConnection()
    console.log(`${connected ? '✅' : '❌'} Connection test: ${connected ? 'SUCCESS' : 'FAILED'}`)

    // Test data retrieval for each table
    console.log('\n🧪 Testing data retrieval...')

    try {
      const episodes = await client.getEpisodes({ limit: 1 })
      console.log(`✅ Episodes: Found ${episodes.length} records`)
      if (episodes.length > 0) {
        console.log(`   Sample episode: ${episodes[0].title || episodes[0].Id}`)
      }
    } catch (error) {
      console.log(`❌ Episodes: ${error}`)
    }

    try {
      const guests = await client.getGuests({ limit: 1 })
      console.log(`✅ Guests: Found ${guests.length} records`)
      if (guests.length > 0) {
        console.log(`   Sample guest: ${guests[0].name || guests[0].Id}`)
      }
    } catch (error) {
      console.log(`❌ Guests: ${error}`)
    }

    try {
      const hosts = await client.getHosts({ limit: 1 })
      console.log(`✅ Hosts: Found ${hosts.length} records`)
      if (hosts.length > 0) {
        console.log(`   Sample host: ${hosts[0].name || hosts[0].Id}`)
      }
    } catch (error) {
      console.log(`❌ Hosts: ${error}`)
    }

    try {
      const platforms = await client.getPlatforms({ limit: 1 })
      console.log(`✅ Platforms: Found ${platforms.length} records`)
      if (platforms.length > 0) {
        console.log(`   Sample platform: ${platforms[0].name || platforms[0].Id}`)
      }
    } catch (error) {
      console.log(`❌ Platforms: ${error}`)
    }

    console.log('\n🎯 NocoDB API discovery complete!')
    console.log('Check the logs above to see which endpoints work.')

  } catch (error) {
    console.error('\n❌ Robust content generation failed:')
    console.error(error instanceof Error ? error.message : String(error))

    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }

    process.exit(1)
  }
}

// Run the script
main().catch((error) => {
  console.error('Script execution failed:', error)
  process.exit(1)
})