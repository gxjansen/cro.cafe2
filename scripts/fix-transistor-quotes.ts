#!/usr/bin/env tsx
/**
 * Fix transistorId quotes in episode MDX files
 * This script ensures all transistorId values are properly quoted strings
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import * as path from 'path'
import matter from 'gray-matter'

async function findMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  const items = await fs.readdir(dir, { withFileTypes: true })
  
  for (const item of items) {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      files.push(...await findMdxFiles(fullPath))
    } else if (item.isFile() && item.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }
  
  return files
}

async function fixEpisodeFile(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    
    // Check if the file has unquoted transistorId
    const unquotedMatch = content.match(/^transistorId:\s*(\d+)\s*$/m)
    if (!unquotedMatch) {
      return false // Already fixed or doesn't have the issue
    }
    
    // Replace unquoted transistorId with quoted version
    const fixedContent = content.replace(
      /^transistorId:\s*(\d+)\s*$/m,
      'transistorId: "$1"'
    )
    
    // Write the fixed content back
    await fs.writeFile(filePath, fixedContent, 'utf-8')
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`)
    return true
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error)
    return false
  }
}

async function main() {
  console.log('🔧 Fixing transistorId quotes in episode files...')
  console.log('===========================================')
  
  const episodesDir = join(process.cwd(), 'src/content/episodes')
  
  try {
    // Find all MDX files
    const files = await findMdxFiles(episodesDir)
    console.log(`📁 Found ${files.length} episode files`)
    
    // Fix each file
    let fixedCount = 0
    for (const file of files) {
      if (await fixEpisodeFile(file)) {
        fixedCount++
      }
    }
    
    console.log(`\n✨ Fixed ${fixedCount} files`)
    
    if (fixedCount === 0) {
      console.log('All files already have properly quoted transistorId values!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)