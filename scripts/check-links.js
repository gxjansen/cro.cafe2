#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';
import { glob } from 'glob';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');

// Known external links that we don't need to check
const externalPatterns = [
  /^https?:\/\//,
  /^mailto:/,
  /^tel:/,
  /^#/,  // anchor links
];

// Known static assets that might be missing in dev but exist in production
const ignoredPaths = [
  /^\/images\/(favicon\.ico|crocafe-icon\.png|apple-touch-icon\.png|platforms\/.*\.png)$/,
  /^\/rss\/(en|nl|de|es)\.xml$/,
  /^\/_astro\/.*\.(css|js)$/,
  /^\/favicon\.ico$/,
];

// Extract all href links from HTML content
function extractLinks(htmlContent, filePath) {
  const links = [];
  const hrefPattern = /href=["']([^"']+)["']/g;
  let match;
  
  while ((match = hrefPattern.exec(htmlContent)) !== null) {
    const href = match[1];
    
    // Skip external links and anchors
    if (externalPatterns.some(pattern => pattern.test(href))) {
      continue;
    }
    
    // Skip known static assets
    if (ignoredPaths.some(pattern => pattern.test(href))) {
      continue;
    }
    
    links.push({
      href,
      source: filePath,
      line: htmlContent.substring(0, match.index).split('\n').length
    });
  }
  
  return links;
}

// Normalize a path to check if it exists
function normalizePath(href, currentFile) {
  // Remove query strings and fragments
  let cleanPath = href.split('?')[0].split('#')[0];
  
  // Handle absolute paths
  if (cleanPath.startsWith('/')) {
    // For paths without trailing slash, check if directory exists
    if (!cleanPath.endsWith('/')) {
      // Check if it's a directory that should have a trailing slash
      const possibleDir = join(distDir, cleanPath);
      const possibleIndexFile = join(possibleDir, 'index.html');
      
      try {
        if (statSync(possibleDir).isDirectory() && statSync(possibleIndexFile).isFile()) {
          // This is a directory with an index.html, should have trailing slash
          return { 
            path: cleanPath + '/', 
            fullPath: possibleIndexFile,
            shouldHaveTrailingSlash: true 
          };
        }
      } catch (e) {
        // Not a directory, continue
      }
    }
    
    // Convert path to file system path
    if (cleanPath === '/') {
      return { path: cleanPath, fullPath: join(distDir, 'index.html') };
    } else if (cleanPath.endsWith('/')) {
      return { path: cleanPath, fullPath: join(distDir, cleanPath, 'index.html') };
    } else {
      return { path: cleanPath, fullPath: join(distDir, cleanPath + '.html') };
    }
  }
  
  // Handle relative paths
  const currentDir = dirname(currentFile);
  let resolvedPath = join(currentDir, cleanPath);
  
  // Make it relative to dist directory
  resolvedPath = resolvedPath.replace(distDir, '');
  
  return { path: cleanPath, fullPath: join(distDir, resolvedPath) };
}

// Check if a file exists
function fileExists(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.isFile();
  } catch (e) {
    return false;
  }
}

// Main function to check all links
async function checkLinks() {
  console.log(chalk.blue('🔍 Checking for broken links...\n'));
  
  // Find all HTML files in dist directory
  const htmlFiles = await glob('**/*.html', { cwd: distDir });
  
  if (htmlFiles.length === 0) {
    console.error(chalk.red('❌ No HTML files found in dist directory. Make sure to run build first.'));
    process.exit(1);
  }
  
  console.log(chalk.gray(`Found ${htmlFiles.length} HTML files to check\n`));
  
  const brokenLinks = [];
  const checkedLinks = new Set();
  let totalLinks = 0;
  
  // Process each HTML file
  for (const file of htmlFiles) {
    const filePath = join(distDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const links = extractLinks(content, file);
    
    // Check each link
    for (const link of links) {
      totalLinks++;
      
      // Skip if we've already checked this exact link
      const linkKey = `${link.href}|${link.source}`;
      if (checkedLinks.has(linkKey)) {
        continue;
      }
      checkedLinks.add(linkKey);
      
      const normalized = normalizePath(link.href, filePath);
      
      if (!fileExists(normalized.fullPath)) {
        brokenLinks.push({
          ...link,
          expectedPath: normalized.fullPath,
          normalizedHref: normalized.path,
          shouldHaveTrailingSlash: normalized.shouldHaveTrailingSlash
        });
      }
    }
  }
  
  // Report results
  console.log(chalk.gray(`\nChecked ${totalLinks} links across ${htmlFiles.length} files\n`));
  
  if (brokenLinks.length === 0) {
    console.log(chalk.green('✅ All links are valid!\n'));
    process.exit(0);
  } else {
    console.log(chalk.red(`❌ Found ${brokenLinks.length} broken links:\n`));
    
    // Group broken links by source file
    const linksBySource = {};
    for (const link of brokenLinks) {
      if (!linksBySource[link.source]) {
        linksBySource[link.source] = [];
      }
      linksBySource[link.source].push(link);
    }
    
    // Display broken links grouped by source
    for (const [source, links] of Object.entries(linksBySource)) {
      console.log(chalk.yellow(`\n📄 ${source}:`));
      for (const link of links) {
        console.log(chalk.red(`  Line ${link.line}: ${link.href}`));
        if (link.shouldHaveTrailingSlash) {
          console.log(chalk.gray(`    → Should have trailing slash: ${link.href}/`));
        }
      }
    }
    
    console.log(chalk.red(`\n❌ Link check failed! Fix the broken links above.\n`));
    process.exit(1);
  }
}

// Run the check
checkLinks().catch(err => {
  console.error(chalk.red('Error running link check:'), err);
  process.exit(1);
});