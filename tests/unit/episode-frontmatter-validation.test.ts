import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

describe('Episode MDX Frontmatter Validation', () => {
  const REQUIRED_FIELDS = [
    'hosts',
    'guests',
    'status',
    'createdAt',
    'updatedAt',
    // 'downloads_total', // Optional - may not be present for draft episodes
    'episode_type',
    'title',
    'description',
    'pubDate',
    'season',
    'episode',
    'duration',
    'audioUrl',
    'language',
    'transistorId',
    'slug'
  ]

  let episodeFiles: string[] = []
  const episodesDir = join(process.cwd(), 'src/content/episodes')

  beforeAll(() => {
    // Recursively find all .mdx files in the episodes directory
    const findMdxFiles = (dir: string): string[] => {
      const files: string[] = []
      const items = readdirSync(dir, { withFileTypes: true })
      
      for (const item of items) {
        const fullPath = join(dir, item.name)
        if (item.isDirectory()) {
          files.push(...findMdxFiles(fullPath))
        } else if (item.isFile() && item.name.endsWith('.mdx')) {
          files.push(fullPath)
        }
      }
      
      return files
    }

    episodeFiles = findMdxFiles(episodesDir)
    
    // Ensure we have episodes to test
    if (episodeFiles.length === 0) {
      throw new Error('No episode MDX files found in src/content/episodes/')
    }
  })

  it('should validate that a random episode has all required frontmatter fields', () => {
    // Pick a random episode file
    const randomIndex = Math.floor(Math.random() * episodeFiles.length)
    const episodeFile = episodeFiles[randomIndex]
    const relativePath = episodeFile.replace(process.cwd() + '/', '')
    
    // Read and parse the file
    const fileContent = readFileSync(episodeFile, 'utf-8')
    const { data: frontmatter } = matter(fileContent)
    
    // Check for missing fields
    const missingFields: string[] = []
    
    for (const field of REQUIRED_FIELDS) {
      if (!(field in frontmatter)) {
        missingFields.push(field)
      }
    }
    
    // Assert that no fields are missing
    expect(missingFields).toEqual([], 
      `Episode file "${relativePath}" is missing the following required fields: ${missingFields.join(', ')}`
    )
  })

  it('should validate all episodes have required frontmatter fields', () => {
    const episodesWithMissingFields: Array<{ file: string; missingFields: string[] }> = []
    
    for (const episodeFile of episodeFiles) {
      const relativePath = episodeFile.replace(process.cwd() + '/', '')
      const fileContent = readFileSync(episodeFile, 'utf-8')
      const { data: frontmatter } = matter(fileContent)
      
      const missingFields: string[] = []
      
      for (const field of REQUIRED_FIELDS) {
        if (!(field in frontmatter)) {
          missingFields.push(field)
        }
      }
      
      if (missingFields.length > 0) {
        episodesWithMissingFields.push({
          file: relativePath,
          missingFields
        })
      }
    }
    
    // Create a detailed error message if any episodes are missing fields
    if (episodesWithMissingFields.length > 0) {
      const errorMessage = episodesWithMissingFields
        .map(({ file, missingFields }) => 
          `\n  - ${file}:\n    Missing fields: ${missingFields.join(', ')}`
        )
        .join('')
      
      expect(episodesWithMissingFields).toEqual([], 
        `The following episode files are missing required fields:${errorMessage}`
      )
    }
  })
})