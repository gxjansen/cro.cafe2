// Simple test to verify statistics calculations work
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to parse duration string to seconds
function parseDurationToSeconds(duration) {
  if (!duration || typeof duration !== 'string') return 0;
  
  const parts = duration.split(':').map(p => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}

// Read all NL episodes
const nlEpisodesDir = path.join(__dirname, 'src/content/episodes/nl');
let nlEpisodes = [];
let totalDurationSeconds = 0;

// Read all season directories
const seasons = fs.readdirSync(nlEpisodesDir).filter(f => f.startsWith('season-'));
seasons.forEach(season => {
  const seasonDir = path.join(nlEpisodesDir, season);
  const files = fs.readdirSync(seasonDir).filter(f => f.endsWith('.mdx'));
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(seasonDir, file), 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (match) {
      const frontmatter = match[1];
      
      // Extract status
      const statusMatch = frontmatter.match(/status:\s*(.+)/);
      const status = statusMatch ? statusMatch[1].trim() : 'published';
      
      if (status === 'published') {
        // Extract duration
        const durationMatch = frontmatter.match(/duration:\s*(.+)/);
        if (durationMatch) {
          const duration = durationMatch[1].trim();
          const seconds = parseDurationToSeconds(duration);
          totalDurationSeconds += seconds;
        }
        
        // Extract transistor ID
        const transistorMatch = frontmatter.match(/transistorId:\s*(.+)/);
        if (transistorMatch) {
          nlEpisodes.push({
            file,
            transistorId: transistorMatch[1].trim(),
            duration: durationMatch ? durationMatch[1].trim() : '0:00'
          });
        }
      }
    }
  });
});

console.log(`Found ${nlEpisodes.length} published NL episodes`);
console.log(`Total duration: ${Math.round((totalDurationSeconds / 3600) * 10) / 10} hours`);

// Read guest files and count those with NL language
const guestsDir = path.join(__dirname, 'src/content/guests');
const guestFiles = fs.readdirSync(guestsDir).filter(f => f.endsWith('.mdx'));

let nlGuestCount = 0;
guestFiles.forEach(file => {
  const content = fs.readFileSync(path.join(guestsDir, file), 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (match) {
    const frontmatter = match[1];
    
    // Check if has languages array with 'nl'
    const languagesMatch = frontmatter.match(/languages:\s*\[(.*?)\]/);
    if (languagesMatch && languagesMatch[1].includes('"nl"')) {
      nlGuestCount++;
    }
  }
});

console.log(`Found ${nlGuestCount} guests with NL language`);

// Check Guido's episodes
const guidoFile = path.join(__dirname, 'src/content/hosts/gxjansen.mdx');
const guidoContent = fs.readFileSync(guidoFile, 'utf-8');
const guidoMatch = guidoContent.match(/episodes:\s*\[(.*?)\]/s);

if (guidoMatch) {
  const episodeIds = guidoMatch[1].match(/"(\d+)"/g).map(id => id.replace(/"/g, ''));
  console.log(`\nGuido has ${episodeIds.length} episode IDs`);
  
  // Count how many match NL episodes
  let matchCount = 0;
  episodeIds.forEach(id => {
    if (nlEpisodes.some(ep => ep.transistorId === id)) {
      matchCount++;
    }
  });
  
  console.log(`${matchCount} of Guido's episodes match NL episodes`);
}