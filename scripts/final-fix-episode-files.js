#!/usr/bin/env node

/**
 * Final comprehensive fix for all episode file issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EPISODES_DIR = path.join(__dirname, '..', 'src', 'content', 'episodes');

function fixEpisodeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      console.log(`  No frontmatter found in ${filePath}`);
      return false;
    }
    
    const frontmatterContent = match[1];
    const bodyContent = content.slice(match[0].length);
    
    // Parse frontmatter line by line
    const lines = frontmatterContent.split('\n');
    const cleanedLines = [];
    let inMultilineValue = false;
    let currentField = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) {
        if (!inMultilineValue) {
          cleanedLines.push('');
        }
        continue;
      }
      
      // Check if this is a field definition
      const fieldMatch = line.match(/^([a-zA-Z_]+):\s*(.*)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldValue = fieldMatch[2];
        
        // Handle special fields
        if (fieldName === 'keywords') {
          if (fieldValue && !fieldValue.startsWith('[')) {
            // Convert string to array
            const keywordsArray = fieldValue
              .split(',')
              .map(k => k.trim())
              .filter(k => k.length > 0)
              .map(k => `"${k}"`);
            cleanedLines.push(`keywords: [${keywordsArray.join(', ')}]`);
          } else {
            cleanedLines.push(line);
          }
        } else if (fieldName === 'description' || fieldName === 'title' || fieldName === 'summary') {
          // For string fields that might contain quotes, ensure they're properly quoted
          if (fieldValue && !fieldValue.startsWith('"') && !fieldValue.startsWith("'")) {
            // If the value contains quotes, we need to escape them
            if (fieldValue.includes('"')) {
              cleanedLines.push(`${fieldName}: "${fieldValue.replace(/"/g, '\\"')}"`);
            } else {
              cleanedLines.push(line);
            }
          } else {
            cleanedLines.push(line);
          }
        } else {
          cleanedLines.push(line);
        }
        
        inMultilineValue = false;
        currentField = fieldName;
      } 
      // Check if this line starts with proper indentation for multiline values
      else if (line.startsWith('  ') || line.startsWith('\t')) {
        cleanedLines.push(line);
      }
      // Skip orphaned content
      else if (!line.match(/^[a-zA-Z_]+:/) && trimmed) {
        console.log(`  Removing orphaned content: ${trimmed}`);
        // Skip this line
      } else {
        cleanedLines.push(line);
      }
    }
    
    // Join cleaned lines and reconstruct file
    const newFrontmatter = cleanedLines.join('\n').trim();
    
    // Clean up body content - remove orphaned lines before actual MDX content
    let cleanBody = bodyContent;
    const bodyLines = bodyContent.split('\n');
    let foundContent = false;
    const cleanBodyLines = [];
    
    for (const line of bodyLines) {
      const trimmed = line.trim();
      
      // Check if this is actual MDX content
      if (trimmed.startsWith('<') || trimmed.startsWith('#') || foundContent) {
        foundContent = true;
        cleanBodyLines.push(line);
      } else if (!trimmed) {
        // Keep empty lines if we haven't found content yet
        cleanBodyLines.push(line);
      } else {
        // This is orphaned content - skip it
        console.log(`  Removing orphaned body content: ${trimmed}`);
      }
    }
    
    cleanBody = cleanBodyLines.join('\n');
    
    // Ensure body starts with double newline
    if (!cleanBody.startsWith('\n\n')) {
      cleanBody = '\n\n' + cleanBody.trimStart();
    }
    
    const newContent = `---\n${newFrontmatter}\n---${cleanBody}`;
    
    // Check if content changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
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

console.log('🔧 Final fix for episode files...\n');

const { total, fixed } = processDirectory(EPISODES_DIR);

console.log(`\n✅ Complete! Fixed ${fixed} out of ${total} episode files.`);