import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { glob } from 'glob'

/**
 * LinkedIn Profile Picture Sync Script
 *
 * Downloads LinkedIn profile pictures from guest markdown files and saves them locally.
 * Overwrites existing guest images to ensure we always have the most recent LinkedIn photos.
 */

/**
 * Download configuration
 */
interface DownloadConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  userAgent: string;
  concurrency: number;
}

/**
 * Default download configuration
 */
const DEFAULT_DOWNLOAD_CONFIG: DownloadConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  userAgent: 'CRO.CAFE LinkedIn Profile Picture Sync/1.0',
  concurrency: 3
}

/**
 * Image download result
 */
interface ImageDownloadResult {
  success: boolean;
  guestSlug: string;
  guestName: string;
  originalUrl: string;
  localPath?: string;
  error?: string;
  size?: number;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Guest data extracted from markdown frontmatter
 */
interface GuestData {
  slug: string;
  name: string;
  linkedinProfilePic?: string;
  existingImagePath?: string;
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
 * Parse guest markdown file frontmatter
 */
async function parseGuestFile(filePath: string): Promise<GuestData | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) {
      console.warn(`No frontmatter found in ${filePath}`)
      return null
    }

    const frontmatter = frontmatterMatch[1]

    // Extract fields using simple regex (since we don't want to add yaml dependencies)
    const slugMatch = frontmatter.match(/^slug:\s*["']?([^"'\n]+)["']?$/m)
    const nameMatch = frontmatter.match(/^name:\s*["']([^"']+)["']$/m)
    const linkedinProfilePicMatch = frontmatter.match(/^linkedin_profile_pic:\s*["']([^"']+)["']$/m)

    if (!slugMatch || !nameMatch) {
      console.warn(`Missing required fields in ${filePath}`)
      return null
    }

    const slug = slugMatch[1]
    const name = nameMatch[1]
    const linkedinProfilePic = linkedinProfilePicMatch?.[1]

    return {
      slug,
      name,
      linkedinProfilePic,
      existingImagePath: `public/images/guests/${slug}.jpeg`
    }

  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
    return null
  }
}

/**
 * Check if image already exists and get its size
 */
async function checkExistingImage(filePath: string): Promise<{ exists: boolean; size?: number }> {
  try {
    const stats = await fs.stat(filePath)
    return {
      exists: stats.isFile() && stats.size > 0,
      size: stats.size
    }
  } catch {
    return { exists: false }
  }
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
      console.log(`  Downloading: ${url} (attempt ${attempt + 1}/${config.maxRetries})`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)

      const response = await fetch(url, {
        headers: {
          'User-Agent': config.userAgent,
          'Accept': 'image/*',
          'Referer': 'https://linkedin.com'
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

      if (buffer.byteLength < 1000) {
        throw new Error('Image too small (likely placeholder or error image)')
      }

      console.log(`  Successfully downloaded: ${(buffer.byteLength / 1024).toFixed(1)} KB`)
      return buffer

    } catch (error) {
      lastError = error as Error
      console.error(`  Download attempt ${attempt + 1} failed:`, (error as Error).message)

      if (attempt < config.maxRetries - 1) {
        await sleep(config.retryDelay * (attempt + 1))
      }
    }
  }

  throw new Error(`Failed to download after ${config.maxRetries} attempts: ${lastError?.message}`)
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
  console.log(`  Saved to: ${filePath}`)
}

/**
 * Process a single guest's LinkedIn profile picture
 */
async function processGuestImage(
  guest: GuestData,
  config: DownloadConfig = DEFAULT_DOWNLOAD_CONFIG
): Promise<ImageDownloadResult> {
  const result: ImageDownloadResult = {
    success: false,
    guestSlug: guest.slug,
    guestName: guest.name,
    originalUrl: guest.linkedinProfilePic || ''
  }

  // Check if guest has a LinkedIn profile picture URL
  if (!guest.linkedinProfilePic) {
    result.skipped = true
    result.skipReason = 'No LinkedIn profile picture URL'
    return result
  }

  // Check if URL looks valid
  if (!guest.linkedinProfilePic.startsWith('http')) {
    result.skipped = true
    result.skipReason = 'Invalid LinkedIn profile picture URL'
    return result
  }

  try {
    const outputPath = `public/images/guests/${guest.slug}.jpeg`

    // Check existing image for comparison
    const existing = await checkExistingImage(outputPath)

    console.log(`Processing ${guest.name} (${guest.slug})`)
    if (existing.exists) {
      console.log(`  Existing image found: ${(existing.size! / 1024).toFixed(1)} KB - will overwrite`)
    }

    // Download the image
    const buffer = await downloadImage(guest.linkedinProfilePic, config)

    // Save the image (overwriting existing)
    await saveImageBuffer(buffer, outputPath)

    result.success = true
    result.localPath = outputPath
    result.size = buffer.byteLength

    return result

  } catch (error) {
    console.error(`Failed to process ${guest.name}:`, (error as Error).message)
    result.error = (error as Error).message
    return result
  }
}

/**
 * Get all guest files
 */
async function getAllGuestFiles(): Promise<string[]> {
  try {
    const guestFiles = await glob('src/content/guests/*.mdx')
    console.log(`Found ${guestFiles.length} guest files`)
    return guestFiles
  } catch (error) {
    console.error('Error finding guest files:', error)
    return []
  }
}

/**
 * Parse all guest files and extract LinkedIn profile picture data
 */
async function parseAllGuests(): Promise<GuestData[]> {
  const guestFiles = await getAllGuestFiles()
  const guests: GuestData[] = []

  for (const filePath of guestFiles) {
    const guest = await parseGuestFile(filePath)
    if (guest) {
      guests.push(guest)
    }
  }

  console.log(`Parsed ${guests.length} valid guest files`)

  // Filter to only guests with LinkedIn profile pictures
  const guestsWithLinkedIn = guests.filter(g => g.linkedinProfilePic)
  console.log(`Found ${guestsWithLinkedIn.length} guests with LinkedIn profile pictures`)

  return guestsWithLinkedIn
}

/**
 * Process all guests with controlled concurrency
 */
async function processAllGuests(
  guests: GuestData[],
  config: DownloadConfig = DEFAULT_DOWNLOAD_CONFIG
): Promise<ImageDownloadResult[]> {
  console.log(`\nProcessing ${guests.length} guest profile pictures...`)

  const results: ImageDownloadResult[] = []

  // Process in batches to control concurrency
  for (let i = 0; i < guests.length; i += config.concurrency) {
    const batch = guests.slice(i, i + config.concurrency)

    console.log(`\nProcessing batch ${Math.floor(i / config.concurrency) + 1}/${Math.ceil(guests.length / config.concurrency)}`)

    const batchResults = await Promise.allSettled(
      batch.map(guest => processGuestImage(guest, config))
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        console.error('Guest processing failed:', result.reason)
        results.push({
          success: false,
          guestSlug: 'unknown',
          guestName: 'unknown',
          originalUrl: '',
          error: result.reason?.message || 'Unknown error'
        })
      }
    }

    // Small delay between batches to be respectful to LinkedIn's servers
    if (i + config.concurrency < guests.length) {
      await sleep(1000)
    }
  }

  return results
}

/**
 * Generate sync report
 */
function generateReport(results: ImageDownloadResult[]): string {
  const report: string[] = []
  report.push('# LinkedIn Profile Picture Sync Report')
  report.push(`Generated: ${new Date().toISOString()}`)
  report.push('')

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success && !r.skipped)
  const skipped = results.filter(r => r.skipped)

  const totalSize = successful.reduce((sum, r) => sum + (r.size || 0), 0)

  report.push('## Summary')
  report.push(`- Total Guests: ${results.length}`)
  report.push(`- Successful Downloads: ${successful.length}`)
  report.push(`- Failed Downloads: ${failed.length}`)
  report.push(`- Skipped: ${skipped.length}`)
  report.push(`- Success Rate: ${((successful.length / (results.length - skipped.length)) * 100).toFixed(1)}%`)
  report.push(`- Total Downloaded: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  report.push('')

  if (successful.length > 0) {
    report.push('## Successful Downloads')
    for (const result of successful) {
      const sizeKB = result.size ? (result.size / 1024).toFixed(1) : 'unknown'
      report.push(`- ${result.guestName} (${result.guestSlug}): ${sizeKB} KB`)
    }
    report.push('')
  }

  if (failed.length > 0) {
    report.push('## Failed Downloads')
    for (const result of failed) {
      report.push(`- ${result.guestName} (${result.guestSlug}): ${result.error}`)
    }
    report.push('')
  }

  if (skipped.length > 0) {
    report.push('## Skipped')
    for (const result of skipped) {
      report.push(`- ${result.guestName} (${result.guestSlug}): ${result.skipReason}`)
    }
    report.push('')
  }

  return report.join('\n')
}

/**
 * Main function to sync all LinkedIn profile pictures
 */
export async function syncLinkedInProfilePictures(
  config: DownloadConfig = DEFAULT_DOWNLOAD_CONFIG
): Promise<void> {
  console.log('🔄 Starting LinkedIn profile picture synchronization...')
  console.log(`Configuration:
  - Max retries: ${config.maxRetries}
  - Timeout: ${config.timeout}ms
  - Concurrency: ${config.concurrency}
  `)

  try {
    // Ensure output directory exists
    await ensureDirectory('public/images/guests')

    // Parse all guest files
    console.log('📖 Parsing guest files...')
    const guests = await parseAllGuests()

    if (guests.length === 0) {
      console.log('ℹ️  No guests with LinkedIn profile pictures found')
      return
    }

    // Process all guest images
    const results = await processAllGuests(guests, config)

    // Generate and save report
    const report = generateReport(results)
    await fs.writeFile('linkedin-profile-sync-report.md', report)

    // Summary
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success && !r.skipped).length
    const skipped = results.filter(r => r.skipped).length

    console.log('\n✅ LinkedIn profile picture synchronization completed!')
    console.log(`📊 Results: ${successful} downloaded, ${failed} failed, ${skipped} skipped`)
    console.log('📄 Report saved to: linkedin-profile-sync-report.md')

  } catch (error) {
    console.error('❌ LinkedIn profile picture synchronization failed:', error)
    throw error
  }
}

/**
 * CLI entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const customConfig: Partial<DownloadConfig> = {}

  // Parse command line arguments
  const args = process.argv.slice(2)
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '')
    const value = args[i + 1]

    switch (key) {
      case 'max-retries':
        customConfig.maxRetries = parseInt(value, 10)
        break
      case 'timeout':
        customConfig.timeout = parseInt(value, 10)
        break
      case 'concurrency':
        customConfig.concurrency = parseInt(value, 10)
        break
    }
  }

  const finalConfig = { ...DEFAULT_DOWNLOAD_CONFIG, ...customConfig }

  syncLinkedInProfilePictures(finalConfig)
    .then(() => {
      console.log('✅ LinkedIn profile picture sync completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ LinkedIn profile picture sync failed:', error)
      process.exit(1)
    })
}