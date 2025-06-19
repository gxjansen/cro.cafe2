// Test script to debug platform data
import { getCollection } from 'astro:content';

async function testPlatforms() {
  console.log('Testing platform data...');
  
  try {
    const platforms = await getCollection('platforms');
    console.log('✅ Platform collection loaded successfully');
    console.log(`📊 Found ${platforms.length} platforms`);
    
    if (platforms.length === 0) {
      console.log('❌ No platform files found in src/content/platforms/');
      console.log('💡 Expected files like: spotify.json, apple-podcasts.json, etc.');
      return;
    }
    
    // Show platform details
    platforms.forEach((platform, index) => {
      console.log(`\n📱 Platform ${index + 1}:`);
      console.log(`   Name: ${platform.data.name}`);
      console.log(`   Slug: ${platform.data.slug}`);
      console.log(`   Icon: ${platform.data.iconUrl}`);
      console.log(`   URLs:`);
      console.log(`     EN: ${platform.data.urls.en || 'not set'}`);
      console.log(`     NL: ${platform.data.urls.nl || 'not set'}`);
      console.log(`     DE: ${platform.data.urls.de || 'not set'}`);
      console.log(`     ES: ${platform.data.urls.es || 'not set'}`);
    });
    
    // Test the validation function
    console.log('\n🔍 Testing URL validation:');
    function isValidPlatformUrl(url) {
      if (!url) return false;
      if (url.includes('example.com')) return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }
    
    ['en', 'nl', 'de', 'es'].forEach(lang => {
      const validPlatforms = platforms.filter(platform => {
        const languageUrl = platform.data.urls[lang];
        return isValidPlatformUrl(languageUrl);
      });
      console.log(`   ${lang.toUpperCase()}: ${validPlatforms.length} valid platforms`);
    });
    
  } catch (error) {
    console.error('❌ Error testing platforms:', error);
    console.log('💡 This might be because we\'re not in an Astro environment');
  }
}

testPlatforms();