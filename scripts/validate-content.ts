#!/usr/bin/env tsx

/**
 * Content Validation Script
 * Validates the generated content files without relying on Astro runtime
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'

interface ValidationResult {
  collection: string
  valid: number
  invalid: number
  errors: string[]
}

async function validateMDXFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')

    // Check if file has frontmatter
    if (!content.startsWith('---')) {
      return { valid: false, error: 'Missing frontmatter' }
    }

    // Extract frontmatter
    const frontmatterEnd = content.indexOf('---', 3)
    if (frontmatterEnd === -1) {
      return { valid: false, error: 'Invalid frontmatter' }
    }

    const frontmatterContent = content.substring(3, frontmatterEnd).trim()

    // Parse YAML frontmatter
    try {
      const data = parse(frontmatterContent)

      // Basic validation based on file type
      const fileName = filePath.split('/').pop()

      if (filePath.includes('/episodes/')) {
        // Validate episode required fields
        const required = ['title', 'language', 'pubDate', 'hosts']
        const missing = required.filter(field => !data[field])
        if (missing.length > 0) {
          return { valid: false, error: `Missing required fields: ${missing.join(', ')}` }
        }
      } else if (filePath.includes('/guests/')) {
        // Validate guest required fields
        const required = ['name', 'languages', 'episodes']
        const missing = required.filter(field => !data[field])
        if (missing.length > 0) {
          return { valid: false, error: `Missing required fields: ${missing.join(', ')}` }
        }
      }

      return { valid: true }
    } catch (yamlError) {
      return { valid: false, error: `Invalid YAML: ${yamlError}` }
    }
  } catch (error) {
    return { valid: false, error: `File read error: ${error}` }
  }
}

async function validateJSONFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    JSON.parse(content)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Invalid JSON: ${error}` }
  }
}

async function validateCollection(collectionPath: string, extension: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    collection: collectionPath.split('/').pop() || 'unknown',
    valid: 0,
    invalid: 0,
    errors: []
  }

  try {
    // Check if directory exists
    try {
      await fs.access(collectionPath)
    } catch {
      // Directory doesn't exist - this is ok for some collections
      console.log(`⚠️  ${result.collection} directory not found (this may be expected)`)
      return result
    }

    // Read all files recursively
    const files: string[] = []

    async function readDir(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          await readDir(fullPath)
        } else if (entry.name.endsWith(extension)) {
          files.push(fullPath)
        }
      }
    }

    await readDir(collectionPath)

    // Validate each file
    for (const file of files) {
      const validation = extension === '.mdx'
        ? await validateMDXFile(file)
        : await validateJSONFile(file)

      if (validation.valid) {
        result.valid++
      } else {
        result.invalid++
        result.errors.push(`${file}: ${validation.error}`)
      }
    }
  } catch (error) {
    result.errors.push(`Failed to read collection: ${error}`)
  }

  return result
}

async function validateAllContent() {
  console.log('🔍 Validating content collections...\n')

  const contentDir = join(process.cwd(), 'src/content')

  // Define collections to validate
  const collections = [
    { path: join(contentDir, 'episodes'), extension: '.mdx' },
    { path: join(contentDir, 'guests'), extension: '.mdx' },
    { path: join(contentDir, 'hosts'), extension: '.mdx' },
    { path: join(contentDir, 'platforms'), extension: '.json' }
  ]

  const results: ValidationResult[] = []
  let hasErrors = false

  for (const collection of collections) {
    console.log(`Validating ${collection.path.split('/').pop()} collection...`)
    const result = await validateCollection(collection.path, collection.extension)
    results.push(result)

    if (result.invalid > 0) {
      hasErrors = true
      console.log(`❌ ${result.collection}: ${result.valid} valid, ${result.invalid} invalid`)

      // Show first 5 errors
      const errorSample = result.errors.slice(0, 5)
      errorSample.forEach(error => console.log(`   - ${error}`))

      if (result.errors.length > 5) {
        console.log(`   ... and ${result.errors.length - 5} more errors`)
      }
    } else {
      console.log(`✅ ${result.collection}: ${result.valid} valid entries`)
    }
  }

  console.log('\n📊 Validation Summary:')
  console.log('─'.repeat(50))

  let totalValid = 0
  let totalInvalid = 0

  results.forEach(result => {
    totalValid += result.valid
    totalInvalid += result.invalid
    console.log(`${result.collection.padEnd(15)} ${result.valid} valid, ${result.invalid} invalid`)
  })

  console.log('─'.repeat(50))
  console.log(`Total:          ${totalValid} valid, ${totalInvalid} invalid`)

  if (hasErrors) {
    console.log('\n❌ Content validation failed!')
    process.exit(1)
  } else {
    console.log('\n✅ All content validation passed!')
  }
}

// Run validation
validateAllContent().catch(error => {
  console.error('❌ Validation script error:', error)
  process.exit(1)
})