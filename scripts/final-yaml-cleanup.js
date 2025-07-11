#!/usr/bin/env node

/**
 * Final cleanup for YAML issues in episode files
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
    
    // Fix descriptions with problematic backslashes and quotes
    content = content.replace(/^(\s*)description:\s*"(.+?)"\s*$/gm, (match, indent, desc) => {
      // Replace \" with " in the description
      let fixedDesc = desc.replace(/\\"/g, '"');
      
      // If the description contains quotes or special characters, we need to use multiline format
      if (fixedDesc.includes('"') || fixedDesc.includes('\\') || fixedDesc.length > 120) {
        modified = true;
        // Use the pipe | for multiline strings
        return `${indent}description: |\n${indent}  ${fixedDesc}`;
      }
      
      return match;
    });
    
    // Fix keywords that might still have issues
    content = content.replace(/^(\s*)keywords:\s*\[([^\]]*)\]\s*$/gm, (match, indent, keywords) => {
      if (keywords.trim() === '') {
        return `${indent}keywords: []`;
      }
      // Ensure proper formatting of array items
      const items = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      const formatted = items.map(k => {
        // Remove existing quotes and re-add them
        k = k.replace(/^["']|["']$/g, '');
        return `"${k}"`;
      }).join(', ');
      return `${indent}keywords: [${formatted}]`;
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

console.log('🔧 Final YAML cleanup for episode files...\n');

const { total, fixed } = processDirectory(EPISODES_DIR);

console.log(`\n✅ Complete! Fixed ${fixed} out of ${total} episode files.`);