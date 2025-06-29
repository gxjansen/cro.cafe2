import type { CollectionEntry } from 'astro:content'
import type { Language } from '../types'

interface SEOOptimizationConfig {
  titleLength: number;
  descriptionLength: number;
  summaryLength: number;
}

const SEO_CONFIG: SEOOptimizationConfig = {
  titleLength: 60,
  descriptionLength: 160,
  summaryLength: 320
}

// Language-specific SEO keywords and patterns
const SEO_KEYWORDS: Record<Language, {
  primary: string[];
  secondary: string[];
  patterns: {
    howTo: string;
    withGuest: string;
    episode: string;
    insights: string;
    guide: string;
    strategies: string;
    tips: string;
  }
}> = {
  en: {
    primary: ['CRO', 'conversion rate optimization', 'experimentation', 'A/B testing', 'optimization'],
    secondary: ['growth', 'digital marketing', 'user experience', 'UX', 'analytics', 'data-driven'],
    patterns: {
      howTo: 'How to',
      withGuest: 'with',
      episode: 'Episode',
      insights: 'Insights',
      guide: 'Guide',
      strategies: 'Strategies',
      tips: 'Tips'
    }
  },
  nl: {
    primary: ['CRO', 'conversie optimalisatie', 'experimenteren', 'A/B testen', 'optimalisatie'],
    secondary: ['groei', 'digitale marketing', 'gebruikerservaring', 'UX', 'analytics', 'data-gedreven'],
    patterns: {
      howTo: 'Hoe je',
      withGuest: 'met',
      episode: 'Aflevering',
      insights: 'Inzichten',
      guide: 'Gids',
      strategies: 'Strategieën',
      tips: 'Tips'
    }
  },
  de: {
    primary: ['CRO', 'Conversion Rate Optimierung', 'Experimente', 'A/B Tests', 'Optimierung'],
    secondary: ['Wachstum', 'digitales Marketing', 'Nutzererfahrung', 'UX', 'Analytics', 'datengetrieben'],
    patterns: {
      howTo: 'Wie man',
      withGuest: 'mit',
      episode: 'Folge',
      insights: 'Einblicke',
      guide: 'Leitfaden',
      strategies: 'Strategien',
      tips: 'Tipps'
    }
  },
  es: {
    primary: ['CRO', 'optimización de conversión', 'experimentación', 'pruebas A/B', 'optimización'],
    secondary: ['crecimiento', 'marketing digital', 'experiencia de usuario', 'UX', 'analítica', 'basado en datos'],
    patterns: {
      howTo: 'Cómo',
      withGuest: 'con',
      episode: 'Episodio',
      insights: 'Perspectivas',
      guide: 'Guía',
      strategies: 'Estrategias',
      tips: 'Consejos'
    }
  }
}

/**
 * Optimize episode title for SEO
 * - Includes relevant keywords
 * - Keeps within character limit
 * - Makes it more descriptive and search-friendly
 */
export function optimizeEpisodeTitle(
  episode: CollectionEntry<'episodes'>,
  guestNames: string[] = []
): string {
  const { title, language } = episode.data
  const keywords = SEO_KEYWORDS[language]

  // Check if title already contains key terms
  const hasCROTerm = /CRO|conversion|optimization|optimierung|optimización|optimalisatie/i.test(title)
  const hasActionWord = /how|guide|tips|strategies|insights/i.test(title)

  // Build optimized title
  let optimizedTitle = title

  // Add guest names if available and title is short enough
  if (guestNames.length > 0 && title.length < 40) {
    const guestString = guestNames.slice(0, 2).join(' & ')
    optimizedTitle = `${title} ${keywords.patterns.withGuest} ${guestString}`
  }

  // Add CRO context if not present and title is generic
  if (!hasCROTerm && title.length < 45) {
    // Check if it's a how-to or guide type content
    if (title.toLowerCase().includes(keywords.patterns.howTo.toLowerCase())) {
      optimizedTitle = `${title} - CRO ${keywords.patterns.guide}`
    } else {
      optimizedTitle = `${title} - CRO ${keywords.patterns.insights}`
    }
  }

  // Ensure we don't exceed length limit
  if (optimizedTitle.length > SEO_CONFIG.titleLength) {
    // Try to keep the original title if it's already good
    if (title.length <= SEO_CONFIG.titleLength && hasCROTerm) {
      return title
    }
    // Otherwise truncate smartly
    optimizedTitle = truncateSmartly(optimizedTitle, SEO_CONFIG.titleLength)
  }

  return optimizedTitle
}

/**
 * Optimize episode description for SEO
 * - Front-loads important keywords
 * - Includes guest names
 * - Provides clear value proposition
 */
export function optimizeEpisodeDescription(
  episode: CollectionEntry<'episodes'>,
  guestNames: string[] = []
): string {
  const { description, summary, language, title } = episode.data
  const keywords = SEO_KEYWORDS[language]

  // Use summary if available and description is too long
  let baseText = description
  if (summary && description.length > SEO_CONFIG.descriptionLength * 1.5) {
    baseText = summary
  }

  // Extract key topics from the content
  const topics = extractTopics(baseText, keywords)

  // Build optimized description
  let optimizedDesc = ''

  // Start with action-oriented opening
  if (topics.includes('how') || topics.includes('guide')) {
    optimizedDesc = `Learn ${topics.join(', ')} in this CRO podcast episode`
  } else {
    optimizedDesc = `Discover ${topics.join(', ')} insights`
  }

  // Add guest context
  if (guestNames.length > 0) {
    optimizedDesc += ` with ${guestNames.join(' & ')}`
  }

  // Add value proposition
  const valueProps = extractValueProposition(baseText, language)
  if (valueProps) {
    optimizedDesc += `. ${valueProps}`
  }

  // Ensure we stay within limit
  return truncateSmartly(optimizedDesc, SEO_CONFIG.descriptionLength)
}

/**
 * Generate SEO-friendly meta description
 * Different from regular description - more focused on search intent
 */
export function generateMetaDescription(
  episode: CollectionEntry<'episodes'>,
  guestNames: string[] = []
): string {
  const { language, title } = episode.data
  const keywords = SEO_KEYWORDS[language]

  // Template patterns for meta descriptions
  const templates = [
    `${keywords.patterns.episode}: ${title}. Join us for actionable ${keywords.primary[0]} insights`,
    `Discover proven ${keywords.primary[1]} strategies in this episode`,
    `Learn from ${keywords.primary[0]} experts about ${extractMainTopic(title, language)}`
  ]

  // Select appropriate template based on content
  let metaDesc = templates[0]

  if (guestNames.length > 0) {
    metaDesc += ` with ${guestNames[0]}`
    if (guestNames.length > 1) {
      metaDesc += ` and ${guestNames.length - 1} more`
    }
  }

  // Add call to action
  metaDesc += '. Listen now!'

  return truncateSmartly(metaDesc, SEO_CONFIG.descriptionLength)
}

/**
 * Extract main topics from text
 */
function extractTopics(text: string, keywords: typeof SEO_KEYWORDS[Language]): string[] {
  const topics: string[] = []
  const lowerText = text.toLowerCase()

  // Check for primary keywords
  keywords.primary.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      topics.push(keyword)
    }
  })

  // Check for common topics
  const commonTopics = [
    'testing', 'personalization', 'analytics', 'user research',
    'conversion', 'optimization', 'experimentation', 'growth'
  ]

  commonTopics.forEach(topic => {
    if (lowerText.includes(topic) && !topics.includes(topic)) {
      topics.push(topic)
    }
  })

  return topics.slice(0, 3) // Limit to 3 topics
}

/**
 * Extract value proposition from content
 */
function extractValueProposition(text: string, language: Language): string {
  const patterns = {
    en: [
      /learn\s+(?:how\s+to\s+)?(.+?)(?:\.|,|$)/i,
      /discover\s+(.+?)(?:\.|,|$)/i,
      /insights?\s+(?:on|about|into)\s+(.+?)(?:\.|,|$)/i
    ],
    nl: [
      /leer\s+(?:hoe\s+je\s+)?(.+?)(?:\.|,|$)/i,
      /ontdek\s+(.+?)(?:\.|,|$)/i,
      /inzichten?\s+(?:over|in)\s+(.+?)(?:\.|,|$)/i
    ],
    de: [
      /lernen\s+(?:wie\s+man\s+)?(.+?)(?:\.|,|$)/i,
      /entdecken\s+(.+?)(?:\.|,|$)/i,
      /einblicke?\s+(?:in|über)\s+(.+?)(?:\.|,|$)/i
    ],
    es: [
      /aprende\s+(?:cómo\s+)?(.+?)(?:\.|,|$)/i,
      /descubre\s+(.+?)(?:\.|,|$)/i,
      /perspectivas?\s+(?:sobre|en)\s+(.+?)(?:\.|,|$)/i
    ]
  }

  const langPatterns = patterns[language]
  for (const pattern of langPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return ''
}

/**
 * Extract main topic from title
 */
function extractMainTopic(title: string, language: Language): string {
  // Remove common prefixes
  const cleanTitle = title
    .replace(/^(how to|guide to|tips for|strategies for)/i, '')
    .replace(/^(hoe je|gids voor|tips voor|strategieën voor)/i, '')
    .replace(/^(wie man|leitfaden für|tipps für|strategien für)/i, '')
    .replace(/^(cómo|guía para|consejos para|estrategias para)/i, '')
    .trim()

  // Extract the main topic (usually the first few words)
  const words = cleanTitle.split(' ')
  return words.slice(0, 4).join(' ').toLowerCase()
}

/**
 * Smart truncation that preserves whole words
 */
function truncateSmartly(text: string, maxLength: number): string {
  if (text.length <= maxLength) {return text}

  // Find the last space before maxLength
  let truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    truncated = truncated.substring(0, lastSpace)
  }

  // Remove trailing punctuation except periods
  truncated = truncated.replace(/[,;:]$/, '')

  // Add ellipsis if needed
  if (!truncated.endsWith('.')) {
    truncated += '...'
  }

  return truncated
}

/**
 * Generate structured data for better SEO
 */
export function generateStructuredData(
  episode: CollectionEntry<'episodes'>,
  guestNames: string[] = []
): Record<string, any> {
  const { title, description, language, pubDate, duration } = episode.data

  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: optimizeEpisodeTitle(episode, guestNames),
    description: optimizeEpisodeDescription(episode, guestNames),
    datePublished: pubDate,
    duration: duration ? `PT${duration}S` : undefined,
    inLanguage: language,
    keywords: SEO_KEYWORDS[language].primary.concat(SEO_KEYWORDS[language].secondary).join(', ')
  }
}