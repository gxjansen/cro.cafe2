#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';

/**
 * Check URLs from Google Search Console CSV Export
 * 
 * Usage:
 * 1. Go to Google Search Console > Performance > Pages
 * 2. Export data as CSV
 * 3. Run: node scripts/check-gsc-export.js path/to/export.csv
 */

// Function to check URL status
async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CRO.cafe URL Checker/1.0)'
      }
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

// Generate redirect rule
function generateRedirect(oldUrl) {
  try {
    const url = new URL(oldUrl);
    const domain = url.hostname;
    const path = url.pathname;
    
    // Determine language
    let lang = 'en';
    if (domain.includes('nl.')) lang = 'nl';
    if (domain.includes('de.')) lang = 'de';
    if (domain.includes('es.')) lang = 'es';
    
    // Clean up path
    let newPath = path;
    
    // Episode redirects
    if (path.includes('/podcast/')) {
      const slug = path.replace('/podcast/', '').replace(/\/$/, '');
      newPath = `/${lang}/episodes/${slug}/`;
    }
    // Guest redirects
    else if (path.includes('/guest/') || path.includes('/gast/') || path.includes('/invitado/')) {
      const slug = path.split('/').filter(p => p).pop();
      newPath = `/guests/${slug}/`;
    }
    // Home redirects
    else if (path === '/' || path === '') {
      newPath = lang === 'en' ? '/' : `/${lang}/`;
    }
    
    return {
      from: oldUrl,
      to: `https://cro.cafe${newPath}`,
      fromPath: path,
      toPath: newPath
    };
  } catch (error) {
    return null;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(chalk.red('Please provide a CSV file path'));
    console.log('Usage: node scripts/check-gsc-export.js path/to/gsc-export.csv');
    process.exit(1);
  }
  
  const csvPath = args[0];
  
  console.log(chalk.blue('🔍 Google Search Console URL Checker\n'));
  console.log(chalk.yellow(`Reading CSV file: ${csvPath}`));
  
  try {
    // Read CSV file
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(chalk.blue(`Found ${records.length} URLs to check\n`));
    
    // Results
    const results = {
      working: [],
      redirected: [],
      broken: [],
      errors: []
    };
    
    // Check each URL
    let checked = 0;
    for (const record of records) {
      // Get URL from first column (might be 'Top pages', 'Page', 'URL', etc.)
      const url = record[Object.keys(record)[0]];
      
      if (!url || !url.startsWith('http')) continue;
      
      // Only check old domain URLs
      const oldDomains = ['cro.cafe', 'nl.cro.cafe', 'de.cro.cafe', 'es.cro.cafe'];
      const isOldDomain = oldDomains.some(domain => url.includes(domain));
      
      if (!isOldDomain) continue;
      
      checked++;
      process.stdout.write(chalk.gray(`Checking ${checked}/${records.length}...\r`));
      
      const result = await checkUrl(url);
      
      // Get metrics from CSV
      result.clicks = parseInt(record['Clicks'] || record['clicks'] || 0);
      result.impressions = parseInt(record['Impressions'] || record['impressions'] || 0);
      
      if (result.success) {
        if (result.redirected) {
          results.redirected.push(result);
        } else {
          results.working.push(result);
        }
      } else if (result.status === 'error') {
        results.errors.push(result);
      } else {
        results.broken.push(result);
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(chalk.blue('\n\n📊 Summary:'));
    console.log(chalk.green(`✓ Working: ${results.working.length}`));
    console.log(chalk.yellow(`→ Redirected: ${results.redirected.length}`));
    console.log(chalk.red(`✗ Broken (404/etc): ${results.broken.length}`));
    console.log(chalk.red(`⚠ Errors: ${results.errors.length}`));
    
    // Show broken URLs sorted by importance (impressions)
    if (results.broken.length > 0) {
      console.log(chalk.red('\n\n❌ Broken URLs (sorted by impressions):\n'));
      
      const sortedBroken = results.broken
        .sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
      
      const topBroken = sortedBroken.slice(0, 20);
      
      topBroken.forEach(({ url, status, impressions, clicks }) => {
        console.log(chalk.red(`${url}`));
        console.log(chalk.gray(`  Status: ${status}, Impressions: ${impressions}, Clicks: ${clicks}`));
        
        const redirect = generateRedirect(url);
        if (redirect) {
          console.log(chalk.green(`  Suggested: ${redirect.to}`));
        }
        console.log();
      });
      
      // Generate Netlify redirects
      console.log(chalk.yellow('\n📝 Generated Netlify Redirects:\n'));
      
      const redirects = sortedBroken
        .map(({ url }) => generateRedirect(url))
        .filter(r => r !== null);
      
      // Group by subdomain
      const byDomain = {};
      redirects.forEach(redirect => {
        const domain = new URL(redirect.from).hostname;
        if (!byDomain[domain]) byDomain[domain] = [];
        byDomain[domain].push(redirect);
      });
      
      // Generate TOML
      let tomlContent = `# ============================================================================
# BROKEN URLs FROM GOOGLE SEARCH CONSOLE
# ============================================================================
# Generated: ${new Date().toISOString()}
# Total broken URLs: ${results.broken.length}

`;
      
      Object.entries(byDomain).forEach(([domain, domainRedirects]) => {
        tomlContent += `# ${domain.toUpperCase()} Redirects\n`;
        
        domainRedirects.forEach(({ from, fromPath, toPath }) => {
          tomlContent += `[[redirects]]\n`;
          tomlContent += `  from = "${from}"\n`;
          tomlContent += `  to = "https://cro.cafe${toPath}"\n`;
          tomlContent += `  status = 301\n`;
          tomlContent += `  force = true\n\n`;
        });
      });
      
      const redirectFile = `gsc-broken-urls-redirects-${new Date().toISOString().split('T')[0]}.toml`;
      await fs.writeFile(redirectFile, tomlContent);
      console.log(chalk.green(`\n✅ Redirect rules saved to: ${redirectFile}`));
    }
    
    // Save full report
    const reportPath = `gsc-url-report-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(reportPath, JSON.stringify({
      date: new Date().toISOString(),
      csvFile: csvPath,
      summary: {
        total: checked,
        working: results.working.length,
        redirected: results.redirected.length,
        broken: results.broken.length,
        errors: results.errors.length
      },
      results
    }, null, 2));
    
    console.log(chalk.blue(`\n📄 Full report saved to: ${reportPath}`));
    
  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));
    process.exit(1);
  }
}

// Run
main().catch(console.error);