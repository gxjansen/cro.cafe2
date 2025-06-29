#!/usr/bin/env tsx
import { promises as fs } from 'fs'
import { glob } from 'glob'

/**
 * Script to clean HTML tags from existing MDX files
 * Converts HTML to markdown-compatible format
 */

function cleanHtmlContent(html: string): string {
  if (!html) {return ''}
  // Basic HTML to markdown conversion
  return html
    // Remove HTML comments first
    .replace(/<!--[\s\S]*?-->/g, '')
    // Convert lists to markdown
    .replace(/<ul>/g, '\n')
    .replace(/<\/ul>/g, '\n')
    .replace(/<ol>/g, '\n')
    .replace(/<\/ol>/g, '\n')
    .replace(/<li>/g, '- ')
    .replace(/<\/li>/g, '\n')
    // Convert other HTML tags
    .replace(/<div>/g, '')
    .replace(/<\/div>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    // Handle inline styles and attributes
    .replace(/<(\w+)([^>]*)>/g, '<$1>') // Remove attributes from tags
    // Convert strong/bold
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<b>/g, '**')
    .replace(/<\/b>/g, '**')
    // Convert emphasis/italic
    .replace(/<em>/g, '*')
    .replace(/<\/em>/g, '*')
    .replace(/<i>/g, '*')
    .replace(/<\/i>/g, '*')
    // Remove any remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function cleanMDXFile(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf8')

    // Check if file contains HTML tags in the body (not in frontmatter)
    const frontmatterEnd = content.indexOf('---', 3)
    if (frontmatterEnd === -1) {return false}

    const bodyContent = content.substring(frontmatterEnd + 4)
    if (!bodyContent.match(/<[^>]+>/)) {
      return false
    }

    // Split frontmatter and body
    const frontmatter = content.substring(0, frontmatterEnd + 3)

    // Clean the body content
    const cleanedBody = cleanHtmlContent(bodyContent)

    // Reconstruct the file
    const newContent = `${frontmatter  }\n\n${  cleanedBody}`

    // Write back the cleaned content
    await fs.writeFile(filePath, newContent, 'utf8')

    console.log(`✅ Cleaned: ${filePath}`)
    return true
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error)
    return false
  }
}

async function main() {
  console.log('🧹 Cleaning HTML tags from MDX files...\n')

  // Find all MDX files in the content directory
  const mdxFiles = await glob('src/content/**/*.mdx')

  console.log(`Found ${mdxFiles.length} MDX files to check\n`)

  let cleanedCount = 0
  const errorCount = 0

  for (const file of mdxFiles) {
    const wasCleaned = await cleanMDXFile(file)
    if (wasCleaned) {
      cleanedCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`- Total MDX files: ${mdxFiles.length}`)
  console.log(`- Files cleaned: ${cleanedCount}`)
  console.log(`- Files with errors: ${errorCount}`)
  console.log(`- Files already clean: ${mdxFiles.length - cleanedCount - errorCount}`)
}

// Run the script
main().catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})