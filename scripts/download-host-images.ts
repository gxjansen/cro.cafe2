#!/usr/bin/env tsx
/**
 * Download host images from NocoDB attachments
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import { NocoDBWorkingClient as NocdbClient } from '../src/lib/services/nocodb-working-client'

// Load environment variables
config()

interface DownloadStats {
  imagesDownloaded: number
  errors: string[]
  skipped: number
}

class HostImageDownloader {
  private client: NocdbClient
  private outputDir: string
  private stats: DownloadStats

  constructor(client: NocdbClient) {
    this.client = client
    this.outputDir = 'public/images/hosts'
    this.stats = {
      imagesDownloaded: 0,
      errors: [],
      skipped: 0
    }
  }

  async download(): Promise<DownloadStats> {
    console.log('📸 Starting host image download...')

    try {
      // Test connection
      const connected = await this.client.testConnection()
      if (!connected) {
        throw new Error('Failed to connect to NocoDB')
      }

      // Create output directory
      await this.ensureDirectoryExists(this.outputDir)

      // Fetch hosts from NocoDB
      console.log('📥 Fetching hosts from NocoDB...')
      const hosts = await this.client.getHosts({ limit: 100 })
      console.log(`📊 Found ${hosts.length} hosts`)

      // Process each host
      for (const host of hosts) {
        if (host.picture && Array.isArray(host.picture) && host.picture.length > 0) {
          const attachment = host.picture[0]
          const filename = attachment.title || attachment.path?.split('/').pop()
          
          if (filename && attachment.path) {
            console.log(`\n📥 Processing ${host.name} - ${filename}`)
            
            try {
              // Pass the full attachment object to construct URL
              const imageUrl = this.constructImageUrl(attachment)
              await this.downloadImage(imageUrl, filename, host.name)
              this.stats.imagesDownloaded++
            } catch (error) {
              const errorMsg = `Failed to download image for ${host.name}: ${error}`
              this.stats.errors.push(errorMsg)
              console.error(`❌ ${errorMsg}`)
            }
          }
        } else if (host.image_url && !host.image_url.startsWith('http')) {
          console.log(`⏭️  Skipping ${host.name} - uses local image path: ${host.image_url}`)
          this.stats.skipped++
        } else {
          console.log(`⏭️  Skipping ${host.name} - no picture attachment`)
          this.stats.skipped++
        }
      }

      console.log('\n✅ Host image download complete!')
      console.log(`📊 Downloaded: ${this.stats.imagesDownloaded}, Skipped: ${this.stats.skipped}, Errors: ${this.stats.errors.length}`)

    } catch (error) {
      this.stats.errors.push(`Fatal error: ${error}`)
      console.error('❌ Fatal error:', error)
    }

    return this.stats
  }

  private async downloadImage(url: string, filename: string, hostName: string): Promise<void> {
    const outputPath = join(this.outputDir, filename)
    
    // Check if file already exists
    try {
      await fs.access(outputPath)
      console.log(`✓ File already exists: ${filename}`)
      return
    } catch {
      // File doesn't exist, proceed with download
    }

    console.log(`⬇️  Downloading from: ${url}`)
    
    // Get API key from client config for authentication
    const config = (this.client as any).config
    const response = await fetch(url, {
      headers: {
        'xc-token': config.apiKey
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    await fs.writeFile(outputPath, Buffer.from(buffer))
    
    console.log(`✅ Saved to: ${outputPath}`)
  }

  private constructImageUrl(attachment: any): string {
    // Access the private config property
    const config = (this.client as any).config
    const baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    
    // NocoDB attachments can have different URL formats
    // For now, we'll use the signedPath which we know works
    // Even though it might expire, it's better than failing
    
    // Use signedPath if available - it's a temporary URL but it works
    if (attachment.signedPath) {
      // signedPath is relative, needs base URL
      return `${baseUrl}/${attachment.signedPath}`
    }
    
    // Fallback to signedUrl if available
    if (attachment.signedUrl) {
      return attachment.signedUrl
    }
    
    // Try url field
    if (attachment.url) {
      // If it's already a full URL, use it
      if (attachment.url.startsWith('http')) {
        return attachment.url
      }
      // Otherwise prepend base URL
      return `${baseUrl}${attachment.url.startsWith('/') ? '' : '/'}${attachment.url}`
    }
    
    // Last resort - try to use path directly (though this seems to give 404s)
    if (attachment.path) {
      // Try without /api/v1 prefix - just base URL + path
      const apiPath = attachment.path.startsWith('/') ? attachment.path : `/${attachment.path}`
      return `${baseUrl}${apiPath}`
    }
    
    throw new Error('No valid URL found in attachment')
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      if ((error as any).code !== 'EEXIST') {
        throw error
      }
    }
  }
}

// Main execution
async function main() {
  try {
    const apiKey = process.env.NOCODB_API_KEY
    const baseUrl = process.env.NOCODB_BASE_URL
    const baseId = process.env.NOCODB_BASE_ID

    if (!apiKey || !baseUrl || !baseId) {
      throw new Error('Missing required environment variables: NOCODB_API_KEY, NOCODB_BASE_URL, NOCODB_BASE_ID')
    }

    const client = new NocdbClient({
      apiKey,
      baseUrl,
      baseId
    })

    const downloader = new HostImageDownloader(client)
    const stats = await downloader.download()

    // Exit with error if there were any errors
    if (stats.errors.length > 0) {
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}