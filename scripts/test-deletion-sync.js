#!/usr/bin/env node

/**
 * Test script to verify deletion synchronization
 * This creates a test record, syncs, then deletes it to test cleanup
 */

import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration from environment
const BASE_URL = process.env.NOCODB_BASE_URL || 'https://nocodb-nkhcx-u31496.vm.elestio.app';
const API_KEY = process.env.NOCODB_API_KEY || 'DUiJ6F-HHLqLOSFnP0PxGQp2v-KCG4JOtrlmLKgJ';
const BASE_ID = process.env.NOCODB_BASE_ID || 'p5mcqm7lvi5ty8i';

// Create axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api/v2`,
  headers: {
    'xc-token': API_KEY,
    'Content-Type': 'application/json'
  }
});

// Test data for deletion test
const testEpisode = {
  title: "DELETION TEST Episode - Will Be Deleted",
  description: "This episode is created to test deletion sync",
  season: 98,
  episode_number: 998,
  slug: "deletion-test-episode-998",
  language: "en",
  duration: 600,
  published_at: new Date().toISOString(),
  media_url: "https://test.example.com/audio/deletion-test.mp3"
};

// Get table ID
async function getTableId(tableName) {
  const response = await api.get(`/meta/bases/${BASE_ID}/tables`);
  const table = response.data.list.find(t => t.title === tableName);
  if (!table) throw new Error(`Table ${tableName} not found`);
  return table.id;
}

// Create record
async function createRecord(tableName, data) {
  const tableId = await getTableId(tableName);
  const response = await api.post(`/tables/${tableId}/records`, data);
  return response.data;
}

// Delete record
async function deleteRecord(tableName, recordId) {
  const tableId = await getTableId(tableName);
  await api.delete(`/tables/${tableId}/records`, {
    data: [{ Id: recordId }]
  });
}

// Check if file exists
function fileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

// Main test
async function runDeletionTest() {
  console.log('🧪 Starting deletion sync test...\n');
  
  try {
    // Step 1: Create test episode
    console.log('1️⃣ Creating test episode in NocoDB...');
    const created = await createRecord('Episodes', testEpisode);
    const episodeId = created.Id;
    console.log(`✅ Created episode with ID: ${episodeId}`);
    
    // Step 2: Run sync to generate file
    console.log('\n2️⃣ Running content generation to create file...');
    execSync('npx tsx scripts/generate-content-final.ts', {
      env: { ...process.env, NOCODB_BASE_URL: BASE_URL, NOCODB_API_KEY: API_KEY, NOCODB_BASE_ID: BASE_ID },
      stdio: 'inherit'
    });
    
    // Step 3: Check if file was created
    const expectedFile = path.join(
      'src/content/episodes/en/season-98',
      `episode-998-deletion-test-episode-998.mdx`
    );
    
    console.log(`\n3️⃣ Checking if file was created at: ${expectedFile}`);
    if (fileExists(expectedFile)) {
      console.log('✅ File created successfully');
    } else {
      console.log('❌ File was not created - checking alternative paths...');
      // Try to find the file
      const searchResult = execSync(`find src/content/episodes -name "*998*" -o -name "*deletion-test*"`, { encoding: 'utf8' });
      if (searchResult.trim()) {
        console.log('Found file at:', searchResult.trim());
      }
    }
    
    // Step 4: Delete the record from NocoDB
    console.log(`\n4️⃣ Deleting episode ${episodeId} from NocoDB...`);
    await deleteRecord('Episodes', episodeId);
    console.log('✅ Record deleted from NocoDB');
    
    // Step 5: Run sync again to trigger cleanup
    console.log('\n5️⃣ Running content generation again to trigger cleanup...');
    execSync('npx tsx scripts/generate-content-final.ts', {
      env: { ...process.env, NOCODB_BASE_URL: BASE_URL, NOCODB_API_KEY: API_KEY, NOCODB_BASE_ID: BASE_ID },
      stdio: 'inherit'
    });
    
    // Step 6: Check if file was deleted
    console.log(`\n6️⃣ Checking if file was deleted...`);
    if (!fileExists(expectedFile)) {
      console.log('✅ File successfully deleted!');
      console.log('\n🎉 DELETION SYNC IS WORKING!');
    } else {
      console.log('❌ File still exists - deletion sync failed');
      console.log('\n⚠️ DELETION SYNC NOT WORKING');
      
      // Try to find any remaining test files
      const remainingFiles = execSync(`find src/content/episodes -name "*998*" -o -name "*deletion-test*"`, { encoding: 'utf8' });
      if (remainingFiles.trim()) {
        console.log('\nRemaining test files:', remainingFiles);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runDeletionTest().catch(console.error);