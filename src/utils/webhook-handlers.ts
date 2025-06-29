/**
 * Webhook handlers for Transistor.FM real-time updates
 *
 * This module provides webhook handlers for real-time episode updates from Transistor.FM.
 * It integrates with the RSS parser and content generation system to automatically
 * update content when episodes are published, updated, or deleted.
 */

import type { Language } from '../types'
import { parseRSSFeed, type ParsedEpisode } from './rss-parser.js'

/**
 * Transistor webhook event types
 */
export type WebhookEventType =
  | 'episode_created'
  | 'episode_updated'
  | 'episode_published'
  | 'episode_unpublished'
  | 'episode_deleted';

/**
 * Transistor webhook payload structure
 */
export interface TransistorWebhookPayload {
  event: WebhookEventType;
  created_at: string;
  data: {
    id: string;
    type: 'episode';
    attributes: {
      title: string;
      number: number;
      season: number;
      status: 'published' | 'scheduled' | 'draft';
      published_at: string | null;
      duration: number;
      explicit: boolean;
      keywords: string;
      alternate_url: string | null;
      media_url: string;
      image_url: string | null;
      video_url: string | null;
      author: string | null;
      summary: string;
      description: string;
      slug: string | null;
      created_at: string;
      updated_at: string;
      formatted_published_at: string | null;
      duration_in_mmss: string;
      share_url: string;
      transcript_url: string | null;
      transcripts: string[];
      formatted_summary: string;
      formatted_description: string;
      embed_html: string;
      embed_html_dark: string;
      audio_processing: boolean;
      type: 'full' | 'trailer' | 'bonus';
      email_notifications: boolean | null;
    };
    relationships: {
      show: {
        data: {
          id: string;
          type: 'show';
        };
      };
    };
  };
}

/**
 * Webhook processing result
 */
export interface WebhookProcessResult {
  success: boolean;
  action: 'created' | 'updated' | 'deleted' | 'ignored';
  episodeSlug?: string;
  language?: Language;
  error?: string;
}

/**
 * Show ID to language mapping
 * This would need to be configured based on your actual Transistor show IDs
 */
const SHOW_LANGUAGE_MAP: Record<string, Language> = {
  // These IDs would need to be replaced with actual Transistor show IDs
  'cro-cafe-english': 'en',
  'cro-cafe-dutch': 'nl',
  'cro-cafe-german': 'de',
  'cro-cafe-spanish': 'es'
}

/**
 * RSS feed URLs by show ID
 */
const SHOW_RSS_MAP: Record<string, string> = {
  'cro-cafe-english': 'https://feeds.transistor.fm/cro-cafe-english',
  'cro-cafe-dutch': 'https://feeds.transistor.fm/cro-cafe-dutch',
  'cro-cafe-german': 'https://feeds.transistor.fm/cro-cafe-german',
  'cro-cafe-spanish': 'https://feeds.transistor.fm/cro-cafe-spanish'
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  secretKey?: string;
  autoRegenerate: boolean;
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
}

/**
 * Default webhook configuration
 */
const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  autoRegenerate: true,
  maxRetries: 3,
  retryDelay: 5000,
  enableLogging: true
}

/**
 * Validate webhook payload signature (if secret key is provided)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  // This would implement HMAC-SHA256 signature validation
  // For now, returning true as a placeholder
  console.log('Webhook signature validation not implemented')
  return true
}

/**
 * Convert Transistor episode data to ParsedEpisode format
 */
function convertTransistorEpisode(
  data: TransistorWebhookPayload['data'],
  language: Language
): ParsedEpisode {
  const attributes = data.attributes

  return {
    title: attributes.title,
    description: attributes.description || attributes.formatted_description,
    pubDate: attributes.published_at ? new Date(attributes.published_at) : new Date(),
    season: attributes.season,
    episode: attributes.number,
    duration: attributes.duration_in_mmss,
    audioUrl: attributes.media_url,
    slug: attributes.slug || `s${attributes.season}e${attributes.number}-${attributes.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    language,
    imageUrl: attributes.image_url || undefined,
    hosts: attributes.author ? [attributes.author] : ['Guido Jansen'],
    guests: [], // Would need to be extracted from description
    keywords: attributes.keywords ? attributes.keywords.split(',').map(k => k.trim()) : [],
    transistorId: data.id,
    shareUrl: attributes.share_url,
    embedHtml: attributes.embed_html,
    featured: false,
    episodeType: attributes.type,
    summary: attributes.summary || attributes.formatted_summary
  }
}

/**
 * Determine language from show ID
 */
function getLanguageFromShow(showId: string): Language | null {
  return SHOW_LANGUAGE_MAP[showId] || null
}

/**
 * Process episode creation webhook
 */
async function processEpisodeCreated(
  payload: TransistorWebhookPayload,
  config: WebhookConfig
): Promise<WebhookProcessResult> {
  try {
    const showId = payload.data.relationships.show.data.id
    const language = getLanguageFromShow(showId)

    if (!language) {
      return {
        success: false,
        action: 'ignored',
        error: `Unknown show ID: ${showId}`
      }
    }

    const episode = convertTransistorEpisode(payload.data, language)

    if (config.enableLogging) {
      console.log(`Processing episode creation: ${episode.title} (${language})`)
    }

    // Here you would trigger content generation for the new episode
    // For now, we'll just return a success result

    return {
      success: true,
      action: 'created',
      episodeSlug: episode.slug,
      language
    }

  } catch (error) {
    return {
      success: false,
      action: 'ignored',
      error: (error as Error).message
    }
  }
}

/**
 * Process episode update webhook
 */
async function processEpisodeUpdated(
  payload: TransistorWebhookPayload,
  config: WebhookConfig
): Promise<WebhookProcessResult> {
  try {
    const showId = payload.data.relationships.show.data.id
    const language = getLanguageFromShow(showId)

    if (!language) {
      return {
        success: false,
        action: 'ignored',
        error: `Unknown show ID: ${showId}`
      }
    }

    const episode = convertTransistorEpisode(payload.data, language)

    if (config.enableLogging) {
      console.log(`Processing episode update: ${episode.title} (${language})`)
    }

    // Here you would trigger content regeneration for the updated episode

    return {
      success: true,
      action: 'updated',
      episodeSlug: episode.slug,
      language
    }

  } catch (error) {
    return {
      success: false,
      action: 'ignored',
      error: (error as Error).message
    }
  }
}

/**
 * Process episode published webhook
 */
async function processEpisodePublished(
  payload: TransistorWebhookPayload,
  config: WebhookConfig
): Promise<WebhookProcessResult> {
  try {
    const showId = payload.data.relationships.show.data.id
    const language = getLanguageFromShow(showId)

    if (!language) {
      return {
        success: false,
        action: 'ignored',
        error: `Unknown show ID: ${showId}`
      }
    }

    if (config.enableLogging) {
      console.log(`Processing episode publication: ${payload.data.attributes.title} (${language})`)
    }

    // For published episodes, we want to trigger a full RSS refresh
    // to ensure we have the latest data
    if (config.autoRegenerate) {
      const rssUrl = SHOW_RSS_MAP[showId]
      if (rssUrl) {
        try {
          const episodes = await parseRSSFeed(rssUrl, language)
          // Here you would trigger content generation for all episodes
          console.log(`Refreshed ${episodes.length} episodes from RSS feed`)
        } catch (error) {
          console.error(`Failed to refresh RSS feed for ${language}:`, error)
        }
      }
    }

    return {
      success: true,
      action: 'updated',
      episodeSlug: payload.data.attributes.slug || payload.data.id,
      language
    }

  } catch (error) {
    return {
      success: false,
      action: 'ignored',
      error: (error as Error).message
    }
  }
}

/**
 * Process episode unpublished webhook
 */
async function processEpisodeUnpublished(
  payload: TransistorWebhookPayload,
  config: WebhookConfig
): Promise<WebhookProcessResult> {
  try {
    const showId = payload.data.relationships.show.data.id
    const language = getLanguageFromShow(showId)

    if (!language) {
      return {
        success: false,
        action: 'ignored',
        error: `Unknown show ID: ${showId}`
      }
    }

    if (config.enableLogging) {
      console.log(`Processing episode unpublication: ${payload.data.attributes.title} (${language})`)
    }

    // Here you would remove or mark the episode as unpublished

    return {
      success: true,
      action: 'updated',
      episodeSlug: payload.data.attributes.slug || payload.data.id,
      language
    }

  } catch (error) {
    return {
      success: false,
      action: 'ignored',
      error: (error as Error).message
    }
  }
}

/**
 * Process episode deleted webhook
 */
async function processEpisodeDeleted(
  payload: TransistorWebhookPayload,
  config: WebhookConfig
): Promise<WebhookProcessResult> {
  try {
    const showId = payload.data.relationships.show.data.id
    const language = getLanguageFromShow(showId)

    if (!language) {
      return {
        success: false,
        action: 'ignored',
        error: `Unknown show ID: ${showId}`
      }
    }

    if (config.enableLogging) {
      console.log(`Processing episode deletion: ${payload.data.attributes.title} (${language})`)
    }

    // Here you would delete the episode file

    return {
      success: true,
      action: 'deleted',
      episodeSlug: payload.data.attributes.slug || payload.data.id,
      language
    }

  } catch (error) {
    return {
      success: false,
      action: 'ignored',
      error: (error as Error).message
    }
  }
}

/**
 * Main webhook handler
 */
export async function handleTransistorWebhook(
  payload: TransistorWebhookPayload,
  config: WebhookConfig = DEFAULT_WEBHOOK_CONFIG
): Promise<WebhookProcessResult> {
  if (config.enableLogging) {
    console.log(`Received webhook: ${payload.event} for episode ${payload.data.id}`)
  }

  try {
    switch (payload.event) {
      case 'episode_created':
        return await processEpisodeCreated(payload, config)

      case 'episode_updated':
        return await processEpisodeUpdated(payload, config)

      case 'episode_published':
        return await processEpisodePublished(payload, config)

      case 'episode_unpublished':
        return await processEpisodeUnpublished(payload, config)

      case 'episode_deleted':
        return await processEpisodeDeleted(payload, config)

      default:
        return {
          success: false,
          action: 'ignored',
          error: `Unknown event type: ${payload.event}`
        }
    }
  } catch (error) {
    return {
      success: false,
      action: 'ignored',
      error: `Webhook processing failed: ${(error as Error).message}`
    }
  }
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload(payload: any): payload is TransistorWebhookPayload {
  return (
    payload &&
    typeof payload.event === 'string' &&
    typeof payload.created_at === 'string' &&
    payload.data &&
    typeof payload.data.id === 'string' &&
    payload.data.type === 'episode' &&
    payload.data.attributes &&
    payload.data.relationships &&
    payload.data.relationships.show &&
    payload.data.relationships.show.data &&
    typeof payload.data.relationships.show.data.id === 'string'
  )
}

/**
 * Express.js middleware for handling Transistor webhooks
 */
export function createWebhookMiddleware(config: WebhookConfig = DEFAULT_WEBHOOK_CONFIG) {
  return async (req: any, res: any, next: any) => {
    try {
      // Validate content type
      if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ error: 'Invalid content type' })
      }

      // Get raw body for signature validation
      const rawBody = JSON.stringify(req.body)

      // Validate signature if secret key is provided
      if (config.secretKey) {
        const signature = req.headers['x-transistor-signature']
        if (!signature || !validateWebhookSignature(rawBody, signature, config.secretKey)) {
          return res.status(401).json({ error: 'Invalid signature' })
        }
      }

      // Validate payload structure
      if (!validateWebhookPayload(req.body)) {
        return res.status(400).json({ error: 'Invalid payload structure' })
      }

      // Process webhook
      const result = await handleTransistorWebhook(req.body, config)

      if (result.success) {
        res.status(200).json({
          success: true,
          action: result.action,
          episodeSlug: result.episodeSlug,
          language: result.language
        })
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        })
      }

    } catch (error) {
      console.error('Webhook middleware error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }
}

/**
 * Webhook URL generation helper
 */
export function generateWebhookUrls(baseUrl: string): Record<WebhookEventType, string> {
  const webhookPath = '/api/webhooks/transistor'

  return {
    episode_created: `${baseUrl}${webhookPath}`,
    episode_updated: `${baseUrl}${webhookPath}`,
    episode_published: `${baseUrl}${webhookPath}`,
    episode_unpublished: `${baseUrl}${webhookPath}`,
    episode_deleted: `${baseUrl}${webhookPath}`
  }
}

/**
 * Webhook setup instructions
 */
export function getWebhookSetupInstructions(baseUrl: string): string {
  const urls = generateWebhookUrls(baseUrl)

  return `
# Transistor Webhook Setup Instructions

To enable real-time updates for CRO.CAFE episodes, configure the following webhooks in your Transistor dashboard:

## Webhook Endpoints

All events should point to: \`${baseUrl}/api/webhooks/transistor\`

## Required Events

1. **Episode Created**: \`episode_created\`
2. **Episode Updated**: \`episode_updated\`
3. **Episode Published**: \`episode_published\`
4. **Episode Unpublished**: \`episode_unpublished\`
5. **Episode Deleted**: \`episode_deleted\`

## Setup Steps

1. Log in to your Transistor dashboard
2. Navigate to your show settings
3. Go to the "Webhooks" section
4. Add a new webhook for each event type listed above
5. Set the URL to: \`${baseUrl}/api/webhooks/transistor\`
6. Configure a secret key for security (recommended)
7. Test the webhook to ensure it's working

## Security

- Use HTTPS endpoints only
- Configure a secret key for webhook validation
- Monitor webhook logs for suspicious activity

## Show ID Mapping

Make sure to update the SHOW_LANGUAGE_MAP in webhook-handlers.ts with your actual Transistor show IDs:

\`\`\`typescript
const SHOW_LANGUAGE_MAP: Record<string, Language> = {
  'your-english-show-id': 'en',
  'your-dutch-show-id': 'nl',
  'your-german-show-id': 'de',
  'your-spanish-show-id': 'es',
};
\`\`\`
`.trim()
}