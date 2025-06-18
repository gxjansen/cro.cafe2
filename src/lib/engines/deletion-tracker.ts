import { promises as fs } from 'fs'
import { join } from 'path'

/**
 * Tracks content deletions by comparing NocoDB records with existing files
 */
export class DeletionTracker {
  private contentDir: string
  
  constructor(contentDir: string = 'src/content') {
    this.contentDir = contentDir
  }
  
  /**
   * Get a map of all content files indexed by their ID
   */
  async getExistingContentMap(): Promise<Map<string, string>> {
    const contentMap = new Map<string, string>()
    
    // Map episode files by ID
    const episodeDirs = ['en', 'nl', 'de', 'es']
    for (const lang of episodeDirs) {
      const files = await this.getFilesRecursively(join(this.contentDir, 'episodes', lang), '.mdx')
      for (const file of files) {
        // Extract ID from filename pattern: episode-XXX-slug.mdx
        const match = file.match(/episode-(\d+)-.*\.mdx$/)
        if (match) {
          const id = parseInt(match[1])
          contentMap.set(`episode-${id}`, file)
        }
      }
    }
    
    // Map guest files by slug
    const guestFiles = await this.getFilesRecursively(join(this.contentDir, 'guests'), '.mdx')
    for (const file of guestFiles) {
      const filename = file.split('/').pop()!
      const slug = filename.replace('.mdx', '')
      contentMap.set(`guest-${slug}`, file)
    }
    
    // Map host files by slug
    const hostFiles = await this.getFilesRecursively(join(this.contentDir, 'hosts'), '.mdx')
    for (const file of hostFiles) {
      const filename = file.split('/').pop()!
      const slug = filename.replace('.mdx', '')
      contentMap.set(`host-${slug}`, file)
    }
    
    // Map platform files by ID or slug
    const platformFiles = await this.getFilesRecursively(join(this.contentDir, 'platforms'), '.json')
    for (const file of platformFiles) {
      const filename = file.split('/').pop()!
      const slug = filename.replace('.json', '')
      
      // Handle both platform-XX.json and slug.json patterns
      if (slug.startsWith('platform-')) {
        const id = slug.replace('platform-', '')
        contentMap.set(`platform-${id}`, file)
      } else {
        contentMap.set(`platform-${slug}`, file)
      }
    }
    
    return contentMap
  }
  
  /**
   * Compare existing files with active records and return files to delete
   */
  async getFilesToDelete(
    existingFiles: Map<string, string>,
    activeRecords: {
      episodes: Array<{ Id: number; episode_number?: number }>
      guests: Array<{ Id: number; slug?: string; name?: string }>
      hosts: Array<{ Id: number; slug?: string; name?: string }>
      platforms: Array<{ Id: number; slug?: string }>
    }
  ): Promise<string[]> {
    const filesToDelete: string[] = []
    const activeKeys = new Set<string>()
    
    // Build set of active content keys
    for (const episode of activeRecords.episodes) {
      const episodeNum = episode.episode_number || episode.Id
      activeKeys.add(`episode-${episodeNum}`)
    }
    
    for (const guest of activeRecords.guests) {
      // Use same slug generation logic as content generator
      const slug = guest.slug || (guest.name ? this.generateSlug(guest.name) : `guest-${guest.Id}`)
      activeKeys.add(`guest-${slug}`)
    }
    
    for (const host of activeRecords.hosts) {
      // Use same slug generation logic as content generator
      const slug = host.slug || (host.name ? this.generateSlug(host.name) : `host-${host.Id}`)
      activeKeys.add(`host-${slug}`)
    }
    
    for (const platform of activeRecords.platforms) {
      activeKeys.add(`platform-${platform.Id}`)
      if (platform.slug) {
        activeKeys.add(`platform-${platform.slug}`)
      }
    }
    
    // Find files that don't have corresponding active records
    for (const [key, filePath] of existingFiles) {
      if (!activeKeys.has(key)) {
        filesToDelete.push(filePath)
      }
    }
    
    return filesToDelete
  }
  
  /**
   * Delete files that no longer have corresponding NocoDB records
   */
  async deleteOrphanedFiles(filesToDelete: string[]): Promise<number> {
    let deletedCount = 0
    
    for (const file of filesToDelete) {
      try {
        // Check if file exists before deleting
        await fs.access(file)
        await fs.unlink(file)
        console.log(`🗑️ Deleted: ${file}`)
        deletedCount++
      } catch (error) {
        if ((error as any).code !== 'ENOENT') {
          console.error(`❌ Failed to delete ${file}:`, error)
        }
      }
    }
    
    // Clean up empty directories
    await this.cleanupEmptyDirectories()
    
    return deletedCount
  }
  
  /**
   * Generate slug from name using same logic as content generator
   */
  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  /**
   * Remove empty season directories
   */
  private async cleanupEmptyDirectories(): Promise<void> {
    const episodeDirs = ['en', 'nl', 'de', 'es']
    
    for (const lang of episodeDirs) {
      const langDir = join(this.contentDir, 'episodes', lang)
      
      try {
        const seasons = await fs.readdir(langDir)
        
        for (const season of seasons) {
          if (season.startsWith('season-')) {
            const seasonDir = join(langDir, season)
            const files = await fs.readdir(seasonDir)
            
            if (files.length === 0) {
              await fs.rmdir(seasonDir)
              console.log(`🗑️ Removed empty directory: ${seasonDir}`)
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist, ignore
      }
    }
  }
  
  private async getFilesRecursively(dir: string, extension: string): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory()) {
          const subFiles = await this.getFilesRecursively(fullPath, extension)
          files.push(...subFiles)
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      // Directory doesn't exist, return empty array
    }
    
    return files
  }
}