#!/usr/bin/env node

/**
 * Clear Broken LinkedIn URLs Script (Simplified Version)
 *
 * This script validates LinkedIn URLs and clears broken ones from NocoDB.
 * Since LinkedIn blocks most automated requests with status 999,
 * this script provides options:
 * 1. Manual validation with a list of known broken URLs
 * 2. Batch validation using the existing validate-linkedin-urls.js results
 *
 * Usage:
 * node scripts/clear-broken-linkedin-urls-simple.js [--manual-list broken-urls.txt]
 * node scripts/clear-broken-linkedin-urls-simple.js [--validation-report validation-report.json]
 */

import 'dotenv/config'
import { promises as fs } from 'fs'

// Configuration from environment variables
const NOCODB_API_URL = process.env.NOCODB_API_URL
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN

if (!NOCODB_API_URL || !NOCODB_API_TOKEN) {
  console.error('❌ Missing environment variables. Please set:')
  console.error('   NOCODB_API_URL')
  console.error('   NOCODB_API_TOKEN')
  process.exit(1)
}

/**
 * Get all guests from NocoDB
 */
async function getAllGuests() {
  try {
    console.log('📡 Fetching all guests from NocoDB...')

    const response = await fetch(
      `${NOCODB_API_URL}/api/v1/tables/Guests/records?limit=1000`,
      {
        headers: {
          'xc-token': NOCODB_API_TOKEN
        }
      }
    )

    if (!response.ok) {
      throw new Error(`NocoDB API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Found ${data.list?.length || 0} total guests`)
    return data.list || []

  } catch (error) {
    console.error('❌ Failed to fetch guests from NocoDB:', error.message)
    throw error
  }
}

/**
 * Load broken URLs from manual list file
 */
async function loadManualList(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const urls = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')) // Skip empty lines and comments

    console.log(`📄 Loaded ${urls.length} URLs from manual list`)
    return urls
  } catch (error) {
    console.error(`❌ Failed to load manual list: ${error.message}`)
    throw error
  }
}

/**
 * Load broken URLs from validation report
 */
async function loadValidationReport(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const report = JSON.parse(content)

    // Extract invalid URLs from the report
    const brokenUrls = report.results
      .filter(result => result.status === 'invalid' || result.status === 'error')
      .map(result => result.url)

    console.log(`📄 Loaded ${brokenUrls.length} broken URLs from validation report`)
    return brokenUrls
  } catch (error) {
    console.error(`❌ Failed to load validation report: ${error.message}`)
    throw error
  }
}

/**
 * Clear LinkedIn URL for a single guest
 */
async function clearLinkedInUrl(guest) {
  try {
    const response = await fetch(
      `${NOCODB_API_URL}/api/v1/tables/Guests/records/${guest.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_API_TOKEN
        },
        body: JSON.stringify({
          linkedin_url: null, // Clear the LinkedIn URL
          linkedin_scrape_status: 'invalid_url',
          linkedin_scrape_error_reason: 'Profile no longer accessible (404)',
          linkedin_scrape_last_attempt: new Date().toISOString()
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error(`❌ Failed to clear URL for ${guest.name}:`, error.message)
    return false
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const timestamp = new Date().toISOString().split('T')[0]

  try {
    console.log('🚀 Starting LinkedIn URL cleanup (Simple Version)...\n')

    // Determine source of broken URLs
    let brokenUrls = []

    if (args.includes('--manual-list')) {
      const fileIndex = args.indexOf('--manual-list') + 1
      const filePath = args[fileIndex]
      if (!filePath) {
        console.error('❌ Please provide a file path after --manual-list')
        process.exit(1)
      }
      brokenUrls = await loadManualList(filePath)

    } else if (args.includes('--validation-report')) {
      const fileIndex = args.indexOf('--validation-report') + 1
      const filePath = args[fileIndex]
      if (!filePath) {
        console.error('❌ Please provide a file path after --validation-report')
        process.exit(1)
      }
      brokenUrls = await loadValidationReport(filePath)

    } else {
      console.log('ℹ️  No input source specified. Using example broken URLs for testing...')
      // Example broken URLs from your message
      brokenUrls = [
        'https://www.linkedin.com/in/bas-wouters-cmct-b50a9216/',
        'https://www.linkedin.com/in/theclvlady'
      ]
    }

    // Normalize URLs (remove protocol and trailing slash for comparison)
    const normalizedBrokenUrls = brokenUrls.map(url =>
      url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    )

    // Get all guests from NocoDB
    const allGuests = await getAllGuests()

    // Find guests with broken LinkedIn URLs
    const guestsWithBrokenUrls = allGuests.filter(guest => {
      if (!guest.linkedin_url) {return false}

      const normalizedGuestUrl = guest.linkedin_url
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')

      return normalizedBrokenUrls.includes(normalizedGuestUrl)
    })

    console.log(`\n🔍 Found ${guestsWithBrokenUrls.length} guests with broken LinkedIn URLs:`)
    guestsWithBrokenUrls.forEach(guest => {
      console.log(`   - ${guest.name}: ${guest.linkedin_url}`)
    })

    if (guestsWithBrokenUrls.length === 0) {
      console.log('\n✅ No broken URLs found to clear')
      return
    }

    // Confirm before proceeding
    console.log(`\n⚠️  About to clear LinkedIn URLs for ${guestsWithBrokenUrls.length} guests.`)
    console.log('   This will set their linkedin_url field to null in NocoDB.')

    // Clear the URLs
    console.log('\n🧹 Clearing broken LinkedIn URLs...')
    let successCount = 0
    let failCount = 0

    for (const guest of guestsWithBrokenUrls) {
      const success = await clearLinkedInUrl(guest)
      if (success) {
        successCount++
        console.log(`   ✅ Cleared: ${guest.name}`)
      } else {
        failCount++
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Generate report
    const report = {
      timestamp,
      source: args[0] || 'example_urls',
      summary: {
        totalBrokenUrls: brokenUrls.length,
        guestsFound: guestsWithBrokenUrls.length,
        successfullyCleaned: successCount,
        failed: failCount
      },
      clearedProfiles: guestsWithBrokenUrls.map(guest => ({
        id: guest.id,
        name: guest.name,
        clearedUrl: guest.linkedin_url
      }))
    }

    const reportPath = `./linkedin-cleanup-${timestamp}.json`
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

    console.log(`\n${  '='.repeat(60)}`)
    console.log('🎉 CLEANUP COMPLETED')
    console.log('='.repeat(60))
    console.log(`📊 Broken URLs provided: ${brokenUrls.length}`)
    console.log(`👥 Matching guests found: ${guestsWithBrokenUrls.length}`)
    console.log(`✅ Successfully cleared: ${successCount}`)
    console.log(`❌ Failed to clear: ${failCount}`)
    console.log(`📄 Report saved: ${reportPath}`)

    if (successCount > 0) {
      console.log('\n💡 Next steps:')
      console.log('   1. Check NocoDB for guests with empty linkedin_url fields')
      console.log('   2. Manually research and add correct LinkedIn URLs')
      console.log('   3. Re-run your LinkedIn enrichment workflow')
    }

  } catch (error) {
    console.error('\n💥 Script failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main }