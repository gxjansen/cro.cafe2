#!/usr/bin/env node

/**
 * Script to download gallery images from CRO.CAFE event pages using MCP
 * This version uses Firecrawl MCP for better image extraction
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base configuration
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'events');

// Events to process - you can add more event slugs here
const EVENTS_TO_PROCESS = [
  'conversion-hotel-2021',
  'conversion-hotel-2022',
  'conversion-hotel-2023',
  'conversion-hotel-2024',
  'cxl-live-2022',
  'cxl-live-2023',
  'conversion-jam-3',
  'e-commerce-germany-2022'
];

// Gallery images extracted via Firecrawl (manually gathered)
const EVENT_GALLERIES = {
  'conversion-hotel-2021': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c502c1c18f635dfbf3cbc3_CH2021_crowd_background_2.jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c50252f8220dab0dc7eac1_20211120_155645.jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c502514c32b42ec9a70f88_Image%20(1).jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c50251a881fc0b2edce931_Image%20(2).jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c5025154d0ca45e4ed6f6f_Image%20(3).jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c50251a230302487ea213f_Image%20(4).jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c502511b2aa3048896b007_Image%20(6).jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c502519ca456745e868dd5_Image%20(7).jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c50251be592e2f6bbb3a52_Image%20(8).jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c50251f1641238a6c22edc_Image%20(9).jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c50253d49d3d6f9754db02_IMG-20211120-WA0016.jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c50253a881fcc6d4dce964_IMG-20211120-WA0018.jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c50253908db98114cefcc3_IMG-20211120-WA0024.jpg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/61c5025374a7a8985d8bc31d_IMG-20211120-WA0025.jpg"
  ],
  
  'conversion-hotel-2020': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604fe006a1ff8fd7eeecbeb7_5ed0d7f0c534bd25b23f40b9.jpeg"
  ],
  
  'conversion-hotel': [ // The Conference Formerly Known as Conversion Hotel 2019
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8557f3b78902ece25d6_5df554e0a58b625d6acdbb02_ch2019-opname-min.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e38184740ac31f_191122-20h44m15s-IMG_9688-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e3811ac20ac318_191122-20h45m22s-IMG_9692-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e38159080ac321_191122-20h53m15s-IMG_9717-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e3816e5e0ac328_191122-21h38m12s-IMG_0042-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e3813ac70ac320_191122-21h39m21s-IMG_0046-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e3811e850ac322_191123-14h15m29s-IMG_0294-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e38129320ac3bf_191123-14h16m09s-IMG_0295-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e381f21b0ac32c_191123-14h16m25s-IMG_0296-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e38107060ac3c1_191123-14h22m50s-IMG_0308-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e38194de0ac3be_191123-14h25m03s-IMG_0311-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e38170890ac32b_191123-14h27m31s-IMG_0315-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e3815eca0ac3c0_191123-14h32m54s-IMG_0318-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e3816dae0ac3c2_191123-16h21m51s-IMG_0369-CH19-SO.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf8dc80e38179240ac3c3_ch2019-setup.jpeg"
  ],
  
  'digital-elite-day': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf659a750986ca86e480d_82565107_1264860790367315_5804800930796797952_n.jpeg"
  ],
  
  'cro-cafe-unconference-2': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6ef9df9420a1e1a1dba_5d4c7a948620ae48a6372314_IMG-20190731-WA0009_lightbox.jpeg"
  ],
  
  'cro-cafe-unconference': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf736033eb0a0a057ff4e_unspklash.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf772333c590548ad407e_DSC08342_lightbox.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf772333c595efbad407f_DSC08344_lightbox.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf772333c598463ad4081_DSC08345_lightbox.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf772333c591c5cad403b_DSC08347_lightbox.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf772333c595b38ad407d_IMG-20190731-WA0009_lightbox.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf772333c59a70cad4080_DSC08317_lightbox.jpeg"
  ],
  
  'dutch-cro-awards': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf7e0b36c35215654aac2_5de150d3d41c9b09d8ba3323_FB_IMG_1570131602666-min.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf7fa2c8e122cb428f920_FB_IMG_1570109751047.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf7fa2c8e12f6ee28f91f_FB_IMG_1570131528317.jpeg"
  ],
  
  'measurecamp': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf694c436544711ffacde_measurecamp.jpeg"
  ],
  
  'measurebowling': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6a2033eb0cef457c164_5c9375d41f6952ed8eba609f_highres_471329461-min.jpeg"
  ],
  
  'marketing-insights-event': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf5f07712d4ddb6b1aeef_crocafenewsroom(1)-min.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6215df48e2ddac2dcd9_82795553_2971761346222088_3148190678412951552_o.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6215df48e5c43c2dcda_image_8068ebf7-9f77-40f1-9bda-81013f3f503620200207_193049.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6215df48e73dfc2dce6_IMG_20200205_232109.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6225df48ecf07c2dcee_20200205_123601.jpeg"
  ],
  
  'emerce-engage-reach-touch-retain': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf7c080e3817bd709d164_49139544736_c58b22f1d3_o.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf7c080e3811bd109d16c_guido_bart_engage19_2.jpeg"
  ],
  
  'digital-analytics-congres': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf72f297acc88f5b9944a_dac19-1.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf72f297accd4deb9944b_48870233037_a791193e14_k.jpeg"
  ],
  
  'virtual-champagne-breakfast': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6447fb24edab6463a17_maxresdefault.jpeg"
  ],
  
  'emerce-conversion': [
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a58d015c3f2_IMG-20190411-WA0007.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a02c715c3ff_20190411_115931.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a8ba215c3f5_20190411_120533.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a258815c3f4_20190411_181202.jpeg",
    "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a7cb315c3f3_5cb0764dc08e6f5b27a4f041_46864155014_18a62762ea_o-p-2000.jpeg"
  ]
  
  // Note: Many 2020-2021 events were virtual and don't have photo galleries
  // Events without galleries: e-show-barcelona, emerce-conversion-2021, emerce-conversion-2020,
  // experimentation-culture-awards, digital-elite-live, google-analytics-user-conference-2021,
  // uxinsight-2020, the-bad-conference, outperform-conference, masterclass-conversie-optimalisatie,
  // uxinsight, cro-workshop-a-b-testen-weet-je-het-zeker, google-analytics-user-conference
};

/**
 * Download a file from URL to local path
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        file.close();
        fs.unlinkSync(filepath);
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
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
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

/**
 * Clean filename for saving
 */
function cleanFilename(url) {
  const urlObj = new URL(url);
  let filename = path.basename(urlObj.pathname);
  
  // Decode URL encoding
  filename = decodeURIComponent(filename);
  
  // Replace spaces and special characters with underscores
  filename = filename.replace(/[^\w\-\.]/g, '_');
  
  // Remove multiple underscores
  filename = filename.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores
  filename = filename.replace(/^_+|_+$/g, '');
  
  // Ensure it has an extension
  if (!filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
    filename += '.jpg';
  }
  
  return filename;
}

/**
 * Process a single event
 */
async function processEvent(eventSlug, imageUrls) {
  console.log(`\nProcessing event: ${eventSlug}`);
  
  const eventDir = path.join(OUTPUT_DIR, eventSlug);
  
  if (!imageUrls || imageUrls.length === 0) {
    console.log(`  No gallery images configured for ${eventSlug}`);
    return;
  }
  
  console.log(`  Found ${imageUrls.length} gallery images`);
  
  // Create event directory
  fs.mkdirSync(eventDir, { recursive: true });
  
  // Download each image
  let successCount = 0;
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    const filename = cleanFilename(imageUrl);
    const filepath = path.join(eventDir, filename);
    
    // Skip if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`  Skipping ${filename} (already exists)`);
      successCount++;
      continue;
    }
    
    console.log(`  Downloading image ${i + 1}/${imageUrls.length}: ${filename}`);
    
    try {
      await downloadFile(imageUrl, filepath);
      console.log(`    ✓ Saved to ${path.relative(process.cwd(), filepath)}`);
      successCount++;
    } catch (err) {
      console.error(`    ✗ Failed to download: ${err.message}`);
    }
  }
  
  console.log(`  Completed: ${successCount}/${imageUrls.length} images downloaded`);
}

/**
 * Main function
 */
async function main() {
  console.log('CRO.CAFE Event Gallery Image Downloader');
  console.log('=====================================');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  // Create base output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Process each event with known gallery images
  for (const eventSlug of Object.keys(EVENT_GALLERIES)) {
    await processEvent(eventSlug, EVENT_GALLERIES[eventSlug]);
  }
  
  console.log('\n=====================================');
  console.log('Download complete!');
  console.log('\nNote: To add more events, use Firecrawl MCP to scrape the event pages');
  console.log('and add the gallery URLs to the EVENT_GALLERIES object in this script.');
}

// Run the script
main().catch(console.error);