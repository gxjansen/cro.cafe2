#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const platformsDir = join(__dirname, '..', 'src', 'content', 'platforms');

// Read all JSON files in the platforms directory
const files = readdirSync(platformsDir).filter(file => file.endsWith('.json'));

for (const file of files) {
  const filePath = join(platformsDir, file);
  const content = readFileSync(filePath, 'utf-8');
  
  // Check if file has merge conflicts
  if (content.includes('<<<<<<< HEAD')) {
    console.log(`Fixing merge conflicts in ${file}...`);
    
    // Parse the conflicted content
    const lines = content.split('\n');
    const fixedLines = [];
    let inConflict = false;
    let keepingHead = true;
    
    for (const line of lines) {
      if (line.startsWith('<<<<<<< HEAD')) {
        inConflict = true;
        keepingHead = true;
        continue;
      } else if (line.startsWith('=======')) {
        keepingHead = false;
        continue;
      } else if (line.includes('>>>>>>>')) {
        inConflict = false;
        continue;
      }
      
      if (!inConflict || keepingHead) {
        fixedLines.push(line);
      }
    }
    
    // Write the fixed content
    const fixedContent = fixedLines.join('\n');
    
    // Ensure valid JSON
    try {
      JSON.parse(fixedContent);
      writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed ${file}`);
    } catch (e) {
      console.error(`❌ Failed to fix ${file}: Invalid JSON after merge conflict resolution`);
      console.error(e.message);
    }
  }
}

console.log('\nDone fixing merge conflicts!');