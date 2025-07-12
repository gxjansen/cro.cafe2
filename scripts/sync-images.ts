import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
// import { parseAllRSSFeeds, type ParsedEpisode } from '../src/utils/rss-parser.js';
import type { Language } from '../src/types/index.js'

// Temporary type definition until rss-parser is implemented
type ParsedEpisode = {
  id: string;
  title: string;
  imageUrl?: string;
  language: Language;
  slug: string;
  season: number;
  episode: number;
};

// Temporary stub function until rss-parser is implemented
async function parseAllRSSFeeds(): Promise<ParsedEpisode[]> {
  console.warn('parseAllRSSFeeds is not implemented yet - returning empty array')
  return []
}

/**
 * Image optimization configuration
 */
interface ImageConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  formats: string[];
  outputDir: string;
}

/**
 * Default image configuration
 */
const DEFAULT_IMAGE_CONFIG: ImageConfig = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 85,
  formats: ['webp', 'jpg'],
  outputDir: 'public/images/episodes'
}

/**
 * Download configuration
 */
interface DownloadConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  userAgent: string;
}

/**
 * Default download configuration
 */
const DEFAULT_DOWNLOAD_CONFIG: DownloadConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  userAgent: 'CRO.CAFE Image Sync/1.0'
}

/**
 * Image download result
 */
interface ImageDownloadResult {
  success: boolean;
  originalUrl: string;
  localPath?: string;
  error?: string;
  size?: number;
  dimensions?: { width: number; height: number };
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Ensure directory exists
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

/**
 * Generate filename from URL and episode data
 */
function generateImageFilename(
  episode: ParsedEpisode,
  originalUrl: string,
  format: string = 'jpg'
): string {
  const urlParts = new URL(originalUrl)
  const originalExt = urlParts.pathname.split('.').pop()?.toLowerCase()
  const extension = format === 'original' ? originalExt || 'jpg' : format

  // Create filename from episode data
  const filename = `${episode.language}-s${episode.season}e${episode.episode}-${episode.slug}`

  // Sanitize filename
  const sanitized = filename
    .replace(/[^a-z0-9-_]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${sanitized}.${extension}`
}

/**
 * Download image with retry logic
 */
async function downloadImage(
  url: string,
  config: DownloadConfig = DEFAULT_DOWNLOAD_CONFIG
): Promise<ArrayBuffer> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      console.log(`Downloading image: ${url} (attempt ${attempt + 1}/${config.maxRetries})`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)

      const response = await fetch(url, {
        headers: {
          'User-Agent': config.userAgent,
          'Accept': 'image/*'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`)
      }

      const buffer = await response.arrayBuffer()

      if (buffer.byteLength === 0) {
        throw new Error('Empty image response')
      }

      console.log(`Successfully downloaded image: ${url} (${buffer.byteLength} bytes)`)
      return buffer

    } catch (error) {
      lastError = error as Error
      console.error(`Download attempt ${attempt + 1} failed:`, error)

      if (attempt < config.maxRetries - 1) {
        await sleep(config.retryDelay * (attempt + 1))
      }
    }
  }

  throw new Error(`Failed to download image after ${config.maxRetries} attempts: ${lastError?.message}`)
}

/**
 * Save image buffer to file
 */
async function saveImageBuffer(
  buffer: ArrayBuffer,
  filePath: string
): Promise<void> {
  await ensureDirectory(dirname(filePath))
  await fs.writeFile(filePath, Buffer.from(buffer))
}

/**
 * Get image dimensions from buffer (basic implementation)
 */
function getImageDimensions(buffer: ArrayBuffer): { width: number; height: number } | null {
  const bytes = new Uint8Array(buffer)

  // JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    for (let i = 2; i < bytes.length - 4; i++) {
      if (bytes[i] === 0xFF && bytes[i + 1] === 0xC0) {
        return {
          height: (bytes[i + 5] << 8) | bytes[i + 6],
          width: (bytes[i + 7] << 8) | bytes[i + 8]
        }
      }
    }
  }

  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return {
      width: (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19],
      height: (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]
    }
  }

  return null
}

/**
 * Check if image already exists and is valid
 */
async function checkExistingImage(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath)
    return stats.isFile() && stats.size > 0
  } catch {
    return false
  }
}

/**
 * Download and save episode image
 */
async function processEpisodeImage(
  episode: ParsedEpisode,
  imageConfig: ImageConfig = DEFAULT_IMAGE_CONFIG,
  downloadConfig: DownloadConfig = DEFAULT_DOWNLOAD_CONFIG
): Promise<ImageDownloadResult> {
  if (!episode.imageUrl) {
    return {
      success: false,
      originalUrl: '',
      error: 'No image URL provided'
    }
  }

  try {
    const filename = generateImageFilename(episode, episode.imageUrl, 'jpg')
    const filePath = join(imageConfig.outputDir, filename)

    // Check if image already exists
    if (await checkExistingImage(filePath)) {
      console.log(`Image already exists: ${filename}`)
      return {
        success: true,
        originalUrl: episode.imageUrl,
        localPath: filePath
      }
    }

    // Download image
    const buffer = await downloadImage(episode.imageUrl, downloadConfig)

    // Get image dimensions
    const dimensions = getImageDimensions(buffer)

    // Save image
    await saveImageBuffer(buffer, filePath)

    return {
      success: true,
      originalUrl: episode.imageUrl,
      localPath: filePath,
      size: buffer.byteLength,
      dimensions: dimensions || undefined
    }

  } catch (error) {
    console.error(`Failed to process image for episode ${episode.slug}:`, error)
    return {
      success: false,
      originalUrl: episode.imageUrl,
      error: (error as Error).message
    }
  }
}

/**
 * Process all images for a language
 */
async function processLanguageImages(
  language: Language,
  episodes: ParsedEpisode[],
  imageConfig: ImageConfig = DEFAULT_IMAGE_CONFIG,
  downloadConfig: DownloadConfig = DEFAULT_DOWNLOAD_CONFIG
): Promise<ImageDownloadResult[]> {
  console.log(`Processing ${episodes.length} images for ${language}...`)

  const results: ImageDownloadResult[] = []

  // Process images with controlled concurrency
  const concurrency = 3
  for (let i = 0; i < episodes.length; i += concurrency) {
    const batch = episodes.slice(i, i + concurrency)

    const batchResults = await Promise.allSettled(
      batch.map(episode => processEpisodeImage(episode, imageConfig, downloadConfig))
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        console.error('Image processing failed:', result.reason)
        results.push({
          success: false,
          originalUrl: '',
          error: result.reason?.message || 'Unknown error'
        })
      }
    }

    // Small delay between batches to be respectful
    if (i + concurrency < episodes.length) {
      await sleep(500)
    }
  }

  const successful = results.filter(r => r.success).length
  console.log(`Processed ${successful}/${episodes.length} images for ${language}`)

  return results
}

/**
 * Generate image sync report
 */
function generateReport(
  results: Record<Language, ImageDownloadResult[]>
): string {
  const report: string[] = []
  report.push('# Image Sync Report')
  report.push(`Generated: ${new Date().toISOString()}`)
  report.push('')

  let totalImages = 0
  let totalSuccessful = 0
  let totalSize = 0

  for (const [language, languageResults] of Object.entries(results)) {
    const successful = languageResults.filter(r => r.success)
    const failed = languageResults.filter(r => !r.success)
    const size = successful.reduce((sum, r) => sum + (r.size || 0), 0)

    totalImages += languageResults.length
    totalSuccessful += successful.length
    totalSize += size

    report.push(`## ${language.toUpperCase()}`)
    report.push(`- Total: ${languageResults.length}`)
    report.push(`- Successful: ${successful.length}`)
    report.push(`- Failed: ${failed.length}`)
    report.push(`- Size: ${(size / 1024 / 1024).toFixed(2)} MB`)

    if (failed.length > 0) {
      report.push('')
      report.push('### Failed Downloads:')
      for (const failure of failed) {
        report.push(`- ${failure.originalUrl}: ${failure.error}`)
      }
    }

    report.push('')
  }

  report.push('## Summary')
  report.push(`- Total Images: ${totalImages}`)
  report.push(`- Successful: ${totalSuccessful}`)
  report.push(`- Failed: ${totalImages - totalSuccessful}`)
  report.push(`- Success Rate: ${((totalSuccessful / totalImages) * 100).toFixed(1)}%`)
  report.push(`- Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)

  return report.join('\n')
}

/**
 * Main function to sync all images
 */
export async function syncAllImages(
  imageConfig: ImageConfig = DEFAULT_IMAGE_CONFIG,
  downloadConfig: DownloadConfig = DEFAULT_DOWNLOAD_CONFIG
): Promise<void> {
  console.log('Starting image synchronization...')

  try {
    // Ensure output directory exists
    await ensureDirectory(imageConfig.outputDir)

    // Parse all RSS feeds
    console.log('Parsing RSS feeds...')
    const allEpisodes = await parseAllRSSFeeds()

    // Process images for each language
    const results: Record<Language, ImageDownloadResult[]> = {} as Record<Language, ImageDownloadResult[]>

    for (const [language, episodes] of Object.entries(allEpisodes) as Array<[Language, ParsedEpisode[]]>) {
      results[language] = await processLanguageImages(
        language,
        episodes,
        imageConfig,
        downloadConfig
      )
    }

    // Generate report
    const report = generateReport(results)
    await fs.writeFile('image-sync-report.md', report)

    console.log('Image synchronization completed!')
    console.log('Report saved to: image-sync-report.md')

  } catch (error) {
    console.error('Image synchronization failed:', error)
    throw error
  }
}

/**
 * CLI entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const customConfig: Partial<ImageConfig> = {}

  // Parse command line arguments
  const args = process.argv.slice(2)
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '')
    const value = args[i + 1]

    switch (key) {
      case 'output-dir':
        customConfig.outputDir = value
        break
      case 'max-width':
        customConfig.maxWidth = parseInt(value, 10)
        break
      case 'max-height':
        customConfig.maxHeight = parseInt(value, 10)
        break
      case 'quality':
        customConfig.quality = parseInt(value, 10)
        break
    }
  }

  const finalConfig = { ...DEFAULT_IMAGE_CONFIG, ...customConfig }

  syncAllImages(finalConfig)
    .then(() => {
      console.log('✅ Image sync completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Image sync failed:', error)
      process.exit(1)
    })
}