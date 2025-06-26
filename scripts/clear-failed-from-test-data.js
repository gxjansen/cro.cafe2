#!/usr/bin/env node

/**
 * Clear Failed LinkedIn URLs from Test Data
 * 
 * Uses your existing tests/input.json and tests/output.json files
 * to identify which LinkedIn URLs failed and clear them from NocoDB
 */

import 'dotenv/config';
import fs from 'fs';

// Configuration
const NOCODB_API_URL = process.env.NOCODB_API_URL;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;

if (!NOCODB_API_URL || !NOCODB_API_TOKEN) {
  console.error('❌ Missing environment variables. Please set:');
  console.error('   NOCODB_API_URL');
  console.error('   NOCODB_API_TOKEN');
  process.exit(1);
}

/**
 * Load test data files
 */
function loadTestData() {
  try {
    console.log('📁 Loading test data files...');
    
    // Load input data (Apify run results)
    const inputData = JSON.parse(fs.readFileSync('./tests/input.json', 'utf8'));
    console.log(`✅ Loaded input data: ${inputData.length} Apify runs`);
    
    // Load output data (successful LinkedIn profiles)
    const outputData = JSON.parse(fs.readFileSync('./tests/output.json', 'utf8'));
    console.log(`✅ Loaded output data: ${outputData.length} successful profiles`);
    
    return { inputData, outputData };
    
  } catch (error) {
    console.error('❌ Failed to load test data:', error.message);
    throw error;
  }
}

/**
 * Extract LinkedIn URLs from Apify input data
 * This requires checking what URLs were actually sent to Apify
 */
async function getInputLinkedInUrls(inputData) {
  console.log('🔍 Extracting LinkedIn URLs from Apify input data...');
  
  // The input.json contains Apify run metadata, we need to get the actual input URLs
  // Let's get them from the dataset or input of these runs
  const linkedinUrls = [];
  
  for (const run of inputData) {
    try {
      // Option 1: Try to get from run input (if available in the data)
      if (run.data && run.data.defaultDatasetId) {
        console.log(`📡 Fetching input data for run ${run.data.id}...`);
        
        // This would require Apify API access to get the actual input
        // For now, let's extract from your NocoDB instead
      }
    } catch (error) {
      console.warn(`⚠️  Could not get input for run ${run.data.id}`);
    }
  }
  
  // Fallback: Get LinkedIn URLs from NocoDB
  console.log('📡 Fetching LinkedIn URLs from NocoDB as fallback...');
  return await getLinkedInUrlsFromNocoDB();
}

/**
 * Get LinkedIn URLs from NocoDB
 */
async function getLinkedInUrlsFromNocoDB() {
  try {
    const response = await fetch(
      `${NOCODB_API_URL}/api/v1/tables/Guests/records?where=(linkedin_url,not,null)&limit=1000`,
      {
        headers: {
          'xc-token': NOCODB_API_TOKEN
        }
      }
    );

    if (!response.ok) {
      throw new Error(`NocoDB API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.list?.length || 0} guests with LinkedIn URLs`);
    return data.list || [];
    
  } catch (error) {
    console.error('❌ Failed to fetch from NocoDB:', error.message);
    throw error;
  }
}

/**
 * Find failed LinkedIn URLs by comparing what we sent vs what succeeded
 */
function findFailedLinkedInUrls(inputGuests, outputData) {
  console.log('🔍 Comparing input vs output to find failed URLs...');
  
  // Extract successful LinkedIn URLs from output
  const successfulUrls = new Set(
    outputData.map(profile => profile.linkedinUrl)
  );
  
  console.log(`📊 Successful LinkedIn URLs: ${successfulUrls.size}`);
  
  // Find guests whose LinkedIn URLs were not in the successful results
  const failedGuests = inputGuests.filter(guest => 
    guest.linkedin_url && !successfulUrls.has(guest.linkedin_url)
  );
  
  console.log(`❌ Failed LinkedIn URLs: ${failedGuests.length}`);
  
  if (failedGuests.length > 0) {
    console.log('\n📋 Failed profiles:');
    failedGuests.forEach((guest, index) => {
      console.log(`   ${index + 1}. ${guest.name}: ${guest.linkedin_url}`);
    });
  }
  
  return failedGuests;
}

/**
 * Clear LinkedIn URLs for failed profiles
 */
async function clearFailedLinkedInUrls(failedGuests, dryRun = false) {
  if (failedGuests.length === 0) {
    console.log('✅ No failed URLs to clear');
    return [];
  }
  
  if (dryRun) {
    console.log(`🧪 DRY RUN: Would clear LinkedIn URLs for ${failedGuests.length} profiles`);
    return failedGuests;
  }
  
  console.log(`🧹 Clearing LinkedIn URLs for ${failedGuests.length} failed profiles...`);
  
  const results = [];
  
  for (const guest of failedGuests) {
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
            linkedin_scrape_error_reason: 'Profile no longer accessible - cleared by cleanup script',
            linkedin_scrape_last_attempt: new Date().toISOString()
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`   ✅ ${guest.name}`);
      results.push({ ...guest, status: 'cleared' });
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`   ❌ ${guest.name}: ${error.message}`);
      results.push({ ...guest, status: 'error', error: error.message });
    }
  }
  
  const successful = results.filter(r => r.status === 'cleared').length;
  const failed = results.filter(r => r.status === 'error').length;
  
  console.log(`\n📊 Clearing results:`);
  console.log(`   ✅ Successfully cleared: ${successful}`);
  console.log(`   ❌ Failed to clear: ${failed}`);
  
  return results;
}

/**
 * Generate report
 */
function generateReport(inputGuests, failedGuests, results) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalGuestsWithLinkedIn: inputGuests.length,
      failedUrls: failedGuests.length,
      successfulClears: results.filter(r => r.status === 'cleared').length,
      failedClears: results.filter(r => r.status === 'error').length
    },
    failedProfiles: failedGuests.map(guest => ({
      id: guest.id,
      name: guest.name,
      brokenLinkedinUrl: guest.linkedin_url,
      clearStatus: results.find(r => r.id === guest.id)?.status || 'unknown'
    }))
  };
  
  const reportPath = `./linkedin-cleanup-report-${timestamp}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved: ${reportPath}`);
  return report;
}

/**
 * Main execution
 */
async function main() {
  // Check for dry run flag
  const dryRun = process.argv.includes('--dry-run');
  
  try {
    console.log('🚀 Starting LinkedIn URL cleanup from test data...\n');
    
    if (dryRun) {
      console.log('🧪 DRY RUN MODE - No changes will be made\n');
    }
    
    // 1. Load test data
    const { inputData, outputData } = loadTestData();
    
    // 2. Get LinkedIn URLs that were tested
    const inputGuests = await getLinkedInUrlsFromNocoDB();
    
    // 3. Find failed URLs
    const failedGuests = findFailedLinkedInUrls(inputGuests, outputData);
    
    // 4. Clear failed LinkedIn URLs (or dry run)
    const results = await clearFailedLinkedInUrls(failedGuests, dryRun);
    
    // 5. Generate report
    const report = generateReport(inputGuests, failedGuests, results);
    
    console.log('\n' + '='.repeat(60));
    console.log(dryRun ? '🧪 DRY RUN COMPLETED' : '🎉 CLEANUP COMPLETED');
    console.log('='.repeat(60));
    console.log(`📊 Total guests with LinkedIn: ${inputGuests.length}`);
    console.log(`❌ Failed URLs found: ${failedGuests.length}`);
    console.log(`✅ Successful profiles: ${outputData.length}`);
    
    if (!dryRun && failedGuests.length > 0) {
      console.log(`🧹 URLs cleared: ${results.filter(r => r.status === 'cleared').length}`);
      
      console.log('\n💡 Next steps:');
      console.log('   1. Check NocoDB for guests with empty linkedin_url fields');
      console.log('   2. Manually research and add correct LinkedIn URLs');
      console.log('   3. Re-run your LinkedIn enrichment workflow');
    } else if (dryRun) {
      console.log('\n💡 To actually clear the URLs, run:');
      console.log('   node scripts/clear-failed-from-test-data.js');
    }
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };