import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { optimizeEpisodeTitle, optimizeEpisodeDescription, generateMetaDescription } from '../src/utils/seo-optimization';
import type { Language } from '../src/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const episodesPath = path.join(__dirname, '..', 'src', 'content', 'episodes');

interface EpisodeData {
  title: string;
  description: string;
  summary?: string;
  seoTitle?: string;
  metaDescription?: string;
  language: Language;
  guests?: string[];
  [key: string]: any;
}

async function optimizeEpisodeSEO() {
  console.log('Starting SEO optimization for episodes...\n');
  
  const languages: Language[] = ['en', 'nl', 'de', 'es'];
  let totalOptimized = 0;
  let totalSkipped = 0;
  
  for (const lang of languages) {
    console.log(`\nProcessing ${lang.toUpperCase()} episodes...`);
    const langPath = path.join(episodesPath, lang);
    
    if (!fs.existsSync(langPath)) {
      console.log(`No episodes found for ${lang}`);
      continue;
    }
    
    // Process all season directories
    const seasons = fs.readdirSync(langPath).filter(item => 
      fs.statSync(path.join(langPath, item)).isDirectory()
    );
    
    for (const season of seasons) {
      const seasonPath = path.join(langPath, season);
      const files = fs.readdirSync(seasonPath).filter(file => 
        file.endsWith('.mdx')
      );
      
      console.log(`  Processing ${season} (${files.length} episodes)...`);
      
      for (const file of files) {
        const filePath = path.join(seasonPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data, content: markdown } = matter(content);
        const episodeData = data as EpisodeData;
        
        // Skip if already has SEO fields
        if (episodeData.seoTitle && episodeData.metaDescription) {
          totalSkipped++;
          continue;
        }
        
        // Create mock episode object for optimization functions
        const mockEpisode = {
          data: {
            ...episodeData,
            language: lang
          }
        } as any;
        
        // Get guest names if available
        const guestNames = episodeData.guests || [];
        
        // Generate optimized SEO fields
        const seoTitle = optimizeEpisodeTitle(mockEpisode, guestNames);
        const metaDescription = generateMetaDescription(mockEpisode, guestNames);
        
        // Only update if changes are meaningful
        if (seoTitle !== episodeData.title || !episodeData.metaDescription) {
          // Update frontmatter
          episodeData.seoTitle = seoTitle;
          episodeData.metaDescription = metaDescription;
          
          // Write back to file
          const updatedContent = matter.stringify(markdown, episodeData);
          fs.writeFileSync(filePath, updatedContent);
          
          console.log(`    ✓ ${file}`);
          console.log(`      Original: "${episodeData.title}"`);
          console.log(`      SEO Title: "${seoTitle}"`);
          console.log(`      Meta Desc: "${metaDescription.substring(0, 60)}..."`);
          
          totalOptimized++;
        } else {
          totalSkipped++;
        }
      }
    }
  }
  
  console.log(`\n✅ SEO Optimization Complete!`);
  console.log(`   - Optimized: ${totalOptimized} episodes`);
  console.log(`   - Skipped: ${totalSkipped} episodes (already optimized)`);
}

// Add gray-matter package check
try {
  require.resolve('gray-matter');
} catch (e) {
  console.error('❌ Missing dependency: gray-matter');
  console.error('Please run: npm install --save-dev gray-matter');
  process.exit(1);
}

// Run the optimization
optimizeEpisodeSEO().catch(console.error);