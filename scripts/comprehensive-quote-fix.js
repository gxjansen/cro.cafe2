#!/usr/bin/env node

/**
 * Comprehensive fix for YAML quote issues
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
    
    // Extract frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      return false;
    }
    
    const frontmatterStart = match.index + 4; // After "---\n"
    const frontmatterEnd = frontmatterStart + match[1].length;
    let frontmatter = match[1];
    
    // Process each line in frontmatter
    const lines = frontmatter.split('\n');
    const processedLines = lines.map((line, index) => {
      // Check if this is a field line (has a colon)
      const fieldMatch = line.match(/^(\s*)([a-zA-Z]+):\s*(.*)$/);
      if (!fieldMatch) {
        return line;
      }
      
      const [, indent, field, value] = fieldMatch;
      
      // Skip fields that don't typically have quote issues
      if (['episode', 'season', 'isExplicit', 'duration'].includes(field)) {
        return line;
      }
      
      // Check for problematic quoted values
      if (value.startsWith('"')) {
        // Count quotes in the value
        const allQuotes = (value.match(/"/g) || []).length;
        const escapedQuotes = (value.match(/\\"/g) || []).length;
        const unescapedQuotes = allQuotes - (escapedQuotes * 2); // \\" counts as 2 characters
        
        // Check for various problematic patterns
        if (value.match(/^""\\"/) || // Starts with ""\
            value.match(/\\"""$/) || // Ends with \"""
            value.match(/^"[^"]*\\"[^"]*"[^"]+/) || // Has \" followed by " and more content
            unescapedQuotes % 2 !== 0) { // Odd number of unescaped quotes
          
          modified = true;
          
          // Clean up the value
          let cleanValue = value;
          
          // Remove outer quotes
          if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
            cleanValue = cleanValue.slice(1, -1);
          } else if (cleanValue.startsWith('""') && cleanValue.endsWith('""')) {
            cleanValue = cleanValue.slice(2, -2);
          }
          
          // Replace escaped quotes with regular quotes
          cleanValue = cleanValue.replace(/\\"/g, '"');
          
          // Remove any trailing quote
          if (cleanValue.endsWith('"') && !cleanValue.endsWith('""')) {
            cleanValue = cleanValue.slice(0, -1);
          }
          
          // For fields that often have complex content, use multiline format
          if (['title', 'description', 'summary'].includes(field) && 
              (cleanValue.includes('"') || cleanValue.length > 80)) {
            return `${indent}${field}: |\n${indent}  ${cleanValue}`;
          } else {
            // For simple values, just quote them properly
            return `${indent}${field}: "${cleanValue}"`;
          }
        }
      }
      
      return line;
    });
    
    if (modified) {
      const newFrontmatter = processedLines.join('\n');
      const newContent = content.substring(0, frontmatterStart) + 
                        newFrontmatter + 
                        content.substring(frontmatterEnd);
      
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

console.log('🔧 Comprehensive quote fix for YAML issues...\n');

const { total, fixed } = processDirectory(EPISODES_DIR);

console.log(`\n✅ Complete! Fixed ${fixed} out of ${total} episode files.`);