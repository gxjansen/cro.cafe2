#!/usr/bin/env node

/**
 * Regenerates guest MDX files to update image paths with sanitized filenames
 * This is a temporary script to fix existing content until the full sync process runs
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sanitization function matching the one in filename-sanitizer.ts
function sanitizeImageFilename(filename) {
  if (!filename) return '';
  
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
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/ã/g, 'a')
    .replace(/õ/g, 'o')
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
    .replace(/í/g, 'i')
    .replace(/ì/g, 'i')
    .replace(/î/g, 'i')
    .replace(/ï/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ò/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/å/g, 'a')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae');
    
  sanitized = sanitized.replace(/[^a-zA-Z0-9.-]/g, '-');
  sanitized = sanitized.replace(/-+/g, '-');
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  return sanitized;
}

async function updateGuestMDXFiles() {
  const guestContentDir = path.join(process.cwd(), 'src', 'content', 'guests');
  
  try {
    const files = await fs.readdir(guestContentDir);
    const mdxFiles = files.filter(f => f.endsWith('.mdx'));
    
    console.log(`\n📝 Processing ${mdxFiles.length} guest MDX files...\n`);
    
    let updatedCount = 0;
    
    for (const file of mdxFiles) {
      const filePath = path.join(guestContentDir, file);
      let content = await fs.readFile(filePath, 'utf-8');
      let updated = false;
      
      // Update image URLs
      const imageUrlMatch = content.match(/imageUrl:\s*["']([^"']+)["']/);
      if (imageUrlMatch) {
        const imageUrl = imageUrlMatch[1];
        if (imageUrl.startsWith('/images/guests/')) {
          const filename = imageUrl.replace('/images/guests/', '');
          const sanitized = sanitizeImageFilename(filename);
          
          if (filename !== sanitized) {
            const newImageUrl = `/images/guests/${sanitized}`;
            content = content.replace(
              /imageUrl:\s*["'][^"']+["']/,
              `imageUrl: "${newImageUrl}"`
            );
            updated = true;
            console.log(`  ✅ ${file}: ${filename} → ${sanitized}`);
          }
        }
      }
      
      // Update slug if it contains special characters
      const slugMatch = content.match(/slug:\s*["']([^"']+)["']/);
      if (slugMatch) {
        const slug = slugMatch[1];
        const sanitizedSlug = sanitizeFilename(slug);
        
        if (slug !== sanitizedSlug) {
          content = content.replace(
            /slug:\s*["'][^"']+["']/,
            `slug: "${sanitizedSlug}"`
          );
          updated = true;
          console.log(`  ✅ ${file}: Updated slug ${slug} → ${sanitizedSlug}`);
        }
      }
      
      if (updated) {
        await fs.writeFile(filePath, content, 'utf-8');
        updatedCount++;
      }
    }
    
    console.log(`\n✨ Updated ${updatedCount} MDX files with sanitized paths.`);
    
  } catch (error) {
    console.error('Error updating MDX files:', error);
    process.exit(1);
  }
}

// Run the update
updateGuestMDXFiles();