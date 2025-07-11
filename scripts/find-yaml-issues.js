#!/usr/bin/env node

/**
 * Find files with potential YAML issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EPISODES_DIR = path.join(__dirname, '..', 'src', 'content', 'episodes');

function checkEpisodeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      console.log(`  ⚠️  No frontmatter found`);
      return false;
    }
    
    const frontmatter = match[1];
    
    // Try to parse YAML
    try {
      yaml.load(frontmatter);
      return true;
    } catch (error) {
      console.log(`  ❌ YAML Error: ${error.message}`);
      
      // Check for common issues
      const lines = frontmatter.split('\n');
      lines.forEach((line, index) => {
        // Check for problematic quote patterns
        if (line.match(/:\s*"[^"]*\\"/)) {
          console.log(`    Line ${index + 2}: Contains escaped quotes inside quoted string`);
        }
        if (line.match(/:\s*""\\"/)) {
          console.log(`    Line ${index + 2}: Contains double quotes at start`);
        }
        if (line.match(/"\s*$/)) {
          const openQuotes = (line.match(/"/g) || []).length;
          const escapedQuotes = (line.match(/\\"/g) || []).length;
          if ((openQuotes - escapedQuotes) % 2 !== 0) {
            console.log(`    Line ${index + 2}: Unmatched quotes`);
          }
        }
      });
      
      return false;
    }
  } catch (error) {
    console.log(`  ⚠️  Error reading file: ${error.message}`);
    return false;
  }
}

function processDirectory(dir) {
  let totalFiles = 0;
  let errorFiles = 0;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const { total, errors } = processDirectory(fullPath);
      totalFiles += total;
      errorFiles += errors;
    } else if (entry.name.endsWith('.mdx')) {
      totalFiles++;
      console.log(`Checking ${path.relative(EPISODES_DIR, fullPath)}...`);
      if (!checkEpisodeFile(fullPath)) {
        errorFiles++;
      }
    }
  }
  
  return { total: totalFiles, errors: errorFiles };
}

console.log('🔍 Finding YAML issues in episode files...\n');

const { total, errors } = processDirectory(EPISODES_DIR);

console.log(`\n📊 Found ${errors} files with YAML issues out of ${total} total files.`);