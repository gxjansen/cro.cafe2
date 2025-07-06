#!/usr/bin/env node

/**
 * Validates guest image filenames for special characters
 * Reports mismatches between MDX references and actual files
 * Can optionally rename files to match sanitized versions
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import sanitization logic (CommonJS style)
function sanitizeImageFilename(filename) {
  if (!filename) return '';
  
  // Extract extension
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    return sanitizeFilename(filename);
  }
  
  const base = filename.substring(0, lastDot);
  const extension = filename.substring(lastDot);
  
  return sanitizeFilename(base) + extension.toLowerCase();
}

function sanitizeFilename(filename) {
  if (!filename) return '';
  
  let sanitized = filename
    // German characters
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    // Spanish/Portuguese characters
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/ã/g, 'a')
    .replace(/õ/g, 'o')
    // French characters
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/ë/g, 'e')
    .replace(/à/g, 'a')
    .replace(/â/g, 'a')
    .replace(/ô/g, 'o')
    .replace(/ù/g, 'u')
    .replace(/û/g, 'u')
    .replace(/ç/g, 'c')
    // Other diacritics
    .replace(/í/g, 'i')
    .replace(/ì/g, 'i')
    .replace(/î/g, 'i')
    .replace(/ï/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ò/g, 'o')
    .replace(/ú/g, 'u')
    // Nordic characters
    .replace(/å/g, 'a')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae');
    
  // Replace any remaining non-alphanumeric characters (except dots and hyphens) with hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9.-]/g, '-');
  
  // Clean up multiple consecutive hyphens
  sanitized = sanitized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  return sanitized;
}

async function validateImageFilenames() {
  const guestImagesDir = path.join(process.cwd(), 'public', 'images', 'guests');
  const guestContentDir = path.join(process.cwd(), 'src', 'content', 'guests');
  
  const issues = [];
  const renameMap = new Map();
  
  try {
    // Check guest images directory
    const imageFiles = await fs.readdir(guestImagesDir);
    
    console.log(`\n🔍 Checking ${imageFiles.length} image files for special characters...\n`);
    
    for (const file of imageFiles) {
      const sanitized = sanitizeImageFilename(file);
      
      if (file !== sanitized) {
        issues.push({
          type: 'image',
          original: file,
          sanitized: sanitized,
          path: path.join(guestImagesDir, file)
        });
        renameMap.set(file, sanitized);
      }
    }
    
    // Check MDX files for image references
    const mdxFiles = await fs.readdir(guestContentDir);
    const mdxIssues = [];
    
    console.log(`\n📄 Checking ${mdxFiles.length} MDX files for image references...\n`);
    
    for (const mdxFile of mdxFiles) {
      if (!mdxFile.endsWith('.mdx')) continue;
      
      const content = await fs.readFile(path.join(guestContentDir, mdxFile), 'utf-8');
      const imageUrlMatch = content.match(/imageUrl:\s*["']([^"']+)["']/);
      
      if (imageUrlMatch) {
        const imageUrl = imageUrlMatch[1];
        if (imageUrl.startsWith('/images/guests/')) {
          const filename = imageUrl.replace('/images/guests/', '');
          const sanitized = sanitizeImageFilename(filename);
          
          if (filename !== sanitized) {
            mdxIssues.push({
              type: 'mdx',
              file: mdxFile,
              original: filename,
              sanitized: sanitized,
              fullPath: imageUrl
            });
          }
        }
      }
    }
    
    // Report findings
    if (issues.length > 0) {
      console.log('❌ Found image files with special characters:\n');
      issues.forEach(issue => {
        console.log(`  • ${issue.original} → ${issue.sanitized}`);
      });
    } else {
      console.log('✅ No image files with special characters found.');
    }
    
    if (mdxIssues.length > 0) {
      console.log('\n❌ Found MDX files referencing images with special characters:\n');
      mdxIssues.forEach(issue => {
        console.log(`  • ${issue.file}: ${issue.original} → ${issue.sanitized}`);
      });
    } else {
      console.log('\n✅ No MDX files with problematic image references found.');
    }
    
    // Check for mismatches
    const imageLookup = new Set(imageFiles);
    const missingImages = [];
    
    for (const issue of mdxIssues) {
      if (!imageLookup.has(issue.original) && !imageLookup.has(issue.sanitized)) {
        missingImages.push(issue);
      }
    }
    
    if (missingImages.length > 0) {
      console.log('\n⚠️  Missing image files referenced in MDX:\n');
      missingImages.forEach(issue => {
        console.log(`  • ${issue.file}: ${issue.original}`);
      });
    }
    
    // Offer to rename files if running with --fix flag
    if (process.argv.includes('--fix') && issues.length > 0) {
      console.log('\n🔧 Renaming image files...\n');
      
      for (const issue of issues) {
        const oldPath = issue.path;
        const newPath = path.join(path.dirname(oldPath), issue.sanitized);
        
        try {
          await fs.rename(oldPath, newPath);
          console.log(`  ✅ Renamed: ${issue.original} → ${issue.sanitized}`);
        } catch (error) {
          console.error(`  ❌ Failed to rename ${issue.original}: ${error.message}`);
        }
      }
      
      console.log('\n✨ File renaming complete!');
      console.log('Note: MDX files will be updated automatically on next content sync.');
    } else if (issues.length > 0) {
      console.log('\n💡 To automatically rename files, run: npm run validate-images -- --fix');
    }
    
    // Exit with error code if issues found
    if (issues.length > 0 || mdxIssues.length > 0 || missingImages.length > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error validating image filenames:', error);
    process.exit(1);
  }
}

// Run validation
validateImageFilenames();