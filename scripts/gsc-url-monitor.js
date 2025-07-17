#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';

/**
 * Google Search Console URL Monitor
 * 
 * This script connects to GSC API to get indexed URLs and checks their status
 * 
 * Setup:
 * 1. Enable Search Console API in Google Cloud Console
 * 2. Create credentials and download JSON key
 * 3. Set environment variable: GSC_CREDENTIALS_PATH=/path/to/credentials.json
 * 4. Run: node scripts/gsc-url-monitor.js
 */

// Configuration
const SITE_URLS = [
  'https://www.cro.cafe',
  'https://nl.cro.cafe',
  'https://de.cro.cafe',
  'https://es.cro.cafe'
];

// Initialize Google Search Console API
async function initializeGSC() {
  const credentialsPath = process.env.GSC_CREDENTIALS_PATH;
  
  if (!credentialsPath) {
    throw new Error('GSC_CREDENTIALS_PATH environment variable not set');
  }
  
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  
  const searchconsole = google.searchconsole({
    version: 'v1',
    auth
  });
  
  return searchconsole;
}

// Get URLs from Search Console
async function getIndexedUrls(searchconsole, siteUrl, startDate, endDate) {
  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 25000 // Maximum allowed
      }
    });
    
    return response.data.rows || [];
  } catch (error) {
    console.error(chalk.red(`Error fetching data for ${siteUrl}: ${error.message}`));
    return [];
  }
}

// Check URL status
async function checkUrlStatus(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      timeout: 10000
    });
    
    return {
      url,
      status: response.status,
      finalUrl: response.url,
      redirected: response.url !== url,
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

// Generate redirect suggestion
function generateRedirectSuggestion(oldUrl, newDomain = 'https://cro.cafe') {
  const url = new URL(oldUrl);
  const path = url.pathname;
  
  // Determine language from subdomain
  let lang = 'en';
  if (url.hostname.includes('nl.')) lang = 'nl';
  if (url.hostname.includes('de.')) lang = 'de';
  if (url.hostname.includes('es.')) lang = 'es';
  
  // Generate suggested new URL based on path
  let newPath = path;
  
  if (path.startsWith('/podcast/')) {
    const slug = path.replace('/podcast/', '');
    newPath = `/${lang}/episodes/${slug}`;
  } else if (path.startsWith('/guest/') || path.startsWith('/gast/') || path.startsWith('/invitado/')) {
    const slug = path.split('/').pop();
    newPath = `/guests/${slug}`;
  } else if (path === '/') {
    newPath = lang === 'en' ? '/' : `/${lang}/`;
  }
  
  return `${newDomain}${newPath}`;
}

// Main function
async function main() {
  console.log(chalk.blue('🔍 Google Search Console URL Monitor\n'));
  
  const useAPI = process.env.GSC_CREDENTIALS_PATH && !process.argv.includes('--no-api');
  
  if (useAPI) {
    console.log(chalk.yellow('Connecting to Google Search Console API...'));
    
    try {
      const searchconsole = await initializeGSC();
      
      // Date range (last 3 months)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      
      const allUrls = [];
      
      // Fetch URLs for each site
      for (const siteUrl of SITE_URLS) {
        console.log(chalk.blue(`\nFetching URLs from ${siteUrl}...`));
        
        const urls = await getIndexedUrls(
          searchconsole,
          siteUrl,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        
        console.log(chalk.gray(`Found ${urls.length} URLs`));
        allUrls.push(...urls.map(row => ({
          url: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0
        })));
      }
      
      console.log(chalk.blue(`\nTotal URLs to check: ${allUrls.length}`));
      
      // Check each URL
      const results = {
        working: [],
        redirected: [],
        broken: [],
        errors: []
      };
      
      for (const urlData of allUrls) {
        const status = await checkUrlStatus(urlData.url);
        
        if (status.success) {
          if (status.redirected) {
            results.redirected.push({ ...urlData, ...status });
            console.log(chalk.yellow('→'), urlData.url);
          } else {
            results.working.push({ ...urlData, ...status });
            console.log(chalk.green('✓'), urlData.url);
          }
        } else if (status.status === 'error') {
          results.errors.push({ ...urlData, ...status });
          console.log(chalk.red('✗'), urlData.url, chalk.red(`(${status.error})`));
        } else {
          results.broken.push({ ...urlData, ...status });
          console.log(chalk.red('✗'), urlData.url, chalk.red(`(${status.status})`));
        }
      }
      
      // Generate report
      console.log(chalk.blue('\n📊 Summary:'));
      console.log(chalk.green(`✓ Working: ${results.working.length}`));
      console.log(chalk.yellow(`→ Redirected: ${results.redirected.length}`));
      console.log(chalk.red(`✗ Broken: ${results.broken.length}`));
      console.log(chalk.red(`⚠ Errors: ${results.errors.length}`));
      
      // Generate redirect suggestions for broken URLs
      if (results.broken.length > 0) {
        console.log(chalk.yellow('\n🔧 Suggested Redirects:'));
        
        const redirects = results.broken
          .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
          .slice(0, 20) // Top 20 by impressions
          .map(urlData => ({
            from: urlData.url,
            to: generateRedirectSuggestion(urlData.url),
            impressions: urlData.impressions,
            clicks: urlData.clicks
          }));
        
        redirects.forEach(({ from, to, impressions, clicks }) => {
          console.log(chalk.red(`\n${from}`));
          console.log(chalk.gray(`  Impressions: ${impressions}, Clicks: ${clicks}`));
          console.log(chalk.green(`  → ${to}`));
        });
        
        // Save to TOML format
        let tomlContent = '# Generated Redirects from GSC\n\n';
        redirects.forEach(({ from, to }) => {
          const fromUrl = new URL(from);
          tomlContent += `[[redirects]]\n`;
          tomlContent += `  from = "${fromUrl.pathname}"\n`;
          tomlContent += `  to = "${new URL(to).pathname}"\n`;
          tomlContent += `  status = 301\n\n`;
        });
        
        await fs.writeFile('gsc-suggested-redirects.toml', tomlContent);
        console.log(chalk.blue('\n📄 Suggested redirects saved to: gsc-suggested-redirects.toml'));
      }
      
      // Save full report
      const reportPath = `gsc-url-report-${new Date().toISOString().split('T')[0]}.json`;
      await fs.writeFile(reportPath, JSON.stringify({
        date: new Date().toISOString(),
        summary: {
          total: allUrls.length,
          working: results.working.length,
          redirected: results.redirected.length,
          broken: results.broken.length,
          errors: results.errors.length
        },
        results
      }, null, 2));
      
      console.log(chalk.blue(`\n📄 Full report saved to: ${reportPath}`));
      
    } catch (error) {
      console.error(chalk.red(`API Error: ${error.message}`));
      console.log(chalk.yellow('\nFalling back to manual URL list...'));
      // Fall back to manual checking
      await manualCheck();
    }
  } else {
    console.log(chalk.yellow('Running in manual mode (no API)...'));
    await manualCheck();
  }
}

// Manual check without API
async function manualCheck() {
  console.log(chalk.yellow('\nTo use Google Search Console API:'));
  console.log('1. Enable Search Console API in Google Cloud Console');
  console.log('2. Create service account and download credentials');
  console.log('3. Add service account email to GSC property users');
  console.log('4. Set GSC_CREDENTIALS_PATH=/path/to/credentials.json');
  console.log('\nFor now, run: node scripts/check-old-site-urls.js');
}

// Run the script
main().catch(console.error);