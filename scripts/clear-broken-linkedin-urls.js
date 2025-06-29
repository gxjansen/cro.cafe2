#!/usr/bin/env node

/**
 * Clear Broken LinkedIn URLs Script
 *
 * This script:
 * 1. Gets all guests with LinkedIn URLs from NocoDB
 * 2. Uses Apify to test a batch of URLs
 * 3. Compares input vs output to find failed URLs
 * 4. Clears the linkedin_url field for failed profiles in NocoDB
 *
 * Usage:
 * node scripts/clear-broken-linkedin-urls.js
 */

import 'dotenv/config'

// Configuration from environment variables
const NOCODB_API_URL = process.env.NOCODB_API_URL
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN
const APIFY_TOKEN = process.env.APIFY_TOKEN
const LINKEDIN_SCRAPER_ID = 'dev_fusion/linkedin-profile-scraper' // Your actor ID

if (!NOCODB_API_URL || !NOCODB_API_TOKEN || !APIFY_TOKEN) {
  console.error('❌ Missing environment variables. Please set:')
  console.error('   NOCODB_API_URL')
  console.error('   NOCODB_API_TOKEN')
  console.error('   APIFY_TOKEN')
  process.exit(1)
}

/**
 * Get all guests with LinkedIn URLs from NocoDB
 */
async function getGuestsWithLinkedIn() {
  try {
    console.log('📡 Fetching guests with LinkedIn URLs from NocoDB...')

    const response = await fetch(
      `${NOCODB_API_URL}/api/v1/tables/Guests/records?where=(linkedin_url,not,null)&limit=1000`,
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
    console.log(`✅ Found ${data.list?.length || 0} guests with LinkedIn URLs`)
    return data.list || []

  } catch (error) {
    console.error('❌ Failed to fetch guests from NocoDB:', error.message)
    throw error
  }
}

/**
 * Test LinkedIn URLs using Apify
 */
async function testLinkedInUrlsWithApify(linkedinUrls) {
  try {
    console.log(`🔍 Testing ${linkedinUrls.length} LinkedIn URLs with Apify...`)

    const apifyInput = {
      urls: linkedinUrls,
      maxRequestRetries: 1,
      requestTimeoutSecs: 30
    }

    const response = await fetch(`https://api.apify.com/v2/acts/${LINKEDIN_SCRAPER_ID}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_TOKEN}`
      },
      body: JSON.stringify(apifyInput)
    })

    if (!response.ok) {
      throw new Error(`Apify API error: ${response.status} ${response.statusText}`)
    }

    const runData = await response.json()
    const runId = runData.data.id

    console.log(`⏳ Apify run started: ${runId}`)
    console.log(`🔗 Monitor at: https://console.apify.com/view/runs/${runId}`)

    // Wait for the run to complete
    await waitForApifyRun(runId)

    // Get the results
    const results = await getApifyResults(runId)
    console.log(`✅ Apify returned ${results.length} successful profiles`)

    return results

  } catch (error) {
    console.error('❌ Failed to test URLs with Apify:', error.message)
    throw error
  }
}

/**
 * Wait for Apify run to complete
 */
async function waitForApifyRun(runId, maxWaitTime = 300000) { // 5 minutes max
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(`https://api.apify.com/v2/acts/runs/${runId}`, {
      headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
    })

    const runData = await response.json()
    const status = runData.data.status

    console.log(`⏳ Run status: ${status}`)

    if (status === 'SUCCEEDED') {
      console.log('✅ Apify run completed successfully')
      return
    } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run failed with status: ${status}`)
    }

    // Wait 10 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 10000))
  }

  throw new Error('Apify run timed out')
}

/**
 * Get results from completed Apify run
 */
async function getApifyResults(runId) {
  const response = await fetch(`https://api.apify.com/v2/acts/runs/${runId}/dataset/items`, {
    headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
  })

  if (!response.ok) {
    throw new Error(`Failed to get Apify results: ${response.status}`)
  }

  return await response.json()
}

/**
 * Find failed LinkedIn URLs by comparing input vs output
 */
function findFailedUrls(inputGuests, apifyResults) {
  console.log('🔍 Comparing input vs output to find failed URLs...')

  const successfulUrls = new Set(
    apifyResults.map(result => result.linkedinUrl || result.url)
  )

  const failedGuests = inputGuests.filter(guest =>
    !successfulUrls.has(guest.linkedin_url)
  )

  console.log(`❌ Found ${failedGuests.length} failed LinkedIn URLs:`)
  failedGuests.forEach(guest => {
    console.log(`   - ${guest.name}: ${guest.linkedin_url}`)
  })

  return failedGuests
}

/**
 * Clear LinkedIn URLs for failed profiles in NocoDB
 */
async function clearFailedLinkedInUrls(failedGuests) {
  if (failedGuests.length === 0) {
    console.log('✅ No failed URLs to clear')
    return
  }

  console.log(`🧹 Clearing LinkedIn URLs for ${failedGuests.length} failed profiles...`)

  const clearPromises = failedGuests.map(async guest => {
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
            linkedin_scrape_error_reason: 'Profile no longer accessible',
            linkedin_scrape_last_attempt: new Date().toISOString()
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to update ${guest.name}: ${response.status}`)
      }

      console.log(`✅ Cleared LinkedIn URL for: ${guest.name}`)
      return guest

    } catch (error) {
      console.error(`❌ Failed to clear URL for ${guest.name}:`, error.message)
      throw error
    }
  })

  const results = await Promise.allSettled(clearPromises)
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log('\n📊 Results:')
  console.log(`   ✅ Successfully cleared: ${successful}`)
  console.log(`   ❌ Failed to clear: ${failed}`)
}

/**
 * Generate report
 */
function generateReport(inputGuests, failedGuests, timestamp) {
  const report = {
    timestamp,
    summary: {
      totalGuests: inputGuests.length,
      failedUrls: failedGuests.length,
      successRate: ((inputGuests.length - failedGuests.length) / inputGuests.length * 100).toFixed(1)
    },
    failedProfiles: failedGuests.map(guest => ({
      id: guest.id,
      name: guest.name,
      brokenLinkedinUrl: guest.linkedin_url
    }))
  }

  const reportPath = `./broken-linkedin-cleanup-${timestamp}.json`
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log(`\n📄 Report saved: ${reportPath}`)
  return report
}

/**
 * Main execution
 */
async function main() {
  const timestamp = new Date().toISOString().split('T')[0]

  try {
    console.log('🚀 Starting LinkedIn URL validation and cleanup...\n')

    // 1. Get all guests with LinkedIn URLs
    const guests = await getGuestsWithLinkedIn()

    if (guests.length === 0) {
      console.log('ℹ️  No guests with LinkedIn URLs found')
      return
    }

    // 2. Extract LinkedIn URLs for testing
    const linkedinUrls = guests.map(guest => guest.linkedin_url)

    // 3. Test URLs with Apify
    const apifyResults = await testLinkedInUrlsWithApify(linkedinUrls)

    // 4. Find failed URLs
    const failedGuests = findFailedUrls(guests, apifyResults)

    // 5. Clear failed LinkedIn URLs in NocoDB
    await clearFailedLinkedInUrls(failedGuests)

    // 6. Generate report
    const report = generateReport(guests, failedGuests, timestamp)

    console.log(`\n${  '='.repeat(60)}`)
    console.log('🎉 CLEANUP COMPLETED')
    console.log('='.repeat(60))
    console.log(`📊 Total profiles processed: ${guests.length}`)
    console.log(`❌ Broken URLs found and cleared: ${failedGuests.length}`)
    console.log(`✅ Valid URLs remaining: ${guests.length - failedGuests.length}`)
    console.log(`📈 Success rate: ${report.summary.successRate}%`)

    if (failedGuests.length > 0) {
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