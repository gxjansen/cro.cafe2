#!/usr/bin/env node

/**
 * Test the provided LinkedIn URLs to understand the patterns
 */

async function testUrl(url, description) {
  console.log(`\n🔍 Testing ${description}: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });

    console.log(`Status: ${response.status}`);
    console.log(`Final URL: ${response.url}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    // Check if we got redirected to an error page
    if (response.url.includes('/404') || response.url.includes('/error')) {
      console.log(`❌ Redirected to error page`);
    }
    
    // Get a small sample of the content to check for error indicators
    const text = await response.text();
    const textSample = text.substring(0, 500).toLowerCase();
    
    if (textSample.includes('page not found') || 
        textSample.includes('profile not found') ||
        textSample.includes('this profile doesn\'t exist') ||
        textSample.includes('linkedin member\'s profile') ||
        response.url.includes('linkedin.com/404') ||
        response.url.includes('linkedin.com/in/unavailable')) {
      console.log(`❌ Profile not found (content indicates error)`);
    } else if (response.status === 200) {
      console.log(`✅ Profile appears to be valid`);
    }
    
    return {
      url,
      status: response.status,
      finalUrl: response.url,
      valid: response.status === 200 && !response.url.includes('/404') && !response.url.includes('/error')
    };
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    return { url, error: error.message, valid: false };
  }
}

async function main() {
  console.log('Testing LinkedIn URL examples...\n');
  
  const workingUrls = [
    'https://www.linkedin.com/in/aleyda/',
    'https://www.linkedin.com/in/anasoplon/'
  ];
  
  const brokenUrls = [
    'https://www.linkedin.com/in/bas-wouters-cmct-b50a9216/',
    'https://www.linkedin.com/in/theclvlady'
  ];
  
  console.log('='.repeat(50));
  console.log('TESTING WORKING URLs');
  console.log('='.repeat(50));
  
  for (const url of workingUrls) {
    await testUrl(url, 'Working URL');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('TESTING BROKEN URLs');
  console.log('='.repeat(50));
  
  for (const url of brokenUrls) {
    await testUrl(url, 'Broken URL');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }
}

main().catch(console.error);