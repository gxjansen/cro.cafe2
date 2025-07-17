#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

// Configuration
const OLD_DOMAINS = [
  'https://www.cro.cafe',
  'https://nl.cro.cafe',
  'https://de.cro.cafe', 
  'https://es.cro.cafe'
];

const COMMON_PATHS = [
  '/podcast/',
  '/guest/',
  '/gast/',
  '/invitado/',
  '/event/',
  '/book/',
  '/live'
];

// Function to check if a URL redirects properly
async function checkUrl(url, followRedirects = true) {
  try {
    const response = await fetch(url, {
      redirect: followRedirects ? 'follow' : 'manual',
      timeout: 10000
    });
    
    return {
      url,
      status: response.status,
      redirectedTo: response.url !== url ? response.url : null,
      success: response.status < 400
    };
  } catch (error) {
    return {
      url,
      status: 'error',
      error: error.message,
      success: false
    };
  }
}

// Function to get URLs from Google Search Console export
async function getUrlsFromGSC(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const urls = [];
    
    // Skip header and parse URLs
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // GSC exports are usually CSV with URL in first column
        const url = line.split(',')[0].replace(/"/g, '');
        if (url.startsWith('http')) {
          urls.push(url);
        }
      }
    }
    
    return urls;
  } catch (error) {
    console.error(chalk.red(`Error reading GSC file: ${error.message}`));
    return [];
  }
}

// Function to extract URLs from sitemap
async function getUrlsFromSitemap(sitemapUrl) {
  try {
    const response = await fetch(sitemapUrl);
    const text = await response.text();
    
    // Extract URLs from sitemap XML
    const urlMatches = text.match(/<loc>(.*?)<\/loc>/g);
    if (!urlMatches) return [];
    
    return urlMatches.map(match => 
      match.replace(/<\/?loc>/g, '').trim()
    );
  } catch (error) {
    console.error(chalk.red(`Error fetching sitemap: ${error.message}`));
    return [];
  }
}

// Function to generate test URLs based on patterns
function generateTestUrls() {
  const testUrls = [];
  
  // Add common paths for each domain
  OLD_DOMAINS.forEach(domain => {
    COMMON_PATHS.forEach(path => {
      testUrls.push(`${domain}${path}`);
    });
    
    // Add some specific known URLs
    if (domain.includes('de.cro.cafe')) {
      // German episodes that should redirect
      testUrls.push(
        `${domain}/podcast/the-future-of-cro-mit-rene-gilster`,
        `${domain}/podcast/wie-ki-die-zukunft-des-marketings-verandert`
      );
    }
    
    if (domain.includes('nl.cro.cafe')) {
      // Dutch guest URL
      testUrls.push(`${domain}/gast/bart-van-der-meer`);
    }
  });
  
  return testUrls;
}

// Main function
async function main() {
  console.log(chalk.blue('🔍 Old Site URL Checker\n'));
  
  const args = process.argv.slice(2);
  let urls = [];
  
  if (args.includes('--gsc') && args.length > 1) {
    // Load URLs from Google Search Console export
    const gscFile = args[args.indexOf('--gsc') + 1];
    console.log(chalk.yellow(`Loading URLs from GSC export: ${gscFile}`));
    urls = await getUrlsFromGSC(gscFile);
  } else if (args.includes('--sitemap')) {
    // Load URLs from old sitemaps
    console.log(chalk.yellow('Loading URLs from old sitemaps...'));
    for (const domain of OLD_DOMAINS) {
      const sitemapUrl = `${domain}/sitemap.xml`;
      const sitemapUrls = await getUrlsFromSitemap(sitemapUrl);
      urls.push(...sitemapUrls);
    }
  } else {
    // Use generated test URLs
    console.log(chalk.yellow('Using generated test URLs...'));
    urls = generateTestUrls();
  }
  
  console.log(chalk.blue(`\nChecking ${urls.length} URLs...\n`));
  
  const results = {
    success: [],
    failed: [],
    errors: []
  };
  
  // Check each URL
  for (const url of urls) {
    const result = await checkUrl(url);
    
    if (result.success) {
      results.success.push(result);
      console.log(chalk.green('✓'), url);
      if (result.redirectedTo) {
        console.log(chalk.gray(`  → ${result.redirectedTo}`));
      }
    } else if (result.status === 'error') {
      results.errors.push(result);
      console.log(chalk.red('✗'), url, chalk.red(`(${result.error})`));
    } else {
      results.failed.push(result);
      console.log(chalk.red('✗'), url, chalk.red(`(${result.status})`));
    }
  }
  
  // Summary
  console.log(chalk.blue('\n📊 Summary:'));
  console.log(chalk.green(`✓ Success: ${results.success.length}`));
  console.log(chalk.red(`✗ Failed: ${results.failed.length}`));
  console.log(chalk.yellow(`⚠ Errors: ${results.errors.length}`));
  
  // Save detailed results
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const reportPath = `url-check-report-${timestamp}.json`;
  
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: urls.length,
      success: results.success.length,
      failed: results.failed.length,
      errors: results.errors.length
    },
    results
  }, null, 2));
  
  console.log(chalk.blue(`\n📄 Detailed report saved to: ${reportPath}`));
  
  // Show failed URLs that need redirects
  if (results.failed.length > 0) {
    console.log(chalk.yellow('\n⚠️  URLs that need redirects:'));
    results.failed.forEach(({ url, status }) => {
      console.log(chalk.red(`  ${url} (${status})`));
    });
  }
}

// Run the script
main().catch(console.error);