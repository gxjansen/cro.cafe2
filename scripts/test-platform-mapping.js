#!/usr/bin/env node

/**
 * Test platform field mapping without full API dependency
 * This tests the platform data generation logic
 */

import { join } from 'path';

// Simulate what NocoDB returns for platforms based on the log we saw
const actualNocoDBPlatformData = {
  "Id": 1,
  "CreatedAt": "2025-06-03 16:14:24+00:00",
  "UpdatedAt": "2025-06-14 17:57:11+00:00",
  "Name": "Spotify",
  "logo_url": "",
  "url_en": "https://open.spotify.com/show/5TrJo8SegrE2haCeMDLB3M",
  "url_nl": "https://open.spotify.com/show/2LwkAHzzFB19pNIgtL4fBs",
  "url_de": "https://open.spotify.com/show/3uhdVQeyB94u666zuzh6Lo",
  "url_es": "https://open.spotify.com/show/4x6PY0PeoxoR8hgOSZwVBF",
  "display_order": 1,
  "is_active": true,
  "nocodb_last_modified": "2025-06-14 17:57:11+00:00"
};

// Test platform we created
const testPlatformFromAPI = {
  "Id": 25,
  "CreatedAt": "2025-06-18 21:30:46+00:00",
  "UpdatedAt": "2025-06-18 21:34:21+00:00",
  "Name": "TEST Platform - Automated Testing",
  "name": "TEST Platform - Automated Testing",
  "slug": "test-platform-automated",
  "url": "https://test.example.com/test-platform",
  "url_en": "https://test.example.com/test-platform/en",
  "url_nl": "https://test.example.com/test-platform/nl",
  "url_de": "https://test.example.com/test-platform/de",
  "url_es": "https://test.example.com/test-platform/es",
  "icon": "https://test.example.com/icons/test-platform.png",
  "logo_url": "https://test.example.com/icons/test-platform.png",
  "website": "https://test.example.com",
  "is_active": true,
  "display_order": 999,
  "displayOrder": 999
};

function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function generatePlatformData(platform) {
  console.log('\n🔍 Processing platform:', JSON.stringify(platform, null, 2));
  
  // Use the exact field mapping logic from the content generator
  const name = platform.Name || platform.name || `Platform ${platform.Id || platform.id}`;
  const slug = platform.slug || platform.Slug || name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  // Extract the actual URL from NocoDB
  const baseUrl = platform.url || platform.URL || platform.website || platform.Website || `https://example.com/platform/${slug}`;
  
  // Build URLs object with all required languages
  const urls = {
    en: platform.url_en || platform['URL EN'] || baseUrl,
    nl: platform.url_nl || platform['URL NL'] || baseUrl,
    de: platform.url_de || platform['URL DE'] || baseUrl,
    es: platform.url_es || platform['URL ES'] || baseUrl
  };

  // Get iconUrl - check various possible field names
  const iconUrl = isValidUrl(platform.icon) ? platform.icon :
                 isValidUrl(platform.Icon) ? platform.Icon :
                 isValidUrl(platform.icon_url) ? platform.icon_url :
                 isValidUrl(platform.iconUrl) ? platform.iconUrl :
                 isValidUrl(platform.logo) ? platform.logo :
                 isValidUrl(platform.Logo) ? platform.Logo :
                 isValidUrl(platform.logo_url) ? platform.logo_url :
                 `https://example.com/icons/${slug}.png`;
  
  const websiteUrl = baseUrl;

  const platformData = {
    id: platform.Id || platform.id || platform.ID,
    name: name,
    slug: slug,
    iconUrl: iconUrl,
    websiteUrl: websiteUrl,
    urls: urls,
    displayOrder: platform.displayOrder || platform.display_order || platform['Display Order'] || platform.order || 0,
    isActive: platform.isActive !== undefined ? platform.isActive : 
              platform.is_active !== undefined ? platform.is_active : 
              platform['Is Active'] !== undefined ? platform['Is Active'] : true,
    createdAt: new Date(platform.CreatedAt || platform.created_at || platform['Created At'] || Date.now()).toISOString(),
    updatedAt: new Date(platform.UpdatedAt || platform.updated_at || platform['Updated At'] || Date.now()).toISOString()
  };

  console.log('\n📝 Generated platform data:', JSON.stringify(platformData, null, 2));
  
  return platformData;
}

function testPlatformMapping() {
  console.log('🧪 Testing Platform Field Mapping');
  console.log('=================================');
  
  console.log('\n1️⃣ Testing with real Spotify data:');
  const spotifyResult = generatePlatformData(actualNocoDBPlatformData);
  
  console.log('\n2️⃣ Testing with our test platform data:');
  const testResult = generatePlatformData(testPlatformFromAPI);
  
  console.log('\n✅ Analysis:');
  console.log('Real Spotify platform:');
  console.log(`  - Name: "${spotifyResult.name}" (should be "Spotify")`);
  console.log(`  - URLs work: ${spotifyResult.urls.en.includes('spotify.com')}`);
  console.log(`  - Icon fallback: ${spotifyResult.iconUrl.includes('example.com')}`);
  console.log(`  - Is Active: ${spotifyResult.isActive}`);
  
  console.log('\nTest platform:');
  console.log(`  - Name: "${testResult.name}" (should be "TEST Platform - Automated Testing")`);
  console.log(`  - URLs work: ${testResult.urls.en.includes('test.example.com')}`);
  console.log(`  - Icon URL: ${testResult.iconUrl.includes('test.example.com')}`);
  console.log(`  - Is Active: ${testResult.isActive}`);
  
  // Check if our test platform would work correctly
  const testIsCorrect = (
    testResult.name === "TEST Platform - Automated Testing" &&
    testResult.urls.en.includes('test.example.com/test-platform/en') &&
    testResult.iconUrl.includes('test.example.com/icons/test-platform.png') &&
    testResult.isActive === true
  );
  
  if (testIsCorrect) {
    console.log('\n🎉 Platform mapping logic is working correctly!');
    console.log('The issue might be in how NocoDB stores or returns the data.');
  } else {
    console.log('\n❌ Platform mapping logic has issues');
  }
}

// Run the test
testPlatformMapping();