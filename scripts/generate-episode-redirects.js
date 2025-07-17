#!/usr/bin/env node

import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Function to derive old URL from current slug
function deriveOldUrl(slug, episodeNumber, language) {
  // For German episodes 36+, the old URL didn't have the episode number prefix
  if (language === 'de' && episodeNumber >= 36) {
    // Remove the episode number prefix (e.g., "42-the-future-of-cro" -> "the-future-of-cro")
    const match = slug.match(/^\d+-(.+)$/);
    if (match) {
      return match[1];
    }
  }
  
  // Check if any episode has a number prefix that needs to be removed
  // This could apply to other languages too
  const numberPrefixMatch = slug.match(/^\d+-(.+)$/);
  if (numberPrefixMatch) {
    console.log(`  [${language}] Episode ${episodeNumber} has number prefix: ${slug}`);
    // For now, only German episodes need this transformation
    // Other languages might have different patterns
  }
  
  // For other episodes, assume the slug was the same
  return slug;
}

// Function to generate redirects for a language
async function generateRedirectsForLanguage(lang) {
  const redirects = [];
  const episodeFiles = await glob(`src/content/episodes/${lang}/**/*.mdx`);
  
  console.log(`\nProcessing ${lang} episodes...`);
  
  for (const file of episodeFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const { data } = matter(content);
      
      if (data.slug && data.status === 'published') {
        const oldSlug = deriveOldUrl(data.slug, data.episode || 0, lang);
        
        // For all languages, we need redirects from the old subdomain structure
        // even if the slug hasn't changed, because the path changed from /podcast/ to /[lang]/episodes/
        const subdomain = lang === 'en' ? 'www' : lang;
        
        // Check if this is a specific redirect (slug changed) or generic (path changed)
        const isSpecificRedirect = oldSlug !== data.slug;
        
        if (isSpecificRedirect) {
          console.log(`  Episode ${data.episode}: ${oldSlug} -> ${data.slug} (slug changed)`);
        }
        
        // Always create redirect for the old subdomain URL
        redirects.push({
          from: `https://${subdomain}.cro.cafe/podcast/${oldSlug}`,
          to: `https://cro.cafe/${lang}/episodes/${data.slug}/`,
          status: 301,
          force: true,
          episode: data.episode,
          title: data.title,
          type: isSpecificRedirect ? 'specific' : 'generic'
        });
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  return redirects;
}

// Main function
async function generateAllRedirects() {
  const languages = ['en', 'nl', 'de', 'es'];
  const allRedirects = [];
  
  // Check command line argument
  const includeGenericRedirects = process.argv.includes('--all');
  
  if (includeGenericRedirects) {
    console.log('Generating ALL redirects (including generic path changes)...');
  } else {
    console.log('Generating only SPECIFIC redirects (where slugs changed)...');
    console.log('Use --all flag to include all episode redirects');
  }
  
  for (const lang of languages) {
    const langRedirects = await generateRedirectsForLanguage(lang);
    // Filter based on command line argument
    const filteredRedirects = includeGenericRedirects 
      ? langRedirects 
      : langRedirects.filter(r => r.type === 'specific');
    allRedirects.push(...filteredRedirects);
  }
  
  // Group redirects by language
  const redirectsByLang = {
    en: allRedirects.filter(r => r.from.includes('www.cro.cafe')),
    nl: allRedirects.filter(r => r.from.includes('nl.cro.cafe')),
    de: allRedirects.filter(r => r.from.includes('de.cro.cafe')),
    es: allRedirects.filter(r => r.from.includes('es.cro.cafe'))
  };
  
  // Generate TOML format
  let tomlContent = `# ============================================================================
# EPISODE-SPECIFIC REDIRECTS (Auto-generated from episode slugs)
# ============================================================================
# Generated on: ${new Date().toISOString()}
# Run 'npm run generate-redirects' to regenerate
#
# These redirects handle old episode URLs to new slug-based URLs
# They must come BEFORE generic wildcard redirects in netlify.toml

`;
  
  // Add redirects grouped by language
  for (const [lang, redirects] of Object.entries(redirectsByLang)) {
    if (redirects.length > 0) {
      tomlContent += `# ${lang.toUpperCase()} Episode Redirects\n`;
      
      // Sort by episode number
      redirects.sort((a, b) => (a.episode || 0) - (b.episode || 0));
      
      for (const redirect of redirects) {
        tomlContent += `# Episode ${redirect.episode}: ${redirect.title}\n`;
        tomlContent += `[[redirects]]\n`;
        tomlContent += `  from = "${redirect.from}"\n`;
        tomlContent += `  to = "${redirect.to}"\n`;
        tomlContent += `  status = ${redirect.status}\n`;
        tomlContent += `  force = ${redirect.force}\n\n`;
      }
    }
  }
  
  // Write to a separate file that can be included or copied
  await fs.writeFile('generated-redirects.toml', tomlContent);
  console.log(`\nGenerated ${allRedirects.length} redirects to generated-redirects.toml`);
  
  // Also output some stats
  console.log('\nRedirects by language:');
  for (const [lang, redirects] of Object.entries(redirectsByLang)) {
    if (redirects.length > 0) {
      console.log(`  ${lang}: ${redirects.length} redirects`);
    }
  }
  
  // Also create a JSON version for easier inspection
  await fs.writeFile('generated-redirects.json', JSON.stringify(allRedirects, null, 2));
  console.log('\nAlso created generated-redirects.json for inspection');
}

// Run the script
generateAllRedirects().catch(console.error);