#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to extract slug from URL
function extractSlug(url) {
  const match = url.match(/\/podcast\/(.+?)(?:\/)?$/);
  return match ? match[1] : null;
}

// Helper function to find best match for a slug
function findBestMatch(oldSlug, availableSlugs) {
  // First try exact match
  if (availableSlugs.includes(oldSlug)) {
    return oldSlug;
  }
  
  // Try match with episode number prefix
  const numberPrefixMatch = availableSlugs.find(slug => {
    const withoutNumber = slug.replace(/^\d+-/, '');
    return withoutNumber === oldSlug;
  });
  if (numberPrefixMatch) return numberPrefixMatch;
  
  // Try fuzzy match (contains)
  const fuzzyMatch = availableSlugs.find(slug => 
    slug.includes(oldSlug) || oldSlug.includes(slug)
  );
  if (fuzzyMatch) return fuzzyMatch;
  
  // Try partial match (at least 70% of words match)
  const oldWords = oldSlug.split('-');
  const bestPartialMatch = availableSlugs.reduce((best, slug) => {
    const slugWords = slug.split('-');
    const matchingWords = oldWords.filter(word => 
      slugWords.some(slugWord => slugWord.includes(word) || word.includes(slugWord))
    );
    const matchRatio = matchingWords.length / Math.max(oldWords.length, slugWords.length);
    
    if (matchRatio > 0.7 && matchRatio > (best.ratio || 0)) {
      return { slug, ratio: matchRatio };
    }
    return best;
  }, {});
  
  return bestPartialMatch.slug || null;
}

// Load current episode slugs from the codebase
function loadCurrentSlugs() {
  const slugs = { de: [], nl: [], es: [], en: [] };
  const episodesDir = path.join(__dirname, '../src/content/episodes');
  
  for (const lang of ['de', 'nl', 'es', 'en']) {
    const langDir = path.join(episodesDir, lang);
    if (fs.existsSync(langDir)) {
      const files = fs.readdirSync(langDir, { recursive: true });
      files.forEach(file => {
        if (file.endsWith('.mdx')) {
          const content = fs.readFileSync(path.join(langDir, file), 'utf8');
          const slugMatch = content.match(/slug:\s*(.+)/);
          if (slugMatch) {
            slugs[lang].push(slugMatch[1].trim());
          }
        }
      });
    }
  }
  
  return slugs;
}

// Process redirects CSV
function processRedirects(csvFile, lang) {
  const content = fs.readFileSync(csvFile, 'utf8');
  const records = parse(content, { columns: true });
  
  const redirects = [];
  const unmapped = [];
  
  records.forEach(record => {
    const source = record.source;
    const target = record.target;
    
    // Skip external URLs
    if (target.startsWith('http')) {
      redirects.push({ source, target, type: 'external' });
      return;
    }
    
    // Map internal redirects
    let mappedTarget = target;
    
    // Handle /podcast -> /episodes
    if (target === '/podcast') {
      mappedTarget = `/${lang}/episodes/`;
    } else if (target.startsWith('/podcast/')) {
      mappedTarget = target.replace('/podcast/', `/${lang}/episodes/`);
    }
    
    // Handle /subscribe
    if (target === '/subscribe' || target === '/abonnieren') {
      mappedTarget = `/${lang}/subscribe/`;
    }
    
    // Handle /guest or /gaste
    if (target === '/guest' || target === '/gaste') {
      mappedTarget = '/all/guests/';
    }
    
    redirects.push({ 
      source: `https://${lang}.cro.cafe${source}`,
      target: `https://cro.cafe${mappedTarget}`,
      type: 'internal'
    });
  });
  
  return { redirects, unmapped };
}

// Process sitemap XML
function processSitemap(xmlFile, lang, currentSlugs) {
  const content = fs.readFileSync(xmlFile, 'utf8');
  const urls = content.match(/https:\/\/[^<]*/g) || [];
  
  const redirects = [];
  const unmapped = [];
  
  urls.forEach(url => {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Skip home page
    if (path === '/' || path === '') return;
    
    // Handle podcast episodes
    if (path.startsWith('/podcast/')) {
      const oldSlug = extractSlug(path);
      if (oldSlug) {
        const newSlug = findBestMatch(oldSlug, currentSlugs[lang]);
        
        if (newSlug) {
          redirects.push({
            source: url,
            target: `https://cro.cafe/${lang}/episodes/${newSlug}/`,
            type: 'episode',
            confidence: newSlug === oldSlug ? 'exact' : 'fuzzy'
          });
        } else {
          unmapped.push({
            url,
            type: 'episode',
            reason: 'No matching slug found'
          });
        }
      }
    }
    // Handle other pages
    else {
      let mappedPath = path;
      
      // Common mappings
      const mappings = {
        '/about': '/about/',
        '/gaste': '/all/guests/',
        '/guest': '/all/guests/',
        '/search': '/search/',
        '/abonnieren': `/${lang}/subscribe/`,
        '/subscribe': `/${lang}/subscribe/`,
        '/croppuccino': '/about/', // Assuming this is an about/event page
        '/code-of-conduct': '/about/',
        '/privacy-policy': '/privacy-policy/',
        '/rss-episodes': `https://feeds.transistor.fm/cro-cafe${lang === 'de' ? '-deutsch' : lang === 'nl' ? '-nl' : lang === 'es' ? '-es' : ''}`
      };
      
      if (mappings[path]) {
        redirects.push({
          source: url,
          target: mappings[path].startsWith('http') ? mappings[path] : `https://cro.cafe${mappings[path]}`,
          type: 'page'
        });
      } else {
        unmapped.push({
          url,
          type: 'page',
          reason: 'No mapping defined'
        });
      }
    }
  });
  
  return { redirects, unmapped };
}

// Main function
async function main() {
  const currentSlugs = loadCurrentSlugs();
  const allRedirects = [];
  const allUnmapped = [];
  
  console.log('Processing old sitemaps and redirects...\n');
  
  for (const lang of ['de', 'nl', 'es', 'en']) {
    console.log(`\nProcessing ${lang.toUpperCase()}...`);
    
    // Process redirects CSV
    const redirectsCsv = path.join(__dirname, `../docs/old-sitemaps/${lang}-redirects.csv`);
    if (fs.existsSync(redirectsCsv)) {
      const { redirects, unmapped } = processRedirects(redirectsCsv, lang);
      allRedirects.push(...redirects);
      allUnmapped.push(...unmapped.map(u => ({ ...u, lang, source: 'redirects.csv' })));
      console.log(`  - Processed ${redirects.length} redirects from CSV`);
    }
    
    // Process sitemap XML
    const sitemapXml = path.join(__dirname, `../docs/old-sitemaps/${lang}-sitemap.xml`);
    if (fs.existsSync(sitemapXml)) {
      const { redirects, unmapped } = processSitemap(sitemapXml, lang, currentSlugs);
      allRedirects.push(...redirects);
      allUnmapped.push(...unmapped.map(u => ({ ...u, lang, source: 'sitemap.xml' })));
      console.log(`  - Processed ${redirects.length} URLs from sitemap`);
    }
  }
  
  // Generate redirect rules
  console.log('\n\nGENERATED REDIRECTS:\n');
  console.log('# ============================================================================');
  console.log('# OLD SITE REDIRECTS - Generated from old sitemaps and redirect files');
  console.log('# ============================================================================\n');
  
  // Group by language
  for (const lang of ['de', 'nl', 'es', 'en']) {
    const langRedirects = allRedirects.filter(r => r.source.includes(`${lang}.cro.cafe`));
    if (langRedirects.length === 0) continue;
    
    console.log(`# ${lang.toUpperCase()} redirects`);
    langRedirects.forEach(r => {
      console.log(`${r.source}  ${r.target}  301!`);
    });
    console.log('');
  }
  
  // Save unmapped URLs
  if (allUnmapped.length > 0) {
    const unmappedFile = path.join(__dirname, '../docs/unmapped-urls.md');
    let content = '# Unmapped URLs from Old Sites\n\n';
    content += 'These URLs were found in the old sitemaps but could not be automatically mapped to new URLs.\n\n';
    
    for (const lang of ['de', 'nl', 'es', 'en']) {
      const langUnmapped = allUnmapped.filter(u => u.lang === lang);
      if (langUnmapped.length === 0) continue;
      
      content += `## ${lang.toUpperCase()} - ${langUnmapped.length} URLs\n\n`;
      langUnmapped.forEach(u => {
        content += `- ${u.url || u.source} (${u.type}, ${u.reason})\n`;
      });
      content += '\n';
    }
    
    fs.writeFileSync(unmappedFile, content);
    console.log(`\nUnmapped URLs saved to: docs/unmapped-urls.md`);
  }
}

main().catch(console.error);