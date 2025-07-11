#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getAllFiles(dir, pattern) {
  const results = [];
  
  async function walk(currentDir) {
    try {
      const files = await fs.readdir(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await walk(filePath);
        } else if (file.endsWith(pattern)) {
          results.push(filePath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error.message);
    }
  }
  
  await walk(dir);
  return results;
}

async function checkDetailedReferences() {
  const episodesDir = path.join(__dirname, 'src/content/episodes');
  const guestsDir = path.join(__dirname, 'src/content/guests');
  const hostsDir = path.join(__dirname, 'src/content/hosts');
  
  console.log('Checking directories:');
  console.log(`Episodes: ${episodesDir}`);
  console.log(`Guests: ${guestsDir}`);
  console.log(`Hosts: ${hostsDir}\n`);
  
  // Get all episode files
  const episodeFiles = await getAllFiles(episodesDir, '.mdx');
  console.log(`Found ${episodeFiles.length} episode files\n`);
  
  // Get all existing guest files with detailed info
  let guestFiles = [];
  try {
    guestFiles = await fs.readdir(guestsDir);
  } catch (error) {
    console.error('Error reading guests directory:', error.message);
  }
  
  const existingGuests = new Map(); // lowercase -> actual filename
  for (const file of guestFiles) {
    if (file.endsWith('.mdx')) {
      const name = file.replace('.mdx', '');
      existingGuests.set(name.toLowerCase(), name);
    }
  }
  
  // Get all existing host files with detailed info
  let hostFiles = [];
  try {
    hostFiles = await fs.readdir(hostsDir);
  } catch (error) {
    console.error('Error reading hosts directory:', error.message);
  }
  
  const existingHosts = new Map(); // lowercase -> actual filename
  for (const file of hostFiles) {
    if (file.endsWith('.mdx')) {
      const name = file.replace('.mdx', '');
      existingHosts.set(name.toLowerCase(), name);
    }
  }
  
  console.log(`Found ${existingGuests.size} guest files`);
  console.log(`Found ${existingHosts.size} host files\n`);
  
  // Show some sample guests and hosts
  console.log('Sample guests:', Array.from(existingGuests.values()).slice(0, 5).join(', '));
  console.log('Sample hosts:', Array.from(existingHosts.values()).join(', '));
  console.log('\n');
  
  const issues = [];
  const allReferencedGuests = new Set();
  const allReferencedHosts = new Set();
  
  // Check each episode
  for (const episodePath of episodeFiles) {
    try {
      const content = await fs.readFile(episodePath, 'utf-8');
      const { data: frontmatter } = matter(content);
      
      const episodeInfo = {
        path: episodePath,
        title: frontmatter.title || 'Unknown',
        issues: []
      };
      
      // Check guests
      if (frontmatter.guests && Array.isArray(frontmatter.guests)) {
        for (const guest of frontmatter.guests) {
          allReferencedGuests.add(guest);
          
          // Check exact match
          if (!existingGuests.has(guest.toLowerCase())) {
            episodeInfo.issues.push({
              type: 'missing_guest',
              value: guest,
              message: `Guest "${guest}" not found`
            });
          } else {
            // Check case sensitivity
            const actualName = existingGuests.get(guest.toLowerCase());
            if (actualName !== guest) {
              episodeInfo.issues.push({
                type: 'case_mismatch_guest',
                value: guest,
                actual: actualName,
                message: `Guest case mismatch: "${guest}" should be "${actualName}"`
              });
            }
          }
        }
      } else if (frontmatter.guests === null || frontmatter.guests === undefined) {
        episodeInfo.issues.push({
          type: 'no_guests',
          message: 'No guests field defined'
        });
      }
      
      // Check hosts
      if (frontmatter.hosts && Array.isArray(frontmatter.hosts)) {
        for (const host of frontmatter.hosts) {
          allReferencedHosts.add(host);
          
          // Check exact match
          if (!existingHosts.has(host.toLowerCase())) {
            episodeInfo.issues.push({
              type: 'missing_host',
              value: host,
              message: `Host "${host}" not found`
            });
          } else {
            // Check case sensitivity
            const actualName = existingHosts.get(host.toLowerCase());
            if (actualName !== host) {
              episodeInfo.issues.push({
                type: 'case_mismatch_host',
                value: host,
                actual: actualName,
                message: `Host case mismatch: "${host}" should be "${actualName}"`
              });
            }
          }
        }
      } else if (frontmatter.hosts === null || frontmatter.hosts === undefined) {
        episodeInfo.issues.push({
          type: 'no_hosts',
          message: 'No hosts field defined'
        });
      }
      
      if (episodeInfo.issues.length > 0) {
        issues.push(episodeInfo);
      }
      
    } catch (error) {
      console.error(`Error processing ${episodePath}:`, error.message);
      issues.push({
        path: episodePath,
        title: 'Error reading file',
        issues: [{
          type: 'error',
          message: error.message
        }]
      });
    }
  }
  
  // Generate report
  console.log('=== DETAILED REFERENCE CHECK REPORT ===\n');
  
  console.log(`Total issues found: ${issues.length}\n`);
  
  if (issues.length === 0) {
    console.log('No issues found! All references are valid.\n');
  } else {
    // Group issues by type
    const issuesByType = {};
    for (const episode of issues) {
      for (const issue of episode.issues) {
        if (!issuesByType[issue.type]) {
          issuesByType[issue.type] = [];
        }
        issuesByType[issue.type].push({
          episode: episode.path,
          title: episode.title,
          ...issue
        });
      }
    }
    
    console.log('ISSUES BY TYPE:\n');
    for (const [type, typeIssues] of Object.entries(issuesByType)) {
      console.log(`${type.toUpperCase()} (${typeIssues.length} issues):`);
      typeIssues.slice(0, 5).forEach(issue => {
        console.log(`  - ${path.basename(issue.episode)}: ${issue.message}`);
      });
      if (typeIssues.length > 5) {
        console.log(`  ... and ${typeIssues.length - 5} more\n`);
      }
      console.log('');
    }
  }
  
  // Show all referenced guests and hosts
  console.log('\nALL REFERENCED GUESTS:', allReferencedGuests.size);
  console.log('ALL REFERENCED HOSTS:', allReferencedHosts.size);
  
  // Check for unused guest/host files
  console.log('\nUNUSED FILES CHECK:');
  
  const unusedGuests = [];
  for (const [lowercase, actual] of existingGuests.entries()) {
    if (!allReferencedGuests.has(actual)) {
      unusedGuests.push(actual);
    }
  }
  
  const unusedHosts = [];
  for (const [lowercase, actual] of existingHosts.entries()) {
    if (!allReferencedHosts.has(actual)) {
      unusedHosts.push(actual);
    }
  }
  
  if (unusedGuests.length > 0) {
    console.log(`\nUnused guest files (${unusedGuests.length}):`);
    unusedGuests.forEach(guest => console.log(`  - ${guest}.mdx`));
  }
  
  if (unusedHosts.length > 0) {
    console.log(`\nUnused host files (${unusedHosts.length}):`);
    unusedHosts.forEach(host => console.log(`  - ${host}.mdx`));
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalEpisodes: episodeFiles.length,
      totalIssues: issues.length,
      totalGuests: existingGuests.size,
      totalHosts: existingHosts.size,
      referencedGuests: allReferencedGuests.size,
      referencedHosts: allReferencedHosts.size,
      unusedGuests: unusedGuests.length,
      unusedHosts: unusedHosts.length
    },
    issuesByType: issuesByType || {},
    episodesWithIssues: issues,
    unusedGuests,
    unusedHosts
  };
  
  await fs.writeFile(
    path.join(__dirname, 'detailed-reference-report.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('\n\nDetailed report saved to: detailed-reference-report.json');
  
  // Test specific episodes
  console.log('\n\nTEST SPECIFIC EPISODES:');
  const testEpisodes = [
    'episode-026-wie-ki-die-zukunft-des-marketings-verandert-mit-niklas-lewanczik.mdx',
    'episode-047-47-user-research-cro-bei-tui-michael-richter-uber-moderiertes-testing-und-innovation.mdx'
  ];
  
  for (const testEp of testEpisodes) {
    const found = episodeFiles.find(ep => ep.includes(testEp));
    if (found) {
      console.log(`\nChecking ${testEp}:`);
      try {
        const content = await fs.readFile(found, 'utf-8');
        const { data: frontmatter } = matter(content);
        console.log(`  Guests: ${JSON.stringify(frontmatter.guests)}`);
        console.log(`  Hosts: ${JSON.stringify(frontmatter.hosts)}`);
        
        if (frontmatter.guests) {
          for (const guest of frontmatter.guests) {
            const exists = await fs.access(path.join(guestsDir, `${guest}.mdx`))
              .then(() => true)
              .catch(() => false);
            console.log(`  Guest "${guest}" exists: ${exists}`);
          }
        }
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }
  }
}

// Run the check
checkDetailedReferences().catch(console.error);