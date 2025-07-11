import { getCollection } from 'astro:content'
import type { Language } from '../types'
import {
  hasLinkedInData as hasLinkedInDataTypeGuard,
  type GuestWithLinkedIn,
  type LinkedInDataRaw,
  transformLinkedInData
} from '../types/linkedin'
// Import image inventory for build-time validated images
import imageInventory from '../data/guest-image-inventory.json'

// Get episodes by language
export async function getEpisodesByLanguage(language: Language) {
  const episodes = await getCollection('episodes')
  return episodes
    .filter(episode => episode.data.language === language && episode.data.status === 'published')
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
}

// Get featured episodes across all languages
export async function getFeaturedEpisodes(limit = 4) {
  const episodes = await getCollection('episodes')
  return episodes
    .filter(episode => episode.data.featured && episode.data.status === 'published')
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, limit)
}

// Get guests by language
export async function getGuestsByLanguage(language: Language) {
  const guests = await getCollection('guests')
  const episodes = await getCollection('episodes')

  // Filter guests who have at least one published episode in the specified language
  return guests
    .filter(guest => {
      // Check if guest is marked for this language
      if (!guest.data.languages.includes(language)) {
        return false
      }

      const guestSlug = guest.data.slug || guest.slug

      // Check if guest has any published episodes in this language
      const hasPublishedEpisodes = episodes.some(episode =>
        episode.data.language === language &&
        episode.data.status === 'published' &&
        episode.data.guests.includes(guestSlug)
      )

      // If no episodes found via guest array, check if guest has episode IDs
      if (!hasPublishedEpisodes && guest.data.episodes && guest.data.episodes.length > 0) {
        // Check if any of the guest's episode IDs correspond to published episodes in this language
        return episodes.some(episode =>
          episode.data.language === language &&
          episode.data.status === 'published' &&
          guest.data.episodes.includes(episode.data.transistorId)
        )
      }

      return hasPublishedEpisodes
    })
    .sort((a, b) => a.data.name.localeCompare(b.data.name))
}

// Get featured quotes by language
export async function getFeaturedQuotes(language: Language, limit = 3) {
  const quotes = await getCollection('quotes')
  return quotes
    .filter(quote => quote.data.language === language && quote.data.featured)
    .sort((a, b) => (a.data.order || 999) - (b.data.order || 999))
    .slice(0, limit)
}

// Get featured brands
export async function getFeaturedBrands(limit = 8) {
  const brands = await getCollection('brands')
  return brands
    .filter(brand => brand.data.featured)
    .sort((a, b) => (a.data.order || 999) - (b.data.order || 999))
    .slice(0, limit)
}

// Check if a URL is valid (not example.com or empty)
function isValidPlatformUrl(url: string): boolean {
  if (!url) {return false}
  if (url.includes('example.com')) {return false}
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Get platforms by category
export async function getPlatformsByCategory(category: 'podcast' | 'music' | 'general' = 'podcast') {
  const platforms = await getCollection('platforms')
  return platforms
    .filter(platform => platform.data.category === category)
    .sort((a, b) => (a.data.order || 999) - (b.data.order || 999))
}

// Get platforms by category filtered by language with valid URLs
export async function getPlatformsByCategoryAndLanguage(
  category: 'podcast' | 'music' | 'general' = 'podcast',
  language: Language
) {
  const platforms = await getCollection('platforms')
  return platforms
    .filter(platform => {
      // Filter by category (default to 'podcast' if no category set)
      const platformCategory = platform.data.category || 'podcast'
      if (platformCategory !== category) {return false}

      // Check if platform has a valid URL for this language
      const languageUrl = platform.data.urls[language]
      return isValidPlatformUrl(languageUrl)
    })
    .sort((a, b) => (a.data.displayOrder || a.data.order || 999) - (b.data.displayOrder || b.data.order || 999))
}

// Get platforms by media type (audio vs video) filtered by language with valid URLs
export async function getPlatformsByMediaTypeAndLanguage(
  mediaType: 'audio' | 'video',
  language: Language
) {
  const platforms = await getCollection('platforms')
  return platforms
    .filter(platform => {
      // Check if platform has a valid URL for this language
      const languageUrl = platform.data.urls[language]
      if (!isValidPlatformUrl(languageUrl)) {return false}

      // Determine media type based on platform name/slug
      const platformName = platform.data.name.toLowerCase()
      const platformSlug = platform.data.slug.toLowerCase()

      if (mediaType === 'video') {
        // Only YouTube is considered a video platform
        return platformName.includes('youtube') || platformSlug.includes('youtube')
      } else {
        // All other platforms are audio platforms
        return !platformName.includes('youtube') && !platformSlug.includes('youtube')
      }
    })
    .sort((a, b) => (a.data.displayOrder || a.data.order || 999) - (b.data.displayOrder || b.data.order || 999))
}

// Get all valid platforms for a specific language (regardless of category)
export async function getValidPlatformsForLanguage(language: Language) {
  const platforms = await getCollection('platforms')
  return platforms
    .filter(platform => {
      const languageUrl = platform.data.urls[language]
      return isValidPlatformUrl(languageUrl)
    })
    .sort((a, b) => (a.data.displayOrder || a.data.order || 999) - (b.data.displayOrder || b.data.order || 999))
}

// Get episode by slug and language
export async function getEpisodeBySlug(slug: string, language: Language) {
  const episodes = await getCollection('episodes')
  return episodes.find(episode =>
    (episode.data.slug === slug || episode.slug === slug) &&
    episode.data.language === language &&
    episode.data.status === 'published'
  )
}

// Get guest by slug
export async function getGuestBySlug(slug: string) {
  const guests = await getCollection('guests')
  return guests.find(guest => (guest.data.slug || guest.slug) === slug)
}

// Get related episodes for a guest (now returns episodes from ALL languages)
export async function getGuestEpisodes(guestSlug: string, language?: Language) {
  const episodes = await getCollection('episodes')

  // First try the standard approach: check if episode has this guest in its guests array
  const episodesWithGuest = episodes
    .filter(episode => {
      // Check if guest is in the episode's guests array
      const hasGuest = episode.data.guests.includes(guestSlug)
      const isPublished = episode.data.status === 'published'

      // If language is specified, filter by it; otherwise return all languages
      if (language) {
        return hasGuest && isPublished && episode.data.language === language
      }
      return hasGuest && isPublished
    })
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())

  // If we found episodes, return them
  if (episodesWithGuest.length > 0) {
    return episodesWithGuest
  }

  // Otherwise, try the reverse approach: get the guest and find episodes by their IDs
  const guest = await getGuestBySlug(guestSlug)
  if (!guest || !guest.data.episodes || guest.data.episodes.length === 0) {
    return []
  }

  // Filter episodes by transistorId that match the guest's episode IDs
  return episodes
    .filter(episode => {
      const hasEpisodeId = guest.data.episodes.includes(episode.data.transistorId)
      const isPublished = episode.data.status === 'published'

      // If language is specified, filter by it; otherwise return all languages
      if (language) {
        return hasEpisodeId && isPublished && episode.data.language === language
      }
      return hasEpisodeId && isPublished
    })
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
}

// Format episode duration for display
export function formatDuration(duration: string): string {
  // Parse duration from MM:SS or HH:MM:SS format to seconds
  const totalSeconds = parseDurationToSeconds(duration)

  // Check if duration is valid
  if (totalSeconds <= 0) {
    return ''
  }

  // Convert seconds to minutes and round to nearest integer
  const totalMinutes = Math.round(totalSeconds / 60)

  // If over 60 minutes, show as hours and minutes
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes} min`
  }

  return `${totalMinutes} min`
}

// Generate episode URL
export function getEpisodeUrl(episode: { data: { language: Language; slug?: string }; slug?: string }): string {
  const { language } = episode.data
  const slug = episode.data.slug || episode.slug
  return `/${language}/episodes/${slug}/`
}

// Generate guest URL with optional language parameter
export function getGuestUrl(guest: { data: { slug?: string }; slug?: string }, language?: Language): string {
  const slug = guest.data.slug || guest.slug
  return language ? `/guests/${slug}/?lang=${language}` : `/guests/${slug}/`
}

// Get latest episodes across all languages for homepage
export async function getLatestEpisodesByLanguage() {
  const episodes = await getCollection('episodes')
  const languages: Language[] = ['en', 'nl', 'de', 'es']

  const result: Record<Language, any[]> = {
    en: [],
    nl: [],
    de: [],
    es: []
  }

  for (const language of languages) {
    result[language] = episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published')
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
      .slice(0, 3)
  }

  return result
}

// Get latest episode from each language for homepage
export async function getLatestEpisodeFromEachLanguage() {
  const episodes = await getCollection('episodes')
  const languages: Language[] = ['en', 'nl', 'de', 'es']

  const result: any[] = []

  for (const language of languages) {
    const latestEpisode = episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published')
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())[0]

    if (latestEpisode) {
      result.push(latestEpisode)
    }
  }

  return result
}

// Get episode count by language
export async function getEpisodeCountByLanguage(language: Language): Promise<number> {
  const episodes = await getCollection('episodes')
  return episodes.filter(episode => episode.data.language === language && episode.data.status === 'published').length
}

// Get total episode count across all languages
export async function getTotalEpisodeCount(): Promise<number> {
  const episodes = await getCollection('episodes')
  return episodes.filter(episode => episode.data.status === 'published').length
}

// Get guest count by language
export async function getGuestCountByLanguage(language: Language): Promise<number> {
  const guests = await getCollection('guests')
  return guests.filter(guest => guest.data.languages.includes(language)).length
}

// Get total guest count
export async function getTotalGuestCount(): Promise<number> {
  const guests = await getCollection('guests')
  // Only count guests that have episodes
  return guests.filter(guest => guest.data.episodes && guest.data.episodes.length > 0).length
}

// Get counts for all languages including global
export async function getLanguageCounts() {
  const languages: Language[] = ['en', 'nl', 'de', 'es']
  const counts: Record<Language | 'global', { episodes: number; guests: number }> = {
    global: { episodes: 0, guests: 0 },
    en: { episodes: 0, guests: 0 },
    nl: { episodes: 0, guests: 0 },
    de: { episodes: 0, guests: 0 },
    es: { episodes: 0, guests: 0 }
  }

  // Get all episodes and guests
  const [episodes, guests] = await Promise.all([
    getCollection('episodes'),
    getCollection('guests')
  ])

  // Count episodes by language (only published)
  for (const episode of episodes) {
    if (episode.data.status === 'published') {
      counts[episode.data.language].episodes++
      counts.global.episodes++
    }
  }

  // Count guests - ensuring we count unique guests per language
  const uniqueGuestSlugs = new Set<string>()
  const guestsByLanguage: Record<Language, Set<string>> = {
    en: new Set(),
    nl: new Set(),
    de: new Set(),
    es: new Set()
  }

  for (const guest of guests) {
    const guestSlug = guest.data.slug || guest.slug

    // Only count guests that have episodes
    if (guest.data.episodes && guest.data.episodes.length > 0) {
      uniqueGuestSlugs.add(guestSlug)

      // Get unique languages for this guest (avoiding duplicates)
      const uniqueLanguages = new Set(guest.data.languages)

      for (const lang of uniqueLanguages) {
        guestsByLanguage[lang].add(guestSlug)
      }
    }
  }

  // Set the counts from the unique sets
  counts.global.guests = uniqueGuestSlugs.size
  for (const lang of languages) {
    counts[lang].guests = guestsByLanguage[lang].size
  }

  return counts
}

// Get all hosts
export async function getAllHosts() {
  const hosts = await getCollection('hosts')
  return hosts.sort((a, b) => a.data.name.localeCompare(b.data.name))
}

// Get hosts by language based on their episodes
export async function getHostsByLanguage(language: Language) {
  const [hosts, episodes] = await Promise.all([
    getCollection('hosts'),
    getCollection('episodes')
  ])

  // Get episode IDs for this language (only published)
  const languageEpisodeIds = new Set(
    episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published')
      .map(ep => ep.data.transistorId)
  )

  // Filter hosts who have episodes in this language
  return hosts.filter(host =>
    host.data.episodes?.some(episodeId => languageEpisodeIds.has(episodeId))
  )
}

// Get host image URL
export function getHostImageUrl(hostSlug: string): string {
  // Map host slugs to actual image filenames
  const imageMap: Record<string, string> = {
    'gxjansen': 'guido.webp',
    'michaelwitzenleiter': 'michael.jpeg',
    'ricardotayar': 'ricardo.jpeg',
    'yvonneteufel': 'yvonne.jpeg'
  }

  const filename = imageMap[hostSlug]
  return filename ? `/images/hosts/${filename}` : '/images/default-host.jpg'
}

// Get guest image URL using build-time validated inventory
export function getGuestImageUrl(guestSlug: string): string {
  const guestImage = imageInventory[guestSlug]

  if (guestImage?.hasImage && guestImage.imageUrl) {
    return guestImage.imageUrl
  }

  // Return deterministic fallback (SVG initials)
  return guestImage?.fallbackUrl || `/images/guests/generated/${guestSlug}-initials.svg`
}

// Get host by slug
export async function getHostBySlug(slug: string) {
  const hosts = await getCollection('hosts')
  return hosts.find(host => (host.data.slug || host.slug) === slug)
}

// Get languages that a host appears in
export async function getHostLanguages(hostSlug: string): Promise<Language[]> {
  const hostLanguageMap: Record<string, Language[]> = {
    'gxjansen': ['en', 'nl'],
    'michaelwitzenleiter': ['de'],
    'ricardotayar': ['es'],
    'yvonneteufel': ['de']
  }

  return hostLanguageMap[hostSlug] || []
}

// Generate host URL
export function getHostUrl(hostSlug: string): string {
  return `/hosts/${hostSlug}/`
}

// Get platform counts by language
export async function getPlatformCountsByLanguage() {
  const platforms = await getCollection('platforms')
  const languages: Language[] = ['en', 'nl', 'de', 'es']

  const counts: Record<Language, number> = {
    en: 0,
    nl: 0,
    de: 0,
    es: 0
  }

  for (const language of languages) {
    counts[language] = platforms.filter(platform => {
      const languageUrl = platform.data.urls[language]
      return isValidPlatformUrl(languageUrl)
    }).length
  }

  return counts
}

// Get popular episodes from each language based on downloads
export async function getPopularEpisodeFromEachLanguage() {
  const episodes = await getCollection('episodes')
  const languages: Language[] = ['en', 'nl', 'de', 'es']

  const result: any[] = []

  for (const language of languages) {
    const popularEpisode = episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published' && ep.data.downloads_total)
      .sort((a, b) => (b.data.downloads_total || 0) - (a.data.downloads_total || 0))[0]

    if (popularEpisode) {
      result.push(popularEpisode)
    }
  }

  return result
}

// Get popular episodes by language based on downloads
export async function getPopularEpisodesByLanguage() {
  const episodes = await getCollection('episodes')
  const languages: Language[] = ['en', 'nl', 'de', 'es']

  const result: Record<Language, any[]> = {
    en: [],
    nl: [],
    de: [],
    es: []
  }

  for (const language of languages) {
    result[language] = episodes
      .filter(ep => ep.data.language === language && ep.data.status === 'published' && ep.data.downloads_total)
      .sort((a, b) => (b.data.downloads_total || 0) - (a.data.downloads_total || 0))
      .slice(0, 3)
  }

  return result
}

// Convert duration string (MM:SS or HH:MM:SS) to seconds
function parseDurationToSeconds(duration: string): number {
  if (!duration || typeof duration !== 'string') return 0
  
  const parts = duration.split(':').map(p => parseInt(p, 10))
  if (parts.some(isNaN)) return 0
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  
  return 0
}

// Get total content duration by language in hours
export async function getTotalDurationByLanguage(language: Language): Promise<number> {
  const episodes = await getEpisodesByLanguage(language)

  // Sum up all durations (in seconds)
  const totalSeconds = episodes.reduce((sum, episode) => {
    const seconds = parseDurationToSeconds(episode.data.duration)
    return sum + seconds
  }, 0)

  // Convert to hours and round to 1 decimal place
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10

  return totalHours
}

// Get related episodes based on shared guests or keywords
export async function getRelatedEpisodes(
  currentEpisode: any,
  language: Language,
  limit = 3
) {
  const episodes = await getEpisodesByLanguage(language)

  // Score episodes based on relevance
  const scoredEpisodes = episodes
    .filter(ep => ep.data.slug !== currentEpisode.data.slug && ep.slug !== currentEpisode.slug)
    .map(ep => {
      let score = 0

      // Score based on shared guests (higher weight)
      const sharedGuests = ep.data.guests.filter(g =>
        currentEpisode.data.guests.includes(g)
      ).length
      score += sharedGuests * 3

      // Score based on shared keywords (lower weight)
      const sharedKeywords = ep.data.keywords?.filter(k =>
        currentEpisode.data.keywords?.includes(k)
      ).length || 0
      score += sharedKeywords

      // Small boost for recency
      const daysDiff = Math.abs(
        (new Date(ep.data.pubDate).getTime() - new Date(currentEpisode.data.pubDate).getTime())
        / (1000 * 60 * 60 * 24)
      )
      if (daysDiff < 30) {score += 0.5}

      return { episode: ep, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.episode)

  return scoredEpisodes
}

// Get other episodes featuring the same guest
export async function getGuestOtherEpisodes(
  guestSlug: string,
  currentEpisodeSlug: string,
  language: Language,
  limit = 5
) {
  const episodes = await getGuestEpisodes(guestSlug, language)
  return episodes
    .filter(ep => ep.data.slug !== currentEpisodeSlug && ep.slug !== currentEpisodeSlug)
    .slice(0, limit)
}

// Get guests from the same company
export async function getGuestsFromSameCompany(
  company: string,
  currentGuestSlug: string,
  limit = 4
) {
  if (!company) {return []}

  const guests = await getCollection('guests')
  return guests
    .filter(guest =>
      guest.data.company === company &&
      (guest.data.slug || guest.slug) !== currentGuestSlug
    )
    .slice(0, limit)
}

// Get episodes by keyword/topic
export async function getEpisodesByKeyword(
  keyword: string,
  language: Language,
  limit?: number
) {
  const episodes = await getEpisodesByLanguage(language)
  const filtered = episodes.filter(ep =>
    ep.data.keywords?.includes(keyword)
  )

  return limit ? filtered.slice(0, limit) : filtered
}

// Get all unique keywords for a language
export async function getAllKeywords(language: Language): Promise<string[]> {
  const episodes = await getEpisodesByLanguage(language)
  const keywordSet = new Set<string>()

  episodes.forEach(episode => {
    episode.data.keywords?.forEach(keyword => {
      keywordSet.add(keyword)
    })
  })

  return Array.from(keywordSet).sort()
}

// Get host statistics across all languages
export async function getHostStatistics(hostSlug: string): Promise<{
  totalEpisodes: number;
  totalGuests: number;
  episodesByLanguage: Record<Language, number>;
  uniqueGuestsByLanguage: Record<Language, string[]>;
}> {
  const [allEpisodes, allHosts] = await Promise.all([
    getCollection('episodes'),
    getCollection('hosts')
  ])

  // Get the host data to find their episode IDs
  const host = allHosts.find(h => (h.data.slug || h.slug) === hostSlug)
  if (!host || !host.data.episodes) {
    return {
      totalEpisodes: 0,
      totalGuests: 0,
      episodesByLanguage: { en: 0, nl: 0, de: 0, es: 0 },
      uniqueGuestsByLanguage: { en: [], nl: [], de: [], es: [] }
    }
  }

  // Filter episodes for this host using their episode IDs (only published)
  const hostEpisodes = allEpisodes.filter(episode =>
    host.data.episodes.includes(episode.data.transistorId) && episode.data.status === 'published'
  )

  // Count episodes by language
  const episodesByLanguage: Record<Language, number> = {
    en: 0,
    nl: 0,
    de: 0,
    es: 0
  }

  // Track unique guests by language
  const uniqueGuestsByLanguage: Record<Language, string[]> = {
    en: [],
    nl: [],
    de: [],
    es: []
  }

  // Process each episode to count episodes and collect unique guests per language
  hostEpisodes.forEach(episode => {
    const language = episode.data.language
    episodesByLanguage[language]++

    // Add guests for this episode to the language-specific list
    episode.data.guests.forEach(guestSlug => {
      if (!uniqueGuestsByLanguage[language].includes(guestSlug)) {
        uniqueGuestsByLanguage[language].push(guestSlug)
      }
    })
  })

  // Calculate totals across all languages
  const totalEpisodes = Object.values(episodesByLanguage).reduce((sum, count) => sum + count, 0)

  // Get unique guests across all languages
  const allUniqueGuests = new Set<string>()
  Object.values(uniqueGuestsByLanguage).forEach(guestList => {
    guestList.forEach(guestSlug => allUniqueGuests.add(guestSlug))
  })
  const totalGuests = allUniqueGuests.size

  return {
    totalEpisodes,
    totalGuests,
    episodesByLanguage,
    uniqueGuestsByLanguage
  }
}

// ========== LinkedIn Data Functions ==========

/**
 * Fetch a single guest with LinkedIn data by slug
 * @param slug - The guest slug to fetch
 * @returns Guest with LinkedIn data or null if not found
 */
export async function getGuestWithLinkedIn(slug: string): Promise<GuestWithLinkedIn | null> {
  try {
    // Get guest from content collection
    const guest = await getGuestBySlug(slug)
    if (!guest) {
      return null
    }

    // Extract LinkedIn data from frontmatter
    const linkedInRaw: LinkedInDataRaw = {
      linkedin_url: guest.data.linkedin_url,
      linkedin_full_name: guest.data.linkedin_full_name,
      linkedin_first_name: guest.data.linkedin_first_name,
      linkedin_headline: guest.data.linkedin_headline,
      linkedin_email: guest.data.linkedin_email,
      linkedin_bio: guest.data.linkedin_bio,
      linkedin_profile_pic: guest.data.linkedin_profile_pic,
      linkedin_current_role: guest.data.linkedin_current_role,
      linkedin_current_company: guest.data.linkedin_current_company,
      linkedin_country: guest.data.linkedin_country,
      linkedin_skills: guest.data.linkedin_skills,
      linkedin_company_website: guest.data.linkedin_company_website,
      linkedin_experiences: guest.data.linkedin_experiences,
      linkedin_personal_website: guest.data.linkedin_personal_website,
      linkedin_publications: guest.data.linkedin_publications,
      linkedin_last_modified: guest.data.linkedin_last_modified
    }

    // Transform LinkedIn data if available
    const hasLinkedInFields = linkedInRaw.linkedin_url || linkedInRaw.linkedin_headline
    let linkedInData: any = undefined

    if (hasLinkedInFields) {
      try {
        linkedInData = transformLinkedInData(linkedInRaw)
      } catch (error) {
        console.error(`Error transforming LinkedIn data for guest ${slug}:`, error)
        // Continue with undefined linkedInData rather than failing completely
      }
    }

    // Return guest with LinkedIn data - include imageUrl!
    return {
      name: guest.data.name,
      bio: guest.data.bio,
      company: guest.data.company,
      role: guest.data.role,
      email: guest.data.email,
      website: guest.data.website,
      linkedin: guest.data.linkedin,
      imageUrl: guest.data.imageUrl, // Include the imageUrl field!
      slug: guest.data.slug || guest.slug, // Include slug for easier access
      linkedInData,
      linkedInRaw: hasLinkedInFields ? linkedInRaw : undefined
    }
  } catch (error) {
    console.error(`Error fetching guest with LinkedIn data for slug ${slug}:`, error)
    return null
  }
}

/**
 * Get all guests with LinkedIn data for a specific language
 * @param language - The language to filter guests by
 * @returns Array of guests with LinkedIn data
 */
export async function getGuestsWithLinkedIn(language: Language): Promise<GuestWithLinkedIn[]> {
  try {
    // Get all guests from content collection for language filtering
    const contentGuests = await getGuestsByLanguage(language)

    // Transform each guest to include LinkedIn data
    const guestsWithLinkedIn = await Promise.all(
      contentGuests.map(async (guest) => {
        const slug = guest.data.slug || guest.slug
        return getGuestWithLinkedIn(slug)
      })
    )

    // Filter out any null results and sort by name
    return guestsWithLinkedIn
      .filter((guest): guest is GuestWithLinkedIn => guest !== null)
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error(`Error fetching guests with LinkedIn data for language ${language}:`, error)
    return []
  }
}

/**
 * Get guests filtered by current LinkedIn company
 * @param company - The company name to filter by
 * @param language - Optional language filter
 * @returns Array of guests from the specified company
 */
export async function getGuestsByCurrentCompany(
  company: string,
  language?: Language
): Promise<GuestWithLinkedIn[]> {
  if (!company) {
    return []
  }

  try {
    // Get all guests
    const guests = language
      ? await getGuestsByLanguage(language)
      : await getCollection('guests')

    // Transform guests and filter by company
    const guestsWithLinkedIn = await Promise.all(
      guests.map(async (guest) => {
        const slug = guest.data.slug || guest.slug
        return getGuestWithLinkedIn(slug)
      })
    )

    // Filter by LinkedIn current company or regular company field
    return guestsWithLinkedIn
      .filter((guest): guest is GuestWithLinkedIn => {
        if (!guest) {return false}
        // Check LinkedIn current company first, then regular company field
        const guestCompany = guest.linkedInData?.currentCompany || guest.company
        return guestCompany?.toLowerCase() === company.toLowerCase()
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error(`Error fetching guests from company ${company}:`, error)
    return []
  }
}

/**
 * Get recently updated guests based on LinkedIn sync date
 * @param limit - Maximum number of guests to return
 * @returns Array of recently synced guests
 */
export async function getRecentlyUpdatedGuests(limit = 10): Promise<GuestWithLinkedIn[]> {
  try {
    // Get all guests
    const allGuests = await getCollection('guests')

    // Transform guests and filter those with sync dates
    const guestsWithLinkedIn = await Promise.all(
      allGuests.map(async (guest) => {
        const slug = guest.data.slug || guest.slug
        return getGuestWithLinkedIn(slug)
      })
    )

    // Filter guests that have LinkedIn data and sync date
    const guestsWithSyncDate = guestsWithLinkedIn
      .filter((guest): guest is GuestWithLinkedIn =>
        guest !== null && guest.linkedInData?.lastSync !== undefined
      )

    // Sort by sync date (most recent first)
    const sortedGuests = guestsWithSyncDate.sort((a, b) => {
      const dateA = a.linkedInData?.lastSync?.getTime() || 0
      const dateB = b.linkedInData?.lastSync?.getTime() || 0
      return dateB - dateA
    })

    // Return limited results
    return sortedGuests.slice(0, limit)
  } catch (error) {
    console.error('Error fetching recently updated guests:', error)
    return []
  }
}

/**
 * Check if a guest has LinkedIn data
 * @param guest - The guest object to check
 * @returns True if guest has LinkedIn data
 */
export function hasLinkedInData(guest: any): boolean {
  // Check if guest has the linkedInData property using the type guard
  if (hasLinkedInDataTypeGuard(guest)) {
    return true
  }

  // Check for LinkedIn fields in frontmatter data
  if (guest?.data) {
    return Boolean(
      guest.data.linkedin_url ||
      guest.data.linkedin_headline ||
      guest.data.linkedin_bio ||
      guest.data.linkedin_current_company
    )
  }

  // Also check for LinkedIn URL in regular guest data
  return Boolean(guest?.data?.linkedin || guest?.linkedin)
}

/**
 * Get guest profile picture using build-time validated inventory
 * @param guest - The guest object
 * @returns Profile picture URL (validated at build time)
 */
export function getGuestProfilePicture(guest: any): string {
  // Extract guest slug
  const guestSlug = guest?.data?.slug || guest?.slug
  if (!guestSlug) {
    return '/images/default-guest.jpg'
  }

  // Use build-time validated image inventory
  const guestImage = imageInventory[guestSlug]

  if (guestImage?.hasImage && guestImage.imageUrl) {
    // Return validated image path
    return guestImage.imageUrl
  }

  // Return deterministic SVG fallback (generated at build time)
  return guestImage?.fallbackUrl || `/images/guests/generated/${guestSlug}-initials.svg`
}