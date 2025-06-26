#!/usr/bin/env node

/**
 * Quick LinkedIn URL Tester
 * Test individual LinkedIn URLs to see what status codes they return
 */

async function testLinkedInUrl(url) {
  try {
    console.log(`\n🔍 Testing: ${url}`);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'manual'
    });

    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      console.log(`Redirect to: ${location}`);
    }

    // Test with full GET request too
    console.log('\n🔍 Testing with GET request...');
    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });

    console.log(`GET Status: ${getResponse.status}`);
    console.log(`Final URL: ${getResponse.url}`);
    
    return {
      headStatus: response.status,
      getStatus: getResponse.status,
      finalUrl: getResponse.url,
      accessible: getResponse.status === 200
    };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { error: error.message };
  }
}

// Test the known broken URL
const brokenUrl = 'https://www.linkedin.com/in/bas-wouters-cmct-b50a9216/';
console.log('Testing known broken LinkedIn URL...');
testLinkedInUrl(brokenUrl);

export { testLinkedInUrl };