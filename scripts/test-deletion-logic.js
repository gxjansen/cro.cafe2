#!/usr/bin/env node

/**
 * Test script to verify deletion logic without requiring NocoDB API
 * This tests the file mapping and deletion identification logic
 */

import { DeletionTracker } from '../src/lib/engines/deletion-tracker.js';
import { promises as fs } from 'fs';
import { join } from 'path';

// Create a temporary test directory structure
const testDir = 'test-content-temp';

async function setupTestFiles() {
  console.log('📁 Setting up test files...');
  
  // Create directory structure
  await fs.mkdir(join(testDir, 'episodes', 'en', 'season-1'), { recursive: true });
  await fs.mkdir(join(testDir, 'guests'), { recursive: true });
  await fs.mkdir(join(testDir, 'hosts'), { recursive: true });
  await fs.mkdir(join(testDir, 'platforms'), { recursive: true });
  
  // Create test files
  const testFiles = [
    // Episodes
    { path: join(testDir, 'episodes', 'en', 'season-1', 'episode-001-active-episode.mdx'), content: 'active episode' },
    { path: join(testDir, 'episodes', 'en', 'season-1', 'episode-999-deleted-episode.mdx'), content: 'should be deleted' },
    
    // Guests
    { path: join(testDir, 'guests', 'john-doe.mdx'), content: 'active guest' },
    { path: join(testDir, 'guests', 'jane-smith.mdx'), content: 'should be deleted' },
    
    // Hosts
    { path: join(testDir, 'hosts', 'host-alice.mdx'), content: 'active host' },
    { path: join(testDir, 'hosts', 'host-bob.mdx'), content: 'should be deleted' },
    
    // Platforms
    { path: join(testDir, 'platforms', 'spotify.json'), content: '{"name": "Spotify"}' },
    { path: join(testDir, 'platforms', 'platform-999.json'), content: '{"name": "Deleted Platform"}' }
  ];
  
  for (const file of testFiles) {
    await fs.writeFile(file.path, file.content);
  }
  
  console.log(`✅ Created ${testFiles.length} test files`);
}

async function testDeletionLogic() {
  console.log('\n🧪 Testing deletion logic...');
  
  const tracker = new DeletionTracker(testDir);
  
  // Get existing files
  const existingFiles = await tracker.getExistingContentMap();
  console.log(`\n📋 Found ${existingFiles.size} existing files:`);
  for (const [key, path] of existingFiles) {
    console.log(`  - ${key}: ${path}`);
  }
  
  // Define active records (simulating what would come from NocoDB)
  const activeRecords = {
    episodes: [
      { Id: 1, episode_number: 1 } // episode-001 should remain
      // episode-999 is NOT in active records, should be deleted
    ],
    guests: [
      { Id: 100, name: 'John Doe' } // john-doe.mdx should remain (slug generated from name)
      // jane-smith is NOT in active records, should be deleted
    ],
    hosts: [
      { Id: 200, name: 'Host Alice' } // host-alice.mdx should remain (slug generated from name)
      // host-bob is NOT in active records, should be deleted
    ],
    platforms: [
      { Id: 1, slug: 'spotify' } // spotify.json should remain
      // platform-999 is NOT in active records, should be deleted
    ]
  };
  
  // Get files to delete
  const filesToDelete = await tracker.getFilesToDelete(existingFiles, activeRecords);
  
  console.log(`\n🗑️ Files identified for deletion (${filesToDelete.length}):`);
  filesToDelete.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  // Verify expected deletions
  const expectedDeletions = [
    'episode-999-deleted-episode.mdx',
    'jane-smith.mdx',
    'host-bob.mdx',
    'platform-999.json'
  ];
  
  console.log('\n✅ Validation:');
  let allCorrect = true;
  
  for (const expected of expectedDeletions) {
    const found = filesToDelete.some(file => file.includes(expected));
    if (found) {
      console.log(`  ✅ ${expected} correctly identified for deletion`);
    } else {
      console.log(`  ❌ ${expected} NOT identified for deletion`);
      allCorrect = false;
    }
  }
  
  // Check for unexpected deletions
  for (const file of filesToDelete) {
    const filename = file.split('/').pop();
    const expected = expectedDeletions.some(exp => filename.includes(exp));
    if (!expected) {
      console.log(`  ⚠️ Unexpected deletion: ${filename}`);
      allCorrect = false;
    }
  }
  
  if (allCorrect) {
    console.log('\n🎉 Deletion logic is working correctly!');
  } else {
    console.log('\n❌ Deletion logic has issues');
  }
  
  return filesToDelete;
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test files...');
  try {
    await fs.rm(testDir, { recursive: true, force: true });
    console.log('✅ Test files cleaned up');
  } catch (error) {
    console.warn('Warning: Failed to clean up test files:', error.message);
  }
}

async function runTest() {
  try {
    await setupTestFiles();
    await testDeletionLogic();
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await cleanup();
  }
}

// Run the test
runTest().catch(console.error);