#!/usr/bin/env tsx
/**
 * Host-specific content generator for NocoDB sync
 * Handles only host content to prevent cross-contamination
 */

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { config } from 'dotenv'
import { NocoDBWorkingClient as NocdbClient } from '../src/lib/services/nocodb-working-client'

// Load environment variables
config()

interface HostGenerationStats {
  hostsGenerated: number
  filesDeleted: number
  errors: string[]
  startTime: Date
  endTime?: Date
}

class HostGenerator {
  private client: NocdbClient
  private outputDir: string
  private stats: HostGenerationStats

  constructor(client: NocdbClient) {
    this.client = client
    this.outputDir = 'src/content/hosts'
    this.stats = {
      hostsGenerated: 0,
      filesDeleted: 0,
      errors: [],
      startTime: new Date()
    }
  }

  async generate(): Promise<HostGenerationStats> {
    console.log('🎙️ Starting host generation...')
    
    try {
      // Test connection
      const connected = await this.client.testConnection()
      if (!connected) {
        throw new Error('Failed to connect to NocoDB')
      }

      // Create output directory
      await this.ensureDirectoryExists(this.outputDir)

      // Get existing host files
      const existingFiles = await this.getExistingFiles()
      console.log(`📁 Found ${existingFiles.size} existing host files`)

      // Fetch hosts from NocoDB
      console.log('📥 Fetching hosts from NocoDB...')
      const hosts = await this.client.getHosts({ limit: 100 })
      console.log(`📊 Found ${hosts.length} hosts in NocoDB`)

      // Generate host files
      const generatedFiles = new Set<string>()
      for (const host of hosts) {
        try {
          const filePath = await this.generateHostMDX(host)
          if (filePath) {
            generatedFiles.add(filePath)
            this.stats.hostsGenerated++
          }
        } catch (error) {
          const errorMsg = `Failed to generate host ${host.Id}: ${error instanceof Error ? error.message : String(error)}`
          this.stats.errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      // Delete orphaned files
      const filesToDelete = Array.from(existingFiles).filter(file => !generatedFiles.has(file))
      if (filesToDelete.length > 0) {
        console.log(`🗑️ Found ${filesToDelete.length} orphaned host files to delete`)
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file)
            this.stats.filesDeleted++
            console.log(`  - Deleted: ${file}`)
          } catch (error) {
            console.error(`Failed to delete ${file}:`, error)
          }
        }
      }

      this.stats.endTime = new Date()
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime()
      
      console.log(`✅ Host generation complete in ${duration}ms`)
      console.log(`✅ Generated ${this.stats.hostsGenerated} hosts`)
      
      if (this.stats.filesDeleted > 0) {
        console.log(`🗑️ Deleted ${this.stats.filesDeleted} orphaned files`)
      }
      
      if (this.stats.errors.length > 0) {
        console.log(`⚠️ ${this.stats.errors.length} errors occurred`)
      }

    } catch (error) {
      this.stats.errors.push(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
      console.error('❌ Host generation failed:', error)
    }

    return this.stats
  }

  private async generateHostMDX(host: any): Promise<string> {
    if (!host.slug && !host.name) {
      throw new Error('Host missing both slug and name - cannot generate file')
    }
    
    const slug = host.slug || host.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const hostPath = join(this.outputDir, `${slug}.mdx`)

    const frontmatter = this.generateHostFrontmatter(host, slug)
    const content = host.bio || ''
    const mdxContent = `---\n${frontmatter}\n---\n\n${content}`

    console.log(`📝 Creating host: ${slug}`)

    await fs.writeFile(hostPath, mdxContent, 'utf8')
    
    return hostPath
  }

  private generateHostFrontmatter(host: any, slug: string): string {
    const episodes = Array.isArray(host.Episodes) ? host.Episodes.map((e: any) => e.slug || e.Id) : []
    
    // Handle LinkedIn field
    let linkedinValue = ''
    if (host.linkedin || host.LinkedIn) {
      const linkedin = host.linkedin || host.LinkedIn
      linkedinValue = linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`
    }
    
    // Create social links array
    const socialLinks = []
    if (host.website || host.Website) {
      socialLinks.push({ platform: 'website', url: host.website || host.Website })
    }
    if (host.twitter || host.Twitter) {
      const twitter = host.twitter || host.Twitter
      const twitterUrl = twitter.startsWith('http') ? twitter : `https://twitter.com/${twitter.replace('@', '')}`
      socialLinks.push({ platform: 'twitter', url: twitterUrl })
    }
    if (linkedinValue) {
      socialLinks.push({ platform: 'linkedin', url: linkedinValue })
    }

    // Handle image URL
    let imageUrlField = ''
    if (host.image_url) {
      if (this.isValidUrl(host.image_url)) {
        imageUrlField = `imageUrl: "${host.image_url}"`
      } else if (host.image_url && typeof host.image_url === 'string') {
        if (host.image_url.startsWith('/images/hosts/')) {
          imageUrlField = `imageUrl: "${host.image_url}"`
        } else {
          imageUrlField = `imageUrl: "/images/hosts/${host.image_url}"`
        }
      }
    }

    return [
      `name: "${this.escapeYaml(host.name || '')}"`,
      `slug: "${slug}"`,
      `bio: "${this.escapeYaml(host.bio || '')}"`,
      host.company ? `company: "${this.escapeYaml(host.company)}"` : '',
      host.title ? `title: "${this.escapeYaml(host.title)}"` : '',
      host.role ? `role: "${this.escapeYaml(host.role)}"` : '',
      imageUrlField,
      linkedinValue ? `linkedin: "${linkedinValue}"` : '',
      `episodes: [${episodes.map((e: string) => `"${e}"`).join(', ')}]`,
      `socialLinks: ${JSON.stringify(socialLinks)}`,
      `createdAt: ${new Date(host.CreatedAt || Date.now()).toISOString()}`,
      `updatedAt: ${new Date(host.UpdatedAt || Date.now()).toISOString()}`
    ].filter(Boolean).join('\n')
  }

  private async getExistingFiles(): Promise<Set<string>> {
    const files = new Set<string>()
    try {
      const entries = await fs.readdir(this.outputDir)
      for (const entry of entries) {
        if (entry.endsWith('.mdx')) {
          files.add(join(this.outputDir, entry))
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
    return files
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

  private isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private escapeYaml(str: string): string {
    if (!str) return ''
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
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

    const generator = new HostGenerator(client)
    const stats = await generator.generate()

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
if (require.main === module) {
  main()
}