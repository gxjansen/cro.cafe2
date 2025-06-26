#!/usr/bin/env node

/**
 * Test LinkedIn URL detection without Apify
 * Testing if we can detect broken LinkedIn profiles by response status/content
 */

async function testLinkedInUrl(url) {
  console.log(`\n🔍 Testing: ${url}`);
  
  try {
    // Try with standard fetch
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow'
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Final URL: ${response.url}`);
    
    // Check content for error indicators
    const text = await response.text();
    const textSnippet = text.substring(0, 500);
    
    // Common LinkedIn error patterns
    const errorPatterns = [
      'This LinkedIn Page isn\'t available',
      'Page not found',
      'This page doesn\'t exist',
      'The page you requested does not exist',
      'content is not available',
      'Oops!',
      '404'
    ];
    
    const hasErrorPattern = errorPatterns.some(pattern => 
      text.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // Check for successful profile indicators
    const successPatterns = [
      '<title>',
      'profile-card',
      'experience-section',
      'member-',
      'voyager-'
    ];
    
    const hasSuccessPattern = successPatterns.some(pattern => 
      text.includes(pattern)
    );
    
    console.log(`   Has error pattern: ${hasErrorPattern}`);
    console.log(`   Has success pattern: ${hasSuccessPattern}`);
    console.log(`   Content length: ${text.length} bytes`);
    
    // Determine if URL is valid
    const isValid = response.status === 200 && !hasErrorPattern && hasSuccessPattern;
    console.log(`   ✅ Result: ${isValid ? 'VALID' : 'BROKEN'}`);
    
    return {
      url,
      status: response.status,
      finalUrl: response.url,
      hasErrorPattern,
      hasSuccessPattern,
      contentLength: text.length,
      isValid
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      url,
      status: null,
      error: error.message,
      isValid: false
    };
  }
}

async function main() {
  console.log('🧪 Testing LinkedIn URL detection without Apify\n');
  
  const testUrls = [
    // Working URLs
    'https://www.linkedin.com/in/aleyda/',
    'https://www.linkedin.com/in/anasoplon/',
    // Broken URLs
    'https://www.linkedin.com/in/bas-wouters-cmct-b50a9216/',
    'https://www.linkedin.com/in/theclvlady'
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    const result = await testLinkedInUrl(url);
    results.push(result);
    
    // Wait 2 seconds between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const working = results.filter(r => r.isValid);
  const broken = results.filter(r => !r.isValid);
  
  console.log('\n✅ Working URLs:');
  working.forEach(r => console.log(`   - ${r.url}`));
  
  console.log('\n❌ Broken URLs:');
  broken.forEach(r => console.log(`   - ${r.url} (Status: ${r.status || 'Error'})`));
  
  console.log('\n💡 Detection method:');
  console.log('   - Status code 200 + No error patterns + Has success patterns = VALID');
  console.log('   - Any other combination = BROKEN');
}

// Run the test
main().catch(console.error);