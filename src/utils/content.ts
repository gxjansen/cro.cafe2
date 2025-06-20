import { getCollection } from 'astro:content';
import type { Language } from '../types';

// Get episodes by language
export async function getEpisodesByLanguage(language: Language) {
  const episodes = await getCollection('episodes');
  return episodes
    .filter(episode => episode.data.language === language && episode.data.status === 'published')
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

// Get featured episodes across all languages
export async function getFeaturedEpisodes(limit = 4) {
  const episodes = await getCollection('episodes');
  return episodes
    .filter(episode => episode.data.featured && episode.data.status === 'published')
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, limit);
}

// Get guests by language
export async function getGuestsByLanguage(language: Language) {
  const guests = await getCollection('guests');
  return guests
    .filter(guest => 
      guest.data.languages.includes(language) && 
      guest.data.episodes && 
      guest.data.episodes.length > 0
    )
    .sort((a, b) => a.data.name.localeCompare(b.data.name));
}

// Get featured quotes by language
export async function getFeaturedQuotes(language: Language, limit = 3) {
  const quotes = await getCollection('quotes');
  return quotes
    .filter(quote => quote.data.language === language && quote.data.featured)
    .sort((a, b) => (a.data.order || 999) - (b.data.order || 999))
    .slice(0, limit);
}

// Get featured brands
export async function getFeaturedBrands(limit = 8) {
  const brands = await getCollection('brands');
  return brands
    .filter(brand => brand.data.featured)
    .sort((a, b) => (a.data.order || 999) - (b.data.order || 999))
    .slice(0, limit);
}

// Check if a URL is valid (not example.com or empty)
function isValidPlatformUrl(url: string): boolean {
  if (!url) return false;
  if (url.includes('example.com')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Get platforms by category
export async function getPlatformsByCategory(category: 'podcast' | 'music' | 'general' = 'podcast') {
  const platforms = await getCollection('platforms');
  return platforms
    .filter(platform => platform.data.category === category)
    .sort((a, b) => (a.data.order || 999) - (b.data.order || 999));
}

// Get platforms by category filtered by language with valid URLs
export async function getPlatformsByCategoryAndLanguage(
  category: 'podcast' | 'music' | 'general' = 'podcast', 
  language: Language
) {
  const platforms = await getCollection('platforms');
  return platforms
    .filter(platform => {
      // Filter by category (default to 'podcast' if no category set)
      const platformCategory = platform.data.category || 'podcast';
      if (platformCategory !== category) return false;
      
      // Check if platform has a valid URL for this language
      const languageUrl = platform.data.urls[language];
      return isValidPlatformUrl(languageUrl);
    })
    .sort((a, b) => (a.data.displayOrder || a.data.order || 999) - (b.data.displayOrder || b.data.order || 999));
}

// Get platforms by media type (audio vs video) filtered by language with valid URLs
export async function getPlatformsByMediaTypeAndLanguage(
  mediaType: 'audio' | 'video',
  language: Language
) {
  const platforms = await getCollection('platforms');
  return platforms
    .filter(platform => {
      // Check if platform has a valid URL for this language
      const languageUrl = platform.data.urls[language];
      if (!isValidPlatformUrl(languageUrl)) return false;
      
      // Determine media type based on platform name/slug
      const platformName = platform.data.name.toLowerCase();
      const platformSlug = platform.data.slug.toLowerCase();
      
      if (mediaType === 'video') {
        // Only YouTube is considered a video platform
        return platformName.includes('youtube') || platformSlug.includes('youtube');
      } else {
        // All other platforms are audio platforms
        return !platformName.includes('youtube') && !platformSlug.includes('youtube');
      }
    })
    .sort((a, b) => (a.data.displayOrder || a.data.order || 999) - (b.data.displayOrder || b.data.order || 999));
}

// Get all valid platforms for a specific language (regardless of category)
export async function getValidPlatformsForLanguage(language: Language) {
  const platforms = await getCollection('platforms');
  return platforms
    .filter(platform => {
      const languageUrl = platform.data.urls[language];
      return isValidPlatformUrl(languageUrl);
    })
    .sort((a, b) => (a.data.displayOrder || a.data.order || 999) - (b.data.displayOrder || b.data.order || 999));
}

// Get episode by slug and language
export async function getEpisodeBySlug(slug: string, language: Language) {
  const episodes = await getCollection('episodes');
  return episodes.find(episode => 
    (episode.data.slug === slug || episode.slug === slug) && 
    episode.data.language === language && 
    episode.data.status === 'published'
  );
}

// Get guest by slug
export async function getGuestBySlug(slug: string) {
  const guests = await getCollection('guests');
  return guests.find(guest => (guest.data.slug || guest.slug) === slug);
}

// Get related episodes for a guest
export async function getGuestEpisodes(guestSlug: string, language: Language) {
  const episodes = await getCollection('episodes');
  return episodes
    .filter(episode => 
      episode.data.language === language && 
      episode.data.guests.includes(guestSlug) &&
      episode.data.status === 'published'
    )
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

// Format episode duration for display
export function formatDuration(duration: string): string {
  // Duration is in seconds, convert to minutes
  const totalSeconds = parseInt(duration, 10);
  
  // Check if duration is valid
  if (isNaN(totalSeconds) || totalSeconds <= 0) {
    return '';
  }
  
  // Convert seconds to minutes and round to nearest integer
  const totalMinutes = Math.round(totalSeconds / 60);
  
  // If over 60 minutes, show as hours and minutes
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes} min`;
  }
  
  return `${totalMinutes} min`;
}

// Generate episode URL
export function getEpisodeUrl(episode: { data: { language: Language; slug?: string }; slug?: string }): string {
  const { language } = episode.data;
  const slug = episode.data.slug || episode.slug;
  return `/${language}/episodes/${slug}/`;
}

// Generate guest URL
export function getGuestUrl(guest: { data: { slug?: string }; slug?: string }, language: Language): string {
  const slug = guest.data.slug || guest.slug;
  return `/${language}/guests/${slug}/`;
}

// Get latest episodes across all languages for homepage
export async function getLatestEpisodesByLanguage() {
  const episodes = await getCollection('episodes');
  const languages: Language[] = ['en', 'nl', 'de', 'es'];
  
  const result: Record<Language, any[]> = {
    en: [],
    nl: [],
    de: [],
    es: []
  };
  
  for (const language of languages) {
    result[language] = episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published')
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
      .slice(0, 3);
  }
  
  return result;
}

// Get latest episode from each language for homepage
export async function getLatestEpisodeFromEachLanguage() {
  const episodes = await getCollection('episodes');
  const languages: Language[] = ['en', 'nl', 'de', 'es'];
  
  const result: any[] = [];
  
  for (const language of languages) {
    const latestEpisode = episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published')
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())[0];
    
    if (latestEpisode) {
      result.push(latestEpisode);
    }
  }
  
  return result;
}

// Get episode count by language
export async function getEpisodeCountByLanguage(language: Language): Promise<number> {
  const episodes = await getCollection('episodes');
  return episodes.filter(episode => episode.data.language === language && episode.data.status === 'published').length;
}

// Get total episode count across all languages
export async function getTotalEpisodeCount(): Promise<number> {
  const episodes = await getCollection('episodes');
  return episodes.filter(episode => episode.data.status === 'published').length;
}

// Get guest count by language
export async function getGuestCountByLanguage(language: Language): Promise<number> {
  const guests = await getCollection('guests');
  return guests.filter(guest => guest.data.languages.includes(language)).length;
}

// Get total guest count
export async function getTotalGuestCount(): Promise<number> {
  const guests = await getCollection('guests');
  return guests.length;
}

// Get counts for all languages including global
export async function getLanguageCounts() {
  const languages: Language[] = ['en', 'nl', 'de', 'es'];
  const counts: Record<Language | 'global', { episodes: number; guests: number }> = {
    global: { episodes: 0, guests: 0 },
    en: { episodes: 0, guests: 0 },
    nl: { episodes: 0, guests: 0 },
    de: { episodes: 0, guests: 0 },
    es: { episodes: 0, guests: 0 }
  };

  // Get all episodes and guests
  const [episodes, guests] = await Promise.all([
    getCollection('episodes'),
    getCollection('guests')
  ]);

  // Count episodes by language (only published)
  for (const episode of episodes) {
    if (episode.data.status === 'published') {
      counts[episode.data.language].episodes++;
      counts.global.episodes++;
    }
  }

  // Count guests - avoiding duplicates for global count
  const uniqueGuestSlugs = new Set<string>();
  for (const guest of guests) {
    uniqueGuestSlugs.add(guest.data.slug || guest.slug);
    for (const lang of guest.data.languages) {
      counts[lang].guests++;
    }
  }
  counts.global.guests = uniqueGuestSlugs.size;

  return counts;
}

// Get all hosts
export async function getAllHosts() {
  const hosts = await getCollection('hosts');
  return hosts.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

// Get hosts by language based on their episodes
export async function getHostsByLanguage(language: Language) {
  const [hosts, episodes] = await Promise.all([
    getCollection('hosts'),
    getCollection('episodes')
  ]);
  
  // Get episode IDs for this language (only published)
  const languageEpisodeIds = new Set(
    episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published')
      .map(ep => ep.data.transistorId)
  );
  
  // Filter hosts who have episodes in this language
  return hosts.filter(host => 
    host.data.episodes?.some(episodeId => languageEpisodeIds.has(episodeId))
  );
}

// Get host image URL
export function getHostImageUrl(hostSlug: string): string {
  // Map host slugs to actual image filenames
  const imageMap: Record<string, string> = {
    'gxjansen': 'guido.webp',
    'michaelwitzenleiter': 'michael.jpeg',
    'ricardotayar': 'ricardo.jpeg',
    'yvonneteufel': 'yvonne.jpeg'
  };
  
  const filename = imageMap[hostSlug];
  return filename ? `/images/hosts/${filename}` : '/images/default-host.jpg';
}

// Get guest image URL
export function getGuestImageUrl(guestSlug: string): string {
  // For guests, we check if the image exists in the guests folder
  // The image filename is typically the guest slug with common extensions
  const possibleExtensions = ['.jpeg', '.jpg', '.png', '.webp'];
  
  // In production, you might want to check if file exists
  // For now, we'll assume the image exists with .jpeg extension
  return `/images/guests/${guestSlug}.jpeg`;
}

// Get host by slug
export async function getHostBySlug(slug: string) {
  const hosts = await getCollection('hosts');
  return hosts.find(host => (host.data.slug || host.slug) === slug);
}

// Get languages that a host appears in
export async function getHostLanguages(hostSlug: string): Promise<Language[]> {
  const hostLanguageMap: Record<string, Language[]> = {
    'gxjansen': ['en', 'nl'],
    'michaelwitzenleiter': ['de'],
    'ricardotayar': ['es'],
    'yvonneteufel': ['de']
  };
  
  return hostLanguageMap[hostSlug] || [];
}

// Generate host URL
export function getHostUrl(hostSlug: string): string {
  return `/hosts/${hostSlug}/`;
}

// Get platform counts by language
export async function getPlatformCountsByLanguage() {
  const platforms = await getCollection('platforms');
  const languages: Language[] = ['en', 'nl', 'de', 'es'];
  
  const counts: Record<Language, number> = {
    en: 0,
    nl: 0,
    de: 0,
    es: 0
  };

  for (const language of languages) {
    counts[language] = platforms.filter(platform => {
      const languageUrl = platform.data.urls[language];
      return isValidPlatformUrl(languageUrl);
    }).length;
  }

  return counts;
}

// Get popular episodes from each language based on downloads
export async function getPopularEpisodeFromEachLanguage() {
  const episodes = await getCollection('episodes');
  const languages: Language[] = ['en', 'nl', 'de', 'es'];
  
  const result: any[] = [];
  
  for (const language of languages) {
    const popularEpisode = episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published' && ep.data.downloads_total)
      .sort((a, b) => (b.data.downloads_total || 0) - (a.data.downloads_total || 0))[0];
    
    if (popularEpisode) {
      result.push(popularEpisode);
    }
  }
  
  return result;
}

// Get popular episodes by language based on downloads
export async function getPopularEpisodesByLanguage() {
  const episodes = await getCollection('episodes');
  const languages: Language[] = ['en', 'nl', 'de', 'es'];
  
  const result: Record<Language, any[]> = {
    en: [],
    nl: [],
    de: [],
    es: []
  };
  
  for (const language of languages) {
    result[language] = episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published' && ep.data.downloads_total)
      .sort((a, b) => (b.data.downloads_total || 0) - (a.data.downloads_total || 0))
      .slice(0, 3);
  }
  
  return result;
}

// Get total content duration by language in hours
export async function getTotalDurationByLanguage(language: Language): Promise<number> {
  const episodes = await getEpisodesByLanguage(language);
  
  // Sum up all durations (in seconds)
  const totalSeconds = episodes.reduce((sum, episode) => {
    const duration = parseInt(episode.data.duration, 10);
    return sum + (isNaN(duration) ? 0 : duration);
  }, 0);
  
  // Convert to hours and round to 1 decimal place
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  
  return totalHours;
}

// Get related episodes based on shared guests or keywords
export async function getRelatedEpisodes(
  currentEpisode: any,
  language: Language,
  limit = 3
) {
  const episodes = await getEpisodesByLanguage(language);
  
  // Score episodes based on relevance
  const scoredEpisodes = episodes
    .filter(ep => ep.data.slug !== currentEpisode.data.slug && ep.slug !== currentEpisode.slug)
    .map(ep => {
      let score = 0;
      
      // Score based on shared guests (higher weight)
      const sharedGuests = ep.data.guests.filter(g => 
        currentEpisode.data.guests.includes(g)
      ).length;
      score += sharedGuests * 3;
      
      // Score based on shared keywords (lower weight)
      const sharedKeywords = ep.data.keywords?.filter(k => 
        currentEpisode.data.keywords?.includes(k)
      ).length || 0;
      score += sharedKeywords;
      
      // Small boost for recency
      const daysDiff = Math.abs(
        (new Date(ep.data.pubDate).getTime() - new Date(currentEpisode.data.pubDate).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      if (daysDiff < 30) score += 0.5;
      
      return { episode: ep, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.episode);
  
  return scoredEpisodes;
}

// Get other episodes featuring the same guest
export async function getGuestOtherEpisodes(
  guestSlug: string,
  currentEpisodeSlug: string,
  language: Language,
  limit = 5
) {
  const episodes = await getGuestEpisodes(guestSlug, language);
  return episodes
    .filter(ep => ep.data.slug !== currentEpisodeSlug && ep.slug !== currentEpisodeSlug)
    .slice(0, limit);
}

// Get guests from the same company
export async function getGuestsFromSameCompany(
  company: string,
  currentGuestSlug: string,
  limit = 4
) {
  if (!company) return [];
  
  const guests = await getCollection('guests');
  return guests
    .filter(guest => 
      guest.data.company === company && 
      (guest.data.slug || guest.slug) !== currentGuestSlug
    )
    .slice(0, limit);
}

// Get episodes by keyword/topic
export async function getEpisodesByKeyword(
  keyword: string,
  language: Language,
  limit?: number
) {
  const episodes = await getEpisodesByLanguage(language);
  const filtered = episodes.filter(ep => 
    ep.data.keywords?.includes(keyword)
  );
  
  return limit ? filtered.slice(0, limit) : filtered;
}

// Get all unique keywords for a language
export async function getAllKeywords(language: Language): Promise<string[]> {
  const episodes = await getEpisodesByLanguage(language);
  const keywordSet = new Set<string>();
  
  episodes.forEach(episode => {
    episode.data.keywords?.forEach(keyword => {
      keywordSet.add(keyword);
    });
  });
  
  return Array.from(keywordSet).sort();
}