#!/usr/bin/env tsx
import { promises as fs } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

/**
 * Script to clean HTML comments from existing MDX files
 * This removes <!-- --> style comments that cause MDX parsing errors
 */

async function cleanMDXFile(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    
    // Check if file contains HTML comments
    if (!content.includes('<!--')) {
      return false
    }
    
    // Remove HTML comments from the entire file
    const cleanedContent = content.replace(/<!--[\s\S]*?-->/g, '')
    
    // Write back the cleaned content
    await fs.writeFile(filePath, cleanedContent, 'utf8')
    
    console.log(`✅ Cleaned: ${filePath}`)
    return true
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error)
    return false
  }
}

async function main() {
  console.log('🧹 Cleaning HTML comments from MDX files...\n')
  
  // Find all MDX files in the content directory
  const mdxFiles = await glob('src/content/**/*.mdx')
  
  console.log(`Found ${mdxFiles.length} MDX files to check\n`)
  
  let cleanedCount = 0
  let errorCount = 0
  
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