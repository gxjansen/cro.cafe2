// Check transistor ID mismatch
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Guido's episode IDs
const guidoFile = path.join(__dirname, 'src/content/hosts/gxjansen.mdx');
const guidoContent = fs.readFileSync(guidoFile, 'utf-8');
const guidoMatch = guidoContent.match(/episodes:\s*\[(.*?)\]/s);

const guidoIds = [];
if (guidoMatch) {
  const ids = guidoMatch[1].match(/"(\d+)"/g).map(id => id.replace(/"/g, ''));
  guidoIds.push(...ids);
  console.log('Guido episode IDs (first 5):', ids.slice(0, 5));
}

// Get actual episode transistor IDs from NL episodes
const nlEpisodesDir = path.join(__dirname, 'src/content/episodes/nl');
const transistorIds = [];

const seasons = fs.readdirSync(nlEpisodesDir).filter(f => f.startsWith('season-'));
seasons.forEach(season => {
  const seasonDir = path.join(nlEpisodesDir, season);
  const files = fs.readdirSync(seasonDir).filter(f => f.endsWith('.mdx'));
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(seasonDir, file), 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (match) {
      const frontmatter = match[1];
      const transistorMatch = frontmatter.match(/transistorId:\s*(.+)/);
      if (transistorMatch) {
        transistorIds.push(transistorMatch[1].trim());
      }
    }
  });
});

console.log('\nActual NL episode transistor IDs (first 5):', transistorIds.slice(0, 5));

// Check EN episodes
console.log('\nChecking EN episodes...');
const enEpisodesDir = path.join(__dirname, 'src/content/episodes/en');
const enTransistorIds = [];

if (fs.existsSync(enEpisodesDir)) {
  const enSeasons = fs.readdirSync(enEpisodesDir).filter(f => f.startsWith('season-'));
  enSeasons.forEach(season => {
    const seasonDir = path.join(enEpisodesDir, season);
    const files = fs.readdirSync(seasonDir).filter(f => f.endsWith('.mdx'));
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(seasonDir, file), 'utf-8');
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      
      if (match) {
        const frontmatter = match[1];
        const transistorMatch = frontmatter.match(/transistorId:\s*(.+)/);
        if (transistorMatch) {
          enTransistorIds.push(transistorMatch[1].trim());
        }
      }
    });
  });
}

console.log('EN episode transistor IDs (first 5):', enTransistorIds.slice(0, 5));

// Check if Guido's IDs match EN episodes
let enMatchCount = 0;
guidoIds.forEach(id => {
  if (enTransistorIds.includes(id)) {
    enMatchCount++;
  }
});

console.log(`\n${enMatchCount} of Guido's episodes match EN episodes`);

// Show pattern difference
console.log('\nID Pattern comparison:');
console.log('Guido IDs:', guidoIds[0], guidoIds[1]);
console.log('NL IDs:', transistorIds[0], transistorIds[1]);
console.log('EN IDs:', enTransistorIds[0], enTransistorIds[1]);