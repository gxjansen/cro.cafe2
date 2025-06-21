#!/usr/bin/env node

/**
 * Script to download gallery images from CRO.CAFE event pages
 * Downloads images from events at https://www.cro.cafe/event/*
 * and saves them to public/images/events/{event-name}/
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Base configuration
const BASE_URL = 'https://www.cro.cafe';
const EVENTS_URL = `${BASE_URL}/event`;
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'events');

// Known events with galleries (you can expand this list)
const EVENTS_WITH_GALLERIES = [
  'conversion-hotel-2021',
  'conversion-hotel-2022',
  'conversion-hotel-2023',
  'conversion-hotel-2024',
  'cxl-live-2022',
  'cxl-live-2023',
  'conversion-jam-3',
  'e-commerce-germany-2022'
];

/**
 * Download a file from URL to local path
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Fetch HTML content from a URL
 */
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

/**
 * Extract gallery image URLs from HTML
 * Looking for patterns like:
 * - cdn.prod.website-files.com images
 * - Images in gallery sections
 */
function extractGalleryImages(html) {
  const images = new Set();
  
  // Pattern for Webflow CDN images
  const cdnPattern = /https:\/\/cdn\.prod\.website-files\.com\/[a-zA-Z0-9\/\-_%\.]+\.(jpg|jpeg|png|webp)/gi;
  const matches = html.matchAll(cdnPattern);
  
  for (const match of matches) {
    let imageUrl = match[0];
    // Decode URL-encoded characters
    imageUrl = decodeURIComponent(imageUrl);
    
    // Filter out common non-gallery images (logos, icons, etc.)
    if (!imageUrl.includes('logo') && 
        !imageUrl.includes('icon') && 
        !imageUrl.includes('favicon') &&
        !imageUrl.includes('avatar') &&
        (imageUrl.includes('gallery') || 
         imageUrl.includes('event') || 
         imageUrl.includes('Image') ||
         imageUrl.includes('photo'))) {
      images.add(imageUrl);
    }
  }
  
  // Also look for images in specific gallery containers
  const galleryPattern = /<div[^>]*class="[^"]*gallery[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>/gi;
  const galleryMatches = html.matchAll(galleryPattern);
  
  for (const match of galleryMatches) {
    if (match[1] && match[1].includes('cdn.prod.website-files.com')) {
      images.add(decodeURIComponent(match[1]));
    }
  }
  
  return Array.from(images);
}

/**
 * Clean filename for saving
 */
function cleanFilename(url) {
  const urlObj = new URL(url);
  let filename = path.basename(urlObj.pathname);
  
  // Decode URL encoding
  filename = decodeURIComponent(filename);
  
  // Replace spaces and special characters
  filename = filename.replace(/[^\w\-\.]/g, '_');
  
  // Ensure it has an extension
  if (!filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
    filename += '.jpg';
  }
  
  return filename;
}

/**
 * Process a single event page
 */
async function processEvent(eventSlug) {
  console.log(`\nProcessing event: ${eventSlug}`);
  
  const eventUrl = `${EVENTS_URL}/${eventSlug}`;
  const eventDir = path.join(OUTPUT_DIR, eventSlug);
  
  try {
    // Fetch event page HTML
    console.log(`  Fetching ${eventUrl}...`);
    const html = await fetchHTML(eventUrl);
    
    // Extract gallery images
    const imageUrls = extractGalleryImages(html);
    console.log(`  Found ${imageUrls.length} gallery images`);
    
    if (imageUrls.length === 0) {
      console.log(`  No gallery images found for ${eventSlug}`);
      return;
    }
    
    // Create event directory
    fs.mkdirSync(eventDir, { recursive: true });
    
    // Download each image
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const filename = `${i + 1}_${cleanFilename(imageUrl)}`;
      const filepath = path.join(eventDir, filename);
      
      console.log(`  Downloading image ${i + 1}/${imageUrls.length}: ${filename}`);
      
      try {
        await downloadFile(imageUrl, filepath);
        console.log(`    ✓ Saved to ${path.relative(process.cwd(), filepath)}`);
      } catch (err) {
        console.error(`    ✗ Failed to download: ${err.message}`);
      }
    }
    
  } catch (err) {
    console.error(`  Error processing ${eventSlug}: ${err.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting CRO.CAFE event gallery image download...');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  // Create base output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Process each event
  for (const eventSlug of EVENTS_WITH_GALLERIES) {
    await processEvent(eventSlug);
  }
  
  console.log('\nDownload complete!');
}

// Run the script
main().catch(console.error);