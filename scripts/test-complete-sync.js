#!/usr/bin/env node

/**
 * Complete sync pipeline test
 * Tests creation, update, and deletion with the improved logic
 */

import { SimpleContentGenerator } from '../src/lib/engines/simple-content-generator.js';
import { promises as fs } from 'fs';
import { join } from 'path';

// Mock NocoDB client for testing
class MockNocoDBClient {
  constructor() {
    this.episodes = [
      { Id: 1, episode_number: 1, title: "Test Episode 1", slug: "test-episode-1", language: "en", season: 1 },
      { Id: 2, episode_number: 2, title: "Test Episode 2", slug: "test-episode-2", language: "en", season: 1 }
    ];
    
    this.guests = [
      { Id: 100, name: "John Doe", slug: "john-doe" },
      { Id: 101, name: "Jane Smith", slug: "jane-smith" }
    ];
    
    this.hosts = [
      { Id: 200, name: "Host Alice", slug: "host-alice" },
      { Id: 201, name: "Host Bob", slug: "host-bob" }
    ];
    
    this.platforms = [
      { 
        Id: 1, 
        Name: "Spotify", 
        slug: "spotify",
        url_en: "https://open.spotify.com/show/123",
        url_nl: "https://open.spotify.com/show/456",
        url_de: "https://open.spotify.com/show/789",
        url_es: "https://open.spotify.com/show/101",
        logo_url: "https://example.com/spotify.png",
        is_active: true,
        display_order: 1
      },
      { 
        Id: 2, 
        Name: "Apple Podcasts", 
        slug: "apple-podcasts",
        url_en: "https://podcasts.apple.com/podcast/123",
        url_nl: "https://podcasts.apple.com/podcast/456", 
        url_de: "https://podcasts.apple.com/podcast/789",
        url_es: "https://podcasts.apple.com/podcast/101",
        logo_url: "https://example.com/apple.png",
        is_active: true,
        display_order: 2
      }
    ];
  }
  
  async testConnection() { return true; }
  async getEpisodes() { return this.episodes; }
  async getGuests() { return this.guests; }
  async getHosts() { return this.hosts; }
  async getPlatforms() { return this.platforms; }
  
  // Simulate record deletion
  deleteGuest(id) {
    this.guests = this.guests.filter(g => g.Id !== id);
  }
  
  deleteHost(id) {
    this.hosts = this.hosts.filter(h => h.Id !== id);
  }
}

async function setupTestEnvironment() {
  const testDir = 'test-sync-temp';
  
  // Clean up any existing test directory
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch {}
  
  // Create directory structure
  await fs.mkdir(join(testDir, 'episodes', 'en', 'season-1'), { recursive: true });
  await fs.mkdir(join(testDir, 'guests'), { recursive: true });
  await fs.mkdir(join(testDir, 'hosts'), { recursive: true });
  await fs.mkdir(join(testDir, 'platforms'), { recursive: true });
  
  return testDir;
}

async function countFiles(dir, extension = '') {
  try {
    const files = await fs.readdir(dir, { recursive: true });
    if (extension) {
      return files.filter(f => f.endsWith(extension)).length;
    }
    return files.length;
  } catch {
    return 0;
  }
}

async function testCompleteSyncPipeline() {
  console.log('🧪 Testing Complete Sync Pipeline');
  console.log('=================================');
  
  const testDir = await setupTestEnvironment();
  const client = new MockNocoDBClient();
  
  try {
    // Initialize generator
    const generator = new SimpleContentGenerator(client, {
      outputDir: testDir,
      overwriteExisting: true,
      languages: ['en'],
      defaultLanguage: 'en'
    });
    
    console.log('\n1️⃣ Initial sync - create all content');
    let stats = await generator.generateAll();
    
    console.log(`📊 Generated: ${stats.episodesGenerated} episodes, ${stats.guestsGenerated} guests, ${stats.hostsGenerated} hosts, ${stats.platformsGenerated} platforms`);
    console.log(`🗑️ Deleted: ${stats.filesDeleted} files`);
    
    // Count files
    const episodeCount1 = await countFiles(join(testDir, 'episodes'), '.mdx');
    const guestCount1 = await countFiles(join(testDir, 'guests'), '.mdx');
    const hostCount1 = await countFiles(join(testDir, 'hosts'), '.mdx');
    const platformCount1 = await countFiles(join(testDir, 'platforms'), '.json');
    
    console.log(`📁 Files created: ${episodeCount1} episodes, ${guestCount1} guests, ${hostCount1} hosts, ${platformCount1} platforms`);
    
    console.log('\n2️⃣ Simulating deletions - remove some records');
    client.deleteGuest(101); // Remove Jane Smith
    client.deleteHost(201); // Remove Host Bob
    
    console.log('🔄 Running sync after deletions');
    stats = await generator.generateAll();
    
    console.log(`📊 Generated: ${stats.episodesGenerated} episodes, ${stats.guestsGenerated} guests, ${stats.hostsGenerated} hosts, ${stats.platformsGenerated} platforms`);
    console.log(`🗑️ Deleted: ${stats.filesDeleted} files`);
    
    // Count files after deletion
    const episodeCount2 = await countFiles(join(testDir, 'episodes'), '.mdx');
    const guestCount2 = await countFiles(join(testDir, 'guests'), '.mdx');
    const hostCount2 = await countFiles(join(testDir, 'hosts'), '.mdx');
    const platformCount2 = await countFiles(join(testDir, 'platforms'), '.json');
    
    console.log(`📁 Files remaining: ${episodeCount2} episodes, ${guestCount2} guests, ${hostCount2} hosts, ${platformCount2} platforms`);
    
    console.log('\n✅ Test Results:');
    
    // Validate results
    const deletionWorked = (
      guestCount2 === guestCount1 - 1 && // 1 guest deleted
      hostCount2 === hostCount1 - 1 && // 1 host deleted
      stats.filesDeleted === 2 // 2 files should have been deleted
    );
    
    if (deletionWorked) {
      console.log('🎉 Deletion synchronization is working correctly!');
    } else {
      console.log('❌ Deletion synchronization has issues');
      console.log(`Expected 2 deletions, got ${stats.filesDeleted}`);
      console.log(`Expected guest count ${guestCount1 - 1}, got ${guestCount2}`);
      console.log(`Expected host count ${hostCount1 - 1}, got ${hostCount2}`);
    }
    
    const generationWorked = (
      stats.episodesGenerated === 2 &&
      stats.guestsGenerated === 1 && // Only 1 guest remaining
      stats.hostsGenerated === 1 && // Only 1 host remaining
      stats.platformsGenerated === 2
    );
    
    if (generationWorked) {
      console.log('✅ Content generation is working correctly!');
    } else {
      console.log('❌ Content generation has issues');
    }
    
    if (deletionWorked && generationWorked) {
      console.log('\n🏆 COMPLETE SYNC PIPELINE IS WORKING!');
    } else {
      console.log('\n⚠️ Some issues remain in the sync pipeline');
    }
    
    // Show errors if any
    if (stats.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
  } finally {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
      console.log('\n🧹 Test environment cleaned up');
    } catch (error) {
      console.warn('Warning: Failed to clean up test environment:', error.message);
    }
  }
}

// Run the test
testCompleteSyncPipeline().catch(console.error);