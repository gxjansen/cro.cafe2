#!/usr/bin/env node

/**
 * Test script to check if getValidPlatformsForLanguage function works with sample data
 */

// Test the URL validation function directly (copied from utils/content.ts)
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

// Load and test our sample platform data
import { readFile } from 'fs/promises';
import { join } from 'path';

async function testPlatformData() {
  console.log('🧪 Testing Platform Data Logic\n');
  
  try {
    // Load sample platform files
    const platforms = [];
    const platformFiles = ['spotify.json', 'apple-podcasts.json', 'google-podcasts.json', 'youtube.json'];
    
    for (const file of platformFiles) {
      const filePath = join(process.cwd(), 'src/content/platforms', file);
      try {
        const content = await readFile(filePath, 'utf-8');
        const platformData = JSON.parse(content);
        platforms.push({ data: platformData, slug: file.replace('.json', '') });
        console.log(`✅ Loaded ${platformData.name}`);
      } catch (error) {
        console.log(`❌ Failed to load ${file}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Total platforms loaded: ${platforms.length}\n`);
    
    // Test the validation logic for each language
    const languages = ['en', 'nl', 'de', 'es'];
    
    for (const language of languages) {
      console.log(`🔍 Testing language: ${language.toUpperCase()}`);
      
      const validPlatforms = platforms.filter(platform => {
        const languageUrl = platform.data.urls[language];
        const isValid = isValidPlatformUrl(languageUrl);
        console.log(`  - ${platform.data.name}: ${languageUrl} → ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        return isValid;
      }).sort((a, b) => (a.data.displayOrder || a.data.order || 999) - (b.data.displayOrder || b.data.order || 999));
      
      console.log(`  📊 Valid platforms for ${language}: ${validPlatforms.length}\n`);
    }
    
    // Test specific URLs that might be problematic
    console.log('🔍 Testing specific URL patterns:');
    const testUrls = [
      'https://open.spotify.com/show/4XUqk6HhbQOEVpSRvD8KBj',
      'https://example.com/test',
      '',
      null,
      undefined,
      'invalid-url',
      'http://valid.com/path'
    ];
    
    testUrls.forEach(url => {
      const result = isValidPlatformUrl(url);
      console.log(`  "${url}" → ${result ? '✅ Valid' : '❌ Invalid'}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPlatformData();