import { getCollection } from 'astro:content';
import type { Language } from '../types';

// Get episodes by language
export async function getEpisodesByLanguage(language: Language) {
  const episodes = await getCollection('episodes');
  return episodes
    .filter(episode => episode.data.language === language)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

// Get featured episodes across all languages
export async function getFeaturedEpisodes(limit = 4) {
  const episodes = await getCollection('episodes');
  return episodes
    .filter(episode => episode.data.featured)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, limit);
}

// Get guests by language
export async function getGuestsByLanguage(language: Language) {
  const guests = await getCollection('guests');
  return guests
    .filter(guest => guest.data.languages.includes(language))
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

// Get platforms by category
export async function getPlatformsByCategory(category: 'podcast' | 'music' | 'general' = 'podcast') {
  const platforms = await getCollection('platforms');
  return platforms
    .filter(platform => platform.data.category === category)
    .sort((a, b) => (a.data.order || 999) - (b.data.order || 999));
}

// Get episode by slug and language
export async function getEpisodeBySlug(slug: string, language: Language) {
  const episodes = await getCollection('episodes');
  return episodes.find(episode => 
    episode.data.slug === slug && episode.data.language === language
  );
}

// Get guest by slug
export async function getGuestBySlug(slug: string) {
  const guests = await getCollection('guests');
  return guests.find(guest => guest.data.slug === slug);
}

// Get related episodes for a guest
export async function getGuestEpisodes(guestSlug: string, language: Language) {
  const episodes = await getCollection('episodes');
  return episodes
    .filter(episode => 
      episode.data.language === language && 
      episode.data.guests.includes(guestSlug)
    )
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

// Format episode duration for display
export function formatDuration(duration: string): string {
  // Convert "45:30" to "45 min 30 sec" or similar formatting
  const [minutes, seconds] = duration.split(':').map(Number);
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}m ${seconds}s`;
}

// Generate episode URL
export function getEpisodeUrl(episode: { data: { language: Language; slug: string } }): string {
  const { language, slug } = episode.data;
  return language === 'en' ? `/episodes/${slug}` : `/${language}/episodes/${slug}`;
}

// Generate guest URL
export function getGuestUrl(guest: { data: { slug: string } }, language: Language): string {
  return language === 'en' ? `/guests/${guest.data.slug}` : `/${language}/guests/${guest.data.slug}`;
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
      .filter(ep => ep.data.language === language)
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
      .slice(0, 3);
  }
  
  return result;
}