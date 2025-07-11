#!/usr/bin/env node

/**
 * Comprehensive YAML fix for episode files
 * Removes all orphaned content and fixes YAML formatting issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EPISODES_DIR = path.join(__dirname, '..', 'src', 'content', 'episodes');

// Fields that should be in the frontmatter
const VALID_FIELDS = [
  'title', 'description', 'pubDate', 'season', 'episode', 'duration',
  'audioUrl', 'language', 'transistorId', 'episodeType', 'slug',
  'keywords', 'summary', 'featured', 'isExplicit', 'imageUrl', 'shareUrl'
];

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
    
    // Parse frontmatter to extract valid fields only
    const fields = {};
    const lines = frontmatterContent.split('\n');
    let currentField = null;
    let currentValue = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fieldMatch = line.match(/^([a-zA-Z_]+):\s*(.*)/);
      
      if (fieldMatch) {
        // Save previous field if any
        if (currentField && VALID_FIELDS.includes(currentField)) {
          fields[currentField] = currentValue.trim();
        }
        
        // Start new field
        currentField = fieldMatch[1];
        currentValue = fieldMatch[2];
      } else if (currentField && (line.startsWith('  ') || line.startsWith('\t'))) {
        // Continuation of multiline value
        currentValue += '\n' + line.trimEnd();
      }
    }
    
    // Save last field
    if (currentField && VALID_FIELDS.includes(currentField)) {
      fields[currentField] = currentValue.trim();
    }
    
    // Process fields
    const processedFields = {};
    for (const [key, value] of Object.entries(fields)) {
      if (key === 'keywords') {
        // Convert keywords to array if needed
        if (typeof value === 'string' && !value.startsWith('[')) {
          const keywordsArray = value
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
          processedFields[key] = keywordsArray;
        } else if (value.startsWith('[')) {
          // Parse existing array
          try {
            processedFields[key] = JSON.parse(value);
          } catch {
            processedFields[key] = [];
          }
        } else {
          processedFields[key] = [];
        }
      } else {
        processedFields[key] = value;
      }
    }
    
    // Build new frontmatter
    const newFrontmatterLines = [];
    
    // Add fields in a consistent order
    const fieldOrder = [
      'title', 'episode', 'season', 'slug', 'transistorId', 
      'audioUrl', 'episodeType', 'description', 'pubDate', 
      'language', 'duration', 'isExplicit', 'keywords', 
      'summary', 'featured', 'imageUrl', 'shareUrl'
    ];
    
    for (const field of fieldOrder) {
      if (field in processedFields) {
        const value = processedFields[field];
        
        if (field === 'keywords') {
          newFrontmatterLines.push(`keywords: ${JSON.stringify(value)}`);
        } else if (typeof value === 'string' && value.includes('\n')) {
          // Multiline string
          newFrontmatterLines.push(`${field}: |`);
          value.split('\n').forEach(line => {
            newFrontmatterLines.push(`  ${line}`);
          });
        } else if (typeof value === 'string' && (value.includes('"') || value.includes(':') || value.includes('|'))) {
          // String that needs quoting
          newFrontmatterLines.push(`${field}: "${value.replace(/"/g, '\\"')}"`);
        } else {
          newFrontmatterLines.push(`${field}: ${value}`);
        }
      }
    }
    
    // Build final content
    const newFrontmatter = newFrontmatterLines.join('\n');
    const newContent = `---\n${newFrontmatter}\n---\n\n`;
    
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

console.log('🔧 Comprehensive YAML fix for episode files...\n');

const { total, fixed } = processDirectory(EPISODES_DIR);

console.log(`\n✅ Complete! Fixed ${fixed} out of ${total} episode files.`);