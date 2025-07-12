#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GUESTS_IMAGE_DIR = path.join(__dirname, '../public/images/guests');
const INVENTORY_FILE = path.join(__dirname, '../src/data/guest-image-inventory.json');

interface ImageInventoryEntry {
  hasImage: boolean;
  imageUrl: string;
  fallbackUrl?: string;
  initials: string;
  name: string;
}

interface ImageInventory {
  [guestSlug: string]: ImageInventoryEntry;
}

async function loadInventory(): Promise<ImageInventory> {
  const content = await fs.readFile(INVENTORY_FILE, 'utf-8');
  return JSON.parse(content);
}

async function getExistingImageFiles(): Promise<Set<string>> {
  const files = await fs.readdir(GUESTS_IMAGE_DIR);
  return new Set(
    files
      .filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i))
      .map(f => f.toLowerCase())
  );
}

function normalizeFilename(filename: string): string {
  // Normalize special characters
  return filename
    .replace(/ö/g, 'oe')
    .replace(/ä/g, 'ae')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/ñ/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ú/g, 'u')
    .replace(/[^a-z0-9\-\.]/gi, '-')
    .replace(/--+/g, '-')
    .toLowerCase();
}

async function findImageFile(guestSlug: string, existingFiles: Set<string>): Promise<string | null> {
  // Try exact match first
  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  for (const ext of extensions) {
    const filename = `${guestSlug}${ext}`;
    if (existingFiles.has(filename.toLowerCase())) {
      // Find the actual case-sensitive filename
      const actualFiles = await fs.readdir(GUESTS_IMAGE_DIR);
      const actualFile = actualFiles.find(f => f.toLowerCase() === filename.toLowerCase());
      return actualFile || null;
    }
  }

  // Try normalized version
  const normalizedSlug = normalizeFilename(guestSlug);
  for (const ext of extensions) {
    const filename = `${normalizedSlug}${ext}`;
    if (existingFiles.has(filename.toLowerCase())) {
      const actualFiles = await fs.readdir(GUESTS_IMAGE_DIR);
      const actualFile = actualFiles.find(f => f.toLowerCase() === filename.toLowerCase());
      return actualFile || null;
    }
  }

  return null;
}

async function fixImageFilenames() {
  console.log('Loading guest image inventory...');
  const inventory = await loadInventory();
  const existingFiles = await getExistingImageFiles();
  
  console.log(`Found ${Object.keys(inventory).length} guests in inventory`);
  console.log(`Found ${existingFiles.size} image files in directory\n`);

  const mismatches: Array<{
    guestSlug: string;
    expectedFile: string;
    actualFile: string | null;
    action: 'rename' | 'missing' | 'ok';
  }> = [];

  // Check each guest in the inventory
  for (const [guestSlug, entry] of Object.entries(inventory)) {
    if (!entry.hasImage || !entry.imageUrl) continue;

    const expectedFilename = path.basename(entry.imageUrl);
    const actualFile = await findImageFile(guestSlug, existingFiles);

    if (!actualFile) {
      mismatches.push({
        guestSlug,
        expectedFile: expectedFilename,
        actualFile: null,
        action: 'missing'
      });
    } else if (actualFile !== expectedFilename) {
      mismatches.push({
        guestSlug,
        expectedFile: expectedFilename,
        actualFile,
        action: 'rename'
      });
    }
  }

  // Report findings
  console.log(`\nFound ${mismatches.length} mismatches:\n`);

  const missing = mismatches.filter(m => m.action === 'missing');
  const needRename = mismatches.filter(m => m.action === 'rename');

  if (missing.length > 0) {
    console.log('=== MISSING IMAGES ===');
    missing.forEach(m => {
      console.log(`  ${m.guestSlug}: expected ${m.expectedFile} but file not found`);
    });
    console.log('');
  }

  if (needRename.length > 0) {
    console.log('=== FILES TO RENAME ===');
    needRename.forEach(m => {
      console.log(`  ${m.guestSlug}:`);
      console.log(`    Current: ${m.actualFile}`);
      console.log(`    Expected: ${m.expectedFile}`);
    });
    console.log('');
  }

  // Ask for confirmation before renaming
  if (needRename.length > 0) {
    console.log(`\nWould you like to rename ${needRename.length} files? (y/n)`);
    
    // In non-interactive mode, just show what would be done
    if (process.argv.includes('--dry-run')) {
      console.log('(Dry run mode - no changes will be made)');
      return;
    }

    if (process.argv.includes('--fix')) {
      console.log('Auto-fix mode enabled, renaming files...\n');
      
      for (const mismatch of needRename) {
        const oldPath = path.join(GUESTS_IMAGE_DIR, mismatch.actualFile!);
        const newPath = path.join(GUESTS_IMAGE_DIR, mismatch.expectedFile);
        
        try {
          await fs.rename(oldPath, newPath);
          console.log(`✓ Renamed: ${mismatch.actualFile} → ${mismatch.expectedFile}`);
        } catch (error) {
          console.error(`✗ Failed to rename ${mismatch.actualFile}: ${error}`);
        }
      }
      
      console.log('\nDone! Files have been renamed.');
    } else {
      console.log('\nTo fix these issues, run with --fix flag:');
      console.log('  npm run fix-guest-images -- --fix');
    }
  } else if (missing.length === 0) {
    console.log('✓ All image filenames match the inventory!');
  }

  // Also check for orphaned images (images without inventory entries)
  const inventoryFiles = new Set(
    Object.values(inventory)
      .filter(e => e.hasImage && e.imageUrl)
      .map(e => path.basename(e.imageUrl).toLowerCase())
  );

  const orphanedFiles: string[] = [];
  const actualFiles = await fs.readdir(GUESTS_IMAGE_DIR);
  
  for (const file of actualFiles) {
    if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;
    if (file.startsWith('.')) continue;
    
    if (!inventoryFiles.has(file.toLowerCase())) {
      orphanedFiles.push(file);
    }
  }

  if (orphanedFiles.length > 0) {
    console.log('\n=== ORPHANED IMAGE FILES ===');
    console.log('(Files in directory but not in inventory)');
    orphanedFiles.forEach(f => console.log(`  ${f}`));
  }
}

// Run the script
fixImageFilenames().catch(console.error);