#!/usr/bin/env node

/**
 * LinkedIn URL Validation Script
 * Tests all LinkedIn URLs in NocoDB to find 404s and broken links
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Configuration
const NOCODB_API_URL = process.env.NOCODB_API_URL || 'your-nocodb-url';
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN || 'your-token';
const BATCH_SIZE = 5; // Process 5 URLs at a time to avoid rate limiting
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches

// Results tracking
const results = {
  valid: [],
  invalid: [],
  errors: [],
  redirected: [],
  total: 0
};

/**
 * Test a single LinkedIn URL
 */
async function validateLinkedInUrl(url, guestData) {
  try {
    console.log(`Testing: ${url}`);
    
    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to avoid downloading full page
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'manual', // Don't follow redirects automatically
      timeout: 10000 // 10 second timeout
    });

    const result = {
      id: guestData.id,
      name: guestData.name,
      originalUrl: url,
      status: response.status,
      finalUrl: response.url,
      redirected: response.status >= 300 && response.status < 400
    };

    // Categorize results
    if (response.status === 200) {
      results.valid.push(result);
      console.log(`✅ Valid: ${guestData.name}`);
    } else if (response.status === 404) {
      results.invalid.push({...result, reason: 'Profile not found (404)'});
      console.log(`❌ 404: ${guestData.name} - ${url}`);
    } else if (response.status >= 300 && response.status < 400) {
      // Check if redirect location is still LinkedIn
      const location = response.headers.get('location');
      if (location && location.includes('linkedin.com')) {
        results.redirected.push({...result, newUrl: location});
        console.log(`🔄 Redirected: ${guestData.name} - ${location}`);
      } else {
        results.invalid.push({...result, reason: 'Redirected away from LinkedIn'});
        console.log(`❌ Bad redirect: ${guestData.name} - ${location}`);
      }
    } else {
      results.invalid.push({...result, reason: `HTTP ${response.status}`});
      console.log(`⚠️  HTTP ${response.status}: ${guestData.name}`);
    }

    return result;

  } catch (error) {
    const errorResult = {
      id: guestData.id,
      name: guestData.name,
      originalUrl: url,
      error: error.message,
      reason: 'Network/timeout error'
    };
    
    results.errors.push(errorResult);
    console.log(`💥 Error: ${guestData.name} - ${error.message}`);
    return errorResult;
  }
}

/**
 * Get all guests with LinkedIn URLs from NocoDB
 */
async function getGuestsWithLinkedIn() {
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
      throw new Error(`NocoDB API error: ${response.status}`);
    }

    const data = await response.json();
    return data.list || [];
  } catch (error) {
    console.error('Failed to fetch guests from NocoDB:', error);
    throw error;
  }
}

/**
 * Process URLs in batches to avoid rate limiting
 */
async function processBatch(guests, startIndex) {
  const batch = guests.slice(startIndex, startIndex + BATCH_SIZE);
  
  console.log(`\n--- Processing batch ${Math.floor(startIndex / BATCH_SIZE) + 1} (${batch.length} URLs) ---`);
  
  const promises = batch.map(guest => 
    validateLinkedInUrl(guest.linkedin_url, {
      id: guest.id,
      name: guest.name || 'Unknown'
    })
  );

  await Promise.all(promises);
  
  // Wait between batches
  if (startIndex + BATCH_SIZE < guests.length) {
    console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
  }
}

/**
 * Generate detailed report
 */
function generateReport() {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      valid: results.valid.length,
      invalid: results.invalid.length,
      redirected: results.redirected.length,
      errors: results.errors.length
    },
    details: {
      invalid: results.invalid,
      redirected: results.redirected,
      errors: results.errors
    }
  };

  // Save detailed JSON report
  const reportPath = `./linkedin-url-validation-${timestamp}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate CSV for easy NocoDB import
  const csvData = [
    'ID,Name,Status,Original URL,Issue,New URL,Action Needed'
  ];

  results.invalid.forEach(item => {
    csvData.push(`${item.id},"${item.name}",INVALID,"${item.originalUrl}","${item.reason}",,UPDATE_URL`);
  });

  results.redirected.forEach(item => {
    csvData.push(`${item.id},"${item.name}",REDIRECTED,"${item.originalUrl}","Redirected","${item.newUrl}",UPDATE_URL`);
  });

  results.errors.forEach(item => {
    csvData.push(`${item.id},"${item.name}",ERROR,"${item.originalUrl}","${item.reason}",,INVESTIGATE`);
  });

  const csvPath = `./linkedin-url-issues-${timestamp}.csv`;
  fs.writeFileSync(csvPath, csvData.join('\n'));

  console.log('\n' + '='.repeat(60));
  console.log('📊 LINKEDIN URL VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log(`Total URLs tested: ${results.total}`);
  console.log(`✅ Valid: ${results.valid.length}`);
  console.log(`❌ Invalid (404/broken): ${results.invalid.length}`);
  console.log(`🔄 Redirected: ${results.redirected.length}`);
  console.log(`💥 Errors: ${results.errors.length}`);
  console.log('\n📁 Reports generated:');
  console.log(`- JSON: ${reportPath}`);
  console.log(`- CSV: ${csvPath}`);

  if (results.invalid.length > 0) {
    console.log('\n❌ PROFILES NEEDING URL UPDATES:');
    results.invalid.forEach(item => {
      console.log(`- ${item.name}: ${item.originalUrl} (${item.reason})`);
    });
  }

  if (results.redirected.length > 0) {
    console.log('\n🔄 PROFILES WITH URL REDIRECTS:');
    results.redirected.forEach(item => {
      console.log(`- ${item.name}: ${item.originalUrl} → ${item.newUrl}`);
    });
  }
}

/**
 * Test a single URL (for testing)
 */
async function testSingleUrl(url) {
  console.log(`Testing single URL: ${url}`);
  const result = await validateLinkedInUrl(url, { id: 'test', name: 'Test Profile' });
  console.log('Result:', result);
}

/**
 * Main execution
 */
async function main() {
  try {
    // Test the known broken URL first
    console.log('🧪 Testing known broken URL...');
    await testSingleUrl('https://www.linkedin.com/in/bas-wouters-cmct-b50a9216/');
    
    console.log('\n📡 Fetching guests from NocoDB...');
    const guests = await getGuestsWithLinkedIn();
    
    results.total = guests.length;
    console.log(`Found ${guests.length} guests with LinkedIn URLs`);

    if (guests.length === 0) {
      console.log('No guests with LinkedIn URLs found. Check your NocoDB connection.');
      return;
    }

    // Process in batches
    for (let i = 0; i < guests.length; i += BATCH_SIZE) {
      await processBatch(guests, i);
    }

    // Generate report
    generateReport();

  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateLinkedInUrl, main };