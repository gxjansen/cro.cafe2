#!/usr/bin/env tsx

/**
 * Verify that the deduplication fix is working by checking generated episode files
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'

async function verifyDeduplication() {
  console.log('🔍 Verifying deduplication in episode files...\n')

  const contentDir = join(process.cwd(), 'src/content/episodes')
  const issues: string[] = []
  let filesChecked = 0
  let duplicatesFound = 0

  // Function to check for duplicates in an array
  function hasDuplicates(arr: string[]): boolean {
    return arr.length !== new Set(arr).size
  }

  // Function to find all MDX files recursively
  async function findMdxFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files = await Promise.all(entries.map((entry) => {
      const res = join(dir, entry.name)
      return entry.isDirectory() ? findMdxFiles(res) : res
    }))
    return files.flat().filter(f => f.endsWith('.mdx'))
  }

  try {
    const mdxFiles = await findMdxFiles(contentDir)

    for (const file of mdxFiles) {
      filesChecked++
      const content = await fs.readFile(file, 'utf-8')

      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      if (!frontmatterMatch) {continue}

      const frontmatter = frontmatterMatch[1]

      // Extract hosts and guests arrays
      const hostsMatch = frontmatter.match(/hosts: \[(.*?)\]/)
      const guestsMatch = frontmatter.match(/guests: \[(.*?)\]/)

      if (hostsMatch) {
        const hosts = hostsMatch[1].split(',').map(h => h.trim().replace(/"/g, '')).filter(h => h)
        if (hasDuplicates(hosts)) {
          duplicatesFound++
          issues.push(`${file}: Duplicate hosts found: [${hosts.join(', ')}]`)
        }
      }

      if (guestsMatch) {
        const guests = guestsMatch[1].split(',').map(g => g.trim().replace(/"/g, '')).filter(g => g)
        if (hasDuplicates(guests)) {
          duplicatesFound++
          issues.push(`${file}: Duplicate guests found: [${guests.join(', ')}]`)
        }
      }
    }

    console.log(`✅ Checked ${filesChecked} episode files`)
    console.log(`${duplicatesFound > 0 ? '❌' : '✅'} Found ${duplicatesFound} files with duplicates\n`)

    if (issues.length > 0) {
      console.log('Issues found:')
      issues.forEach(issue => console.log(`  - ${issue}`))
      console.log('\n⚠️  Please run the GitHub Action to regenerate content with the deduplication fix.')
    } else {
      console.log('🎉 No duplicates found! The deduplication fix is working correctly.')
    }

    // Show a sample of hosts/guests from a few files
    console.log('\n📋 Sample of hosts/guests from recent episodes:')
    const sampleFiles = mdxFiles.slice(0, 3)

    for (const file of sampleFiles) {
      const content = await fs.readFile(file, 'utf-8')
      const titleMatch = content.match(/title: "(.*?)"/)
      const hostsMatch = content.match(/hosts: \[(.*?)\]/)
      const guestsMatch = content.match(/guests: \[(.*?)\]/)

      if (titleMatch) {
        console.log(`\n  ${titleMatch[1]}`)
        if (hostsMatch) {
          console.log(`    Hosts: ${hostsMatch[1]}`)
        }
        if (guestsMatch) {
          console.log(`    Guests: ${guestsMatch[1]}`)
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

verifyDeduplication()