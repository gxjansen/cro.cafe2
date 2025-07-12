#!/usr/bin/env node

/**
 * Fix date fields in episode files - remove quotes from date values
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EPISODES_DIR = path.join(__dirname, '..', 'src', 'content', 'episodes');

function fixEpisodeFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix pubDate field - remove quotes if it's a valid date string
    content = content.replace(/^(\s*)pubDate:\s*"([^"]+)"/gm, (match, indent, dateValue) => {
      // Check if it's a valid ISO date
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)) {
        modified = true;
        return `${indent}pubDate: ${dateValue}`;
      }
      return match;
    });
    
    // Fix transistorId field - ensure numeric values are quoted
    content = content.replace(/^(\s*)transistorId:\s*(\d+)$/gm, (match, indent, id) => {
      modified = true;
      return `${indent}transistorId: "${id}"`;
    });
    
    // Fix transistorId field - remove double quotes (if they exist)
    content = content.replace(/^(\s*)transistorId:\s*"(\d+)""/gm, (match, indent, id) => {
      modified = true;
      return `${indent}transistorId: "${id}"`;
    });
    
    // Fix description field - remove extra quotes
    content = content.replace(/^(\s*)description:\s*"\\?"([^"]+?)\\?"/gm, (match, indent, desc) => {
      modified = true;
      // If description contains quotes, we need to keep it quoted but properly escaped
      if (desc.includes('"')) {
        return `${indent}description: "${desc.replace(/\\"/g, '"')}"`;
      } else {
        return `${indent}description: "${desc}"`;
      }
    });
    
    // Fix title field - remove extra quotes  
    content = content.replace(/^(\s*)title:\s*"(.+?)""/gm, (match, indent, title) => {
      modified = true;
      return `${indent}title: "${title}"`;
    });
    
    // Fix isExplicit multiline issue
    content = content.replace(/^(\s*)isExplicit:\s*\|\s*\n\s*false\s*\n\s*keywords:/gm, '$1isExplicit: false\nkeywords:');
    
    // Fix other string fields with unnecessary quotes
    ['audioUrl', 'imageUrl', 'shareUrl', 'duration', 'language'].forEach(field => {
      content = content.replace(new RegExp(`^(\\s*)${field}:\\s*"([^"]+)"`, 'gm'), (match, indent, value) => {
        // These fields don't need quotes unless they contain special characters
        if (value.includes(' ') || value.includes(':') || value.includes('"')) {
          return match; // Keep quotes
        }
        modified = true;
        return `${indent}${field}: ${value}`;
      });
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`  Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

function processDirectory(dir) {
  let totalFiles = 0;
  let fixedFiles = 0;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const { total, fixed } = processDirectory(fullPath);
      totalFiles += total;
      fixedFiles += fixed;
    } else if (entry.name.endsWith('.mdx')) {
      totalFiles++;
      console.log(`Checking ${path.relative(EPISODES_DIR, fullPath)}...`);
      if (fixEpisodeFile(fullPath)) {
        fixedFiles++;
        console.log(`  ✅ Fixed`);
      }
    }
  }
  
  return { total: totalFiles, fixed: fixedFiles };
}

console.log('🔧 Restoring proper date formatting in episode files...\n');

const { total, fixed } = processDirectory(EPISODES_DIR);

console.log(`\n✅ Complete! Fixed ${fixed} out of ${total} episode files.`);