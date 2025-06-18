import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { parseAllRSSFeeds, type ParsedEpisode, processEpisodes } from '../src/utils/rss-parser.js';
import type { Language } from '../src/types/index.js';

/**
 * Content generation configuration
 */
interface ContentConfig {
  episodesDir: string;
  guestsDir: string;
  overwriteExisting: boolean;
  generateGuests: boolean;
  validateFrontmatter: boolean;
}

/**
 * Default content configuration
 */
const DEFAULT_CONTENT_CONFIG: ContentConfig = {
  episodesDir: 'src/content/episodes',
  guestsDir: 'src/content/guests',
  overwriteExisting: false,
  generateGuests: true,
  validateFrontmatter: true,
};

/**
 * Guest profile data
 */
interface GuestProfile {
  name: string;
  bio: string;
  company?: string;
  title?: string;
  email?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  imageUrl?: string;
  episodes: string[];
  languages: Language[];
  slug: string;
  canonicalLanguage: Language;
}

/**
 * Content generation statistics
 */
interface GenerationStats {
  episodesCreated: number;
  episodesUpdated: number;
  episodesSkipped: number;
  guestsCreated: number;
  guestsUpdated: number;
  errors: string[];
}

/**
 * Ensure directory exists
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format date for frontmatter
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Escape YAML string values
 */
function escapeYamlString(str: string): string {
  if (!str) return '""';
  
  // If string contains special characters, wrap in quotes
  if (/[:\\n\\r\\t"'`|>{}[\]@&*!%#]/.test(str)) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  
  return str;
}

/**
 * Generate episode frontmatter
 */
function generateEpisodeFrontmatter(episode: ParsedEpisode): string {
  const frontmatter = [
    '---',
    `title: ${escapeYamlString(episode.title)}`,
    `description: ${escapeYamlString(episode.description)}`,
    `pubDate: ${formatDate(episode.pubDate)}`,
    `season: ${episode.season}`,
    `episode: ${episode.episode}`,
    `duration: "${episode.duration}"`,
    `audioUrl: "${episode.audioUrl}"`,
    `slug: "${episode.slug}"`,
    `language: "${episode.language}"`,
  ];
  
  if (episode.imageUrl) {
    frontmatter.push(`imageUrl: "${episode.imageUrl}"`);
  }
  
  if (episode.hosts.length > 0) {
    frontmatter.push(`hosts:`);
    for (const host of episode.hosts) {
      frontmatter.push(`  - "${host}"`);
    }
  }
  
  if (episode.guests.length > 0) {
    frontmatter.push(`guests:`);
    for (const guest of episode.guests) {
      frontmatter.push(`  - "${guest}"`);
    }
  }
  
  if (episode.keywords.length > 0) {
    frontmatter.push(`keywords:`);
    for (const keyword of episode.keywords) {
      frontmatter.push(`  - "${keyword}"`);
    }
  }
  
  frontmatter.push(`transistorId: "${episode.transistorId}"`);
  
  if (episode.shareUrl) {
    frontmatter.push(`shareUrl: "${episode.shareUrl}"`);
  }
  
  if (episode.embedHtml) {
    frontmatter.push(`embedHtml: ${escapeYamlString(episode.embedHtml)}`);
  }
  
  frontmatter.push(`featured: ${episode.featured}`);
  frontmatter.push(`episodeType: "${episode.episodeType}"`);
  
  if (episode.summary) {
    frontmatter.push(`summary: ${escapeYamlString(episode.summary)}`);
  }
  
  if (episode.transcript) {
    frontmatter.push(`transcript: ${escapeYamlString(episode.transcript)}`);
  }
  
  frontmatter.push('---');
  
  return frontmatter.join('\\n');
}

/**
 * Generate episode content body
 */
function generateEpisodeContent(episode: ParsedEpisode): string {
  const content = [];
  
  // Add episode summary if available
  if (episode.summary && episode.summary !== episode.description) {
    content.push(`## Episode Summary`);
    content.push('');
    content.push(episode.summary);
    content.push('');
  }
  
  // Add episode description
  content.push(`## About This Episode`);
  content.push('');
  content.push(episode.description);
  content.push('');
  
  // Add guest information if available
  if (episode.guests.length > 0) {
    content.push(`## Featured Guests`);
    content.push('');
    for (const guest of episode.guests) {
      content.push(`- **${guest}**`);
    }
    content.push('');
  }
  
  // Add keywords/topics
  if (episode.keywords.length > 0) {
    content.push(`## Topics Covered`);
    content.push('');
    const topics = episode.keywords.map(keyword => `#${keyword.replace(/\\s+/g, '')}`).join(' ');
    content.push(topics);
    content.push('');
  }
  
  // Add transcript placeholder
  if (episode.transcript) {
    content.push(`## Transcript`);
    content.push('');
    content.push(episode.transcript);
  } else {
    content.push(`## Transcript`);
    content.push('');
    content.push(`*Transcript will be available soon.*`);
  }
  
  return content.join('\\n');
}

/**
 * Generate complete episode MDX file content
 */
function generateEpisodeMDX(episode: ParsedEpisode): string {
  const frontmatter = generateEpisodeFrontmatter(episode);
  const content = generateEpisodeContent(episode);
  
  return `${frontmatter}\\n\\n${content}`;
}

/**
 * Generate guest slug from name
 */
function generateGuestSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate guest profile from episode appearances
 */
function generateGuestProfile(
  name: string, 
  episodes: ParsedEpisode[]
): GuestProfile {
  const guestEpisodes = episodes.filter(ep => ep.guests.includes(name));
  const languages = [...new Set(guestEpisodes.map(ep => ep.language))];
  const episodeSlugs = guestEpisodes.map(ep => ep.slug);
  
  return {
    name,
    bio: `Guest on CRO.CAFE podcast. Featured in ${guestEpisodes.length} episode${guestEpisodes.length > 1 ? 's' : ''}.`,
    episodes: episodeSlugs,
    languages,
    slug: generateGuestSlug(name),
    canonicalLanguage: languages[0] || 'en',
  };
}

/**
 * Generate guest frontmatter
 */
function generateGuestFrontmatter(guest: GuestProfile): string {
  const frontmatter = [
    '---',
    `name: ${escapeYamlString(guest.name)}`,
    `bio: ${escapeYamlString(guest.bio)}`,
  ];
  
  if (guest.company) {
    frontmatter.push(`company: ${escapeYamlString(guest.company)}`);
  }
  
  if (guest.title) {
    frontmatter.push(`title: ${escapeYamlString(guest.title)}`);
  }
  
  if (guest.email) {
    frontmatter.push(`email: "${guest.email}"`);
  }
  
  if (guest.website) {
    frontmatter.push(`website: "${guest.website}"`);
  }
  
  if (guest.twitter) {
    frontmatter.push(`twitter: "${guest.twitter}"`);
  }
  
  if (guest.linkedin) {
    frontmatter.push(`linkedin: "${guest.linkedin}"`);
  }
  
  if (guest.imageUrl) {
    frontmatter.push(`imageUrl: "${guest.imageUrl}"`);
  }
  
  if (guest.episodes.length > 0) {
    frontmatter.push(`episodes:`);
    for (const episodeSlug of guest.episodes) {
      frontmatter.push(`  - "${episodeSlug}"`);
    }
  }
  
  if (guest.languages.length > 0) {
    frontmatter.push(`languages:`);
    for (const language of guest.languages) {
      frontmatter.push(`  - "${language}"`);
    }
  }
  
  frontmatter.push(`slug: "${guest.slug}"`);
  frontmatter.push(`canonicalLanguage: "${guest.canonicalLanguage}"`);
  frontmatter.push('---');
  
  return frontmatter.join('\\n');
}

/**
 * Generate guest content body
 */
function generateGuestContent(guest: GuestProfile): string {
  const content = [];
  
  content.push(`# ${guest.name}`);
  content.push('');
  content.push(guest.bio);
  content.push('');
  
  if (guest.company || guest.title) {
    content.push(`## Professional Background`);
    content.push('');
    if (guest.title && guest.company) {
      content.push(`${guest.title} at ${guest.company}`);
    } else if (guest.title) {
      content.push(guest.title);
    } else if (guest.company) {
      content.push(guest.company);
    }
    content.push('');
  }
  
  content.push(`## Episode Appearances`);
  content.push('');
  content.push(`${guest.name} has appeared on ${guest.episodes.length} episode${guest.episodes.length > 1 ? 's' : ''} of CRO.CAFE:`);
  content.push('');
  
  for (const episodeSlug of guest.episodes) {
    content.push(`- [Episode: ${episodeSlug}](/episodes/${episodeSlug})`);
  }
  
  return content.join('\\n');
}

/**
 * Generate complete guest MDX file content
 */
function generateGuestMDX(guest: GuestProfile): string {
  const frontmatter = generateGuestFrontmatter(guest);
  const content = generateGuestContent(guest);
  
  return `${frontmatter}\\n\\n${content}`;
}

/**
 * Save episode file
 */
async function saveEpisodeFile(
  episode: ParsedEpisode,
  config: ContentConfig,
  overwrite: boolean = false
): Promise<'created' | 'updated' | 'skipped'> {
  const filename = `${episode.slug}.mdx`;
  const filePath = join(config.episodesDir, filename);
  
  // Check if file exists
  const exists = await fileExists(filePath);
  
  if (exists && !overwrite && !config.overwriteExisting) {
    return 'skipped';
  }
  
  // Ensure directory exists
  await ensureDirectory(dirname(filePath));
  
  // Generate and save content
  const content = generateEpisodeMDX(episode);
  await fs.writeFile(filePath, content, 'utf-8');
  
  return exists ? 'updated' : 'created';
}

/**
 * Save guest file
 */
async function saveGuestFile(
  guest: GuestProfile,
  config: ContentConfig,
  overwrite: boolean = false
): Promise<'created' | 'updated' | 'skipped'> {
  const filename = `${guest.slug}.mdx`;
  const filePath = join(config.guestsDir, filename);
  
  // Check if file exists
  const exists = await fileExists(filePath);
  
  if (exists && !overwrite && !config.overwriteExisting) {
    return 'skipped';
  }
  
  // Ensure directory exists
  await ensureDirectory(dirname(filePath));
  
  // Generate and save content
  const content = generateGuestMDX(guest);
  await fs.writeFile(filePath, content, 'utf-8');
  
  return exists ? 'updated' : 'created';
}

/**
 * Extract all unique guests from episodes
 */
function extractUniqueGuests(allEpisodes: Record<Language, ParsedEpisode[]>): GuestProfile[] {
  const guestMap = new Map<string, ParsedEpisode[]>();
  
  // Collect all episodes per guest
  for (const episodes of Object.values(allEpisodes)) {
    for (const episode of episodes) {
      for (const guestName of episode.guests) {
        if (!guestMap.has(guestName)) {
          guestMap.set(guestName, []);
        }
        guestMap.get(guestName)!.push(episode);
      }
    }
  }
  
  // Generate guest profiles
  const guests: GuestProfile[] = [];
  for (const [guestName, episodes] of guestMap.entries()) {
    guests.push(generateGuestProfile(guestName, episodes));
  }
  
  return guests.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generate content for all episodes and guests
 */
export async function generateAllContent(
  config: ContentConfig = DEFAULT_CONTENT_CONFIG
): Promise<GenerationStats> {
  console.log('Starting content generation...');
  
  const stats: GenerationStats = {
    episodesCreated: 0,
    episodesUpdated: 0,
    episodesSkipped: 0,
    guestsCreated: 0,
    guestsUpdated: 0,
    errors: [],
  };
  
  try {
    // Parse all RSS feeds
    console.log('Parsing RSS feeds...');
    const allEpisodes = await parseAllRSSFeeds();
    
    // Process and generate episode files
    console.log('Generating episode files...');
    for (const [language, episodes] of Object.entries(allEpisodes) as Array<[Language, ParsedEpisode[]]>) {
      console.log(`Processing ${episodes.length} episodes for ${language}...`);
      
      const processedEpisodes = processEpisodes(episodes);
      
      for (const episode of processedEpisodes) {
        try {
          const result = await saveEpisodeFile(episode, config);
          
          switch (result) {
            case 'created':
              stats.episodesCreated++;
              break;
            case 'updated':
              stats.episodesUpdated++;
              break;
            case 'skipped':
              stats.episodesSkipped++;
              break;
          }
          
        } catch (error) {
          const errorMessage = `Failed to save episode ${episode.slug}: ${(error as Error).message}`;
          console.error(errorMessage);
          stats.errors.push(errorMessage);
        }
      }
    }
    
    // Generate guest profiles if enabled
    if (config.generateGuests) {
      console.log('Generating guest profiles...');
      const guests = extractUniqueGuests(allEpisodes);
      
      console.log(`Processing ${guests.length} unique guests...`);
      
      for (const guest of guests) {
        try {
          const result = await saveGuestFile(guest, config);
          
          switch (result) {
            case 'created':
              stats.guestsCreated++;
              break;
            case 'updated':
              stats.guestsUpdated++;
              break;
          }
        } catch (error) {
          const errorMessage = `Failed to save guest ${guest.slug}: ${(error as Error).message}`;
          console.error(errorMessage);
          stats.errors.push(errorMessage);
        }
      }
    }
    
    console.log('Content generation completed!');
    return stats;
    
  } catch (error) {
    console.error('Content generation failed:', error);
    stats.errors.push(`Content generation failed: ${(error as Error).message}`);
    return stats;
  }
}

/**
 * Generate content report
 */
function generateReport(stats: GenerationStats): string {
  const report = [];
  
  report.push('# Content Generation Report');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push('');
  
  report.push('## Episodes');
  report.push(`- Created: ${stats.episodesCreated}`);
  report.push(`- Updated: ${stats.episodesUpdated}`);
  report.push(`- Skipped: ${stats.episodesSkipped}`);
  report.push(`- Total: ${stats.episodesCreated + stats.episodesUpdated + stats.episodesSkipped}`);
  report.push('');
  
  report.push('## Guests');
  report.push(`- Created: ${stats.guestsCreated}`);
  report.push(`- Updated: ${stats.guestsUpdated}`);
  report.push('');
  
  if (stats.errors.length > 0) {
    report.push('## Errors');
    for (const error of stats.errors) {
      report.push(`- ${error}`);
    }
    report.push('');
  }
  
  const totalOperations = stats.episodesCreated + stats.episodesUpdated + stats.guestsCreated + stats.guestsUpdated;
  report.push(`## Summary`);
  report.push(`- Total Operations: ${totalOperations}`);
  report.push(`- Errors: ${stats.errors.length}`);
  report.push(`- Success Rate: ${totalOperations > 0 ? (((totalOperations - stats.errors.length) / totalOperations) * 100).toFixed(1) : 0}%`);
  
  return report.join('\\n');
}

/**
 * CLI entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const customConfig: Partial<ContentConfig> = {};
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--overwrite':
        customConfig.overwriteExisting = true;
        break;
      case '--no-guests':
        customConfig.generateGuests = false;
        break;
      case '--episodes-dir':
        customConfig.episodesDir = args[++i];
        break;
      case '--guests-dir':
        customConfig.guestsDir = args[++i];
        break;
    }
  }
  
  const finalConfig = { ...DEFAULT_CONTENT_CONFIG, ...customConfig };
  
  generateAllContent(finalConfig)
    .then(async (stats) => {
      // Generate and save report
      const report = generateReport(stats);
      await fs.writeFile('content-generation-report.md', report);
      
      console.log('\\n📊 Content Generation Summary:');
      console.log(`📝 Episodes: ${stats.episodesCreated} created, ${stats.episodesUpdated} updated, ${stats.episodesSkipped} skipped`);
      console.log(`👥 Guests: ${stats.guestsCreated} created, ${stats.guestsUpdated} updated`);
      
      if (stats.errors.length > 0) {
        console.log(`❌ Errors: ${stats.errors.length}`);
      }
      
      console.log('\\n✅ Content generation completed successfully!');
      console.log('📄 Report saved to: content-generation-report.md');
      
      process.exit(stats.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Content generation failed:', error);
      process.exit(1);
    });
}