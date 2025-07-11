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
  }
  
  await walk(dir);
  return results;
}

async function checkMissingReferences() {
  const episodesDir = path.join(__dirname, 'src/content/episodes');
  const guestsDir = path.join(__dirname, 'src/content/guests');
  const hostsDir = path.join(__dirname, 'src/content/hosts');
  
  // Get all episode files
  const episodeFiles = await getAllFiles(episodesDir, '.mdx');
  console.log(`Found ${episodeFiles.length} episode files\n`);
  
  // Get all existing guest files (without extension)
  const guestFiles = await fs.readdir(guestsDir);
  const existingGuests = new Set(
    guestFiles
      .filter(f => f.endsWith('.mdx'))
      .map(f => f.replace('.mdx', ''))
  );
  
  // Get all existing host files (without extension)
  const hostFiles = await fs.readdir(hostsDir);
  const existingHosts = new Set(
    hostFiles
      .filter(f => f.endsWith('.mdx'))
      .map(f => f.replace('.mdx', ''))
  );
  
  console.log(`Found ${existingGuests.size} guest files`);
  console.log(`Found ${existingHosts.size} host files\n`);
  
  const missingGuests = new Map(); // guest -> [episodes]
  const missingHosts = new Map(); // host -> [episodes]
  const episodesWithIssues = [];
  const statistics = {
    totalEpisodes: episodeFiles.length,
    episodesWithGuests: 0,
    episodesWithHosts: 0,
    episodesWithMissingGuests: 0,
    episodesWithMissingHosts: 0,
    languageBreakdown: {}
  };
  
  // Check each episode
  for (const episodePath of episodeFiles) {
    try {
      const content = await fs.readFile(episodePath, 'utf-8');
      const { data: frontmatter } = matter(content);
      
      // Extract language from path
      const pathParts = episodePath.split(path.sep);
      const langIndex = pathParts.indexOf('episodes') + 1;
      const language = pathParts[langIndex];
      
      statistics.languageBreakdown[language] = statistics.languageBreakdown[language] || {
        total: 0,
        withMissingGuests: 0,
        withMissingHosts: 0
      };
      statistics.languageBreakdown[language].total++;
      
      const episodeInfo = {
        path: episodePath,
        title: frontmatter.title || 'Unknown',
        language,
        season: pathParts[langIndex + 1],
        missingGuests: [],
        missingHosts: []
      };
      
      // Check guests
      if (frontmatter.guests && Array.isArray(frontmatter.guests)) {
        statistics.episodesWithGuests++;
        for (const guest of frontmatter.guests) {
          if (!existingGuests.has(guest)) {
            episodeInfo.missingGuests.push(guest);
            if (!missingGuests.has(guest)) {
              missingGuests.set(guest, []);
            }
            missingGuests.get(guest).push(episodeInfo);
          }
        }
      }
      
      // Check hosts
      if (frontmatter.hosts && Array.isArray(frontmatter.hosts)) {
        statistics.episodesWithHosts++;
        for (const host of frontmatter.hosts) {
          if (!existingHosts.has(host)) {
            episodeInfo.missingHosts.push(host);
            if (!missingHosts.has(host)) {
              missingHosts.set(host, []);
            }
            missingHosts.get(host).push(episodeInfo);
          }
        }
      }
      
      // Track episodes with issues
      if (episodeInfo.missingGuests.length > 0 || episodeInfo.missingHosts.length > 0) {
        episodesWithIssues.push(episodeInfo);
        if (episodeInfo.missingGuests.length > 0) {
          statistics.episodesWithMissingGuests++;
          statistics.languageBreakdown[language].withMissingGuests++;
        }
        if (episodeInfo.missingHosts.length > 0) {
          statistics.episodesWithMissingHosts++;
          statistics.languageBreakdown[language].withMissingHosts++;
        }
      }
      
    } catch (error) {
      console.error(`Error processing ${episodePath}:`, error.message);
    }
  }
  
  // Generate report
  console.log('=== MISSING REFERENCES REPORT ===\n');
  
  console.log('SUMMARY STATISTICS:');
  console.log(`- Total episodes: ${statistics.totalEpisodes}`);
  console.log(`- Episodes with guests: ${statistics.episodesWithGuests}`);
  console.log(`- Episodes with hosts: ${statistics.episodesWithHosts}`);
  console.log(`- Episodes with missing guests: ${statistics.episodesWithMissingGuests}`);
  console.log(`- Episodes with missing hosts: ${statistics.episodesWithMissingHosts}`);
  console.log(`- Total missing guest references: ${missingGuests.size}`);
  console.log(`- Total missing host references: ${missingHosts.size}\n`);
  
  console.log('LANGUAGE BREAKDOWN:');
  for (const [lang, stats] of Object.entries(statistics.languageBreakdown)) {
    console.log(`\n${lang.toUpperCase()}:`);
    console.log(`  - Total episodes: ${stats.total}`);
    console.log(`  - With missing guests: ${stats.withMissingGuests}`);
    console.log(`  - With missing hosts: ${stats.withMissingHosts}`);
  }
  
  console.log('\n\nMISSING GUESTS (sorted by frequency):');
  const sortedMissingGuests = Array.from(missingGuests.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  for (const [guest, episodes] of sortedMissingGuests) {
    console.log(`\n"${guest}" (missing in ${episodes.length} episodes):`);
    const byLanguage = {};
    episodes.forEach(ep => {
      byLanguage[ep.language] = (byLanguage[ep.language] || 0) + 1;
    });
    console.log(`  Languages: ${Object.entries(byLanguage).map(([lang, count]) => `${lang}(${count})`).join(', ')}`);
    
    // Show first few episodes
    episodes.slice(0, 3).forEach(ep => {
      console.log(`  - ${ep.language}/${ep.season}/${path.basename(ep.path)}`);
    });
    if (episodes.length > 3) {
      console.log(`  ... and ${episodes.length - 3} more`);
    }
  }
  
  console.log('\n\nMISSING HOSTS (sorted by frequency):');
  const sortedMissingHosts = Array.from(missingHosts.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  for (const [host, episodes] of sortedMissingHosts) {
    console.log(`\n"${host}" (missing in ${episodes.length} episodes):`);
    const byLanguage = {};
    episodes.forEach(ep => {
      byLanguage[ep.language] = (byLanguage[ep.language] || 0) + 1;
    });
    console.log(`  Languages: ${Object.entries(byLanguage).map(([lang, count]) => `${lang}(${count})`).join(', ')}`);
    
    // Show first few episodes
    episodes.slice(0, 3).forEach(ep => {
      console.log(`  - ${ep.language}/${ep.season}/${path.basename(ep.path)}`);
    });
    if (episodes.length > 3) {
      console.log(`  ... and ${episodes.length - 3} more`);
    }
  }
  
  console.log('\n\nAFFECTED EPISODES BY LANGUAGE:');
  for (const [lang, stats] of Object.entries(statistics.languageBreakdown)) {
    const langEpisodes = episodesWithIssues.filter(ep => ep.language === lang);
    if (langEpisodes.length > 0) {
      console.log(`\n${lang.toUpperCase()} (${langEpisodes.length} episodes with issues):`);
      langEpisodes.slice(0, 5).forEach(ep => {
        console.log(`  - ${path.basename(ep.path)}`);
        if (ep.missingGuests.length > 0) {
          console.log(`    Missing guests: ${ep.missingGuests.join(', ')}`);
        }
        if (ep.missingHosts.length > 0) {
          console.log(`    Missing hosts: ${ep.missingHosts.join(', ')}`);
        }
      });
      if (langEpisodes.length > 5) {
        console.log(`  ... and ${langEpisodes.length - 5} more`);
      }
    }
  }
  
  // Patterns analysis
  console.log('\n\nPATTERNS ANALYSIS:');
  
  // Check if certain guests are language-specific
  console.log('\nLanguage-specific patterns:');
  for (const [guest, episodes] of missingGuests.entries()) {
    const languages = new Set(episodes.map(ep => ep.language));
    if (languages.size === 1) {
      const lang = languages.values().next().value;
      console.log(`  - "${guest}" only appears in ${lang} episodes (${episodes.length} times)`);
    }
  }
  
  // Check for possible typos (similar names)
  console.log('\nPossible typos or variations:');
  const guestNames = Array.from(missingGuests.keys());
  for (let i = 0; i < guestNames.length; i++) {
    for (let j = i + 1; j < guestNames.length; j++) {
      const similarity = calculateSimilarity(guestNames[i], guestNames[j]);
      if (similarity > 0.8) {
        console.log(`  - "${guestNames[i]}" and "${guestNames[j]}" (similarity: ${(similarity * 100).toFixed(1)}%)`);
      }
    }
  }
  
  // Save detailed report to file
  const report = {
    timestamp: new Date().toISOString(),
    statistics,
    missingGuests: Object.fromEntries(
      Array.from(missingGuests.entries()).map(([guest, episodes]) => [
        guest,
        episodes.map(ep => ({
          path: ep.path.replace(__dirname, '.'),
          title: ep.title,
          language: ep.language
        }))
      ])
    ),
    missingHosts: Object.fromEntries(
      Array.from(missingHosts.entries()).map(([host, episodes]) => [
        host,
        episodes.map(ep => ({
          path: ep.path.replace(__dirname, '.'),
          title: ep.title,
          language: ep.language
        }))
      ])
    ),
    affectedEpisodes: episodesWithIssues.map(ep => ({
      path: ep.path.replace(__dirname, '.'),
      title: ep.title,
      language: ep.language,
      missingGuests: ep.missingGuests,
      missingHosts: ep.missingHosts
    }))
  };
  
  await fs.writeFile(
    path.join(__dirname, 'missing-references-report.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('\n\nDetailed report saved to: missing-references-report.json');
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Run the check
checkMissingReferences().catch(console.error);