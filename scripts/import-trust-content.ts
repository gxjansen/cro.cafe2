import { promises as fs } from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import fetch from 'node-fetch'

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content')
const DOCS_DIR = path.join(process.cwd(), 'docs')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'images')

// Helper to download image and save locally
async function downloadImage(url: string, filename: string, folder: string): Promise<string> {
  try {
    const response = await fetch(url)
    if (!response.ok) {throw new Error(`Failed to fetch ${url}`)}

    const buffer = await response.buffer()
    const ext = path.extname(new URL(url).pathname) || '.jpg'
    const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9]/g, '-') + ext

    const targetDir = path.join(PUBLIC_DIR, folder)
    await fs.mkdir(targetDir, { recursive: true })

    const targetPath = path.join(targetDir, cleanFilename)
    await fs.writeFile(targetPath, buffer)

    return `/images/${folder}/${cleanFilename}`
  } catch (error) {
    console.error(`Failed to download image ${url}:`, error)
    return ''
  }
}

// Process quotes CSV
async function processQuotes() {
  const csvContent = await fs.readFile(path.join(DOCS_DIR, 'CRO.CAFE - Quotes.csv'), 'utf-8')
  const records = parse(csvContent, { columns: true })

  const quotesDir = path.join(CONTENT_DIR, 'quotes')
  await fs.mkdir(quotesDir, { recursive: true })

  for (const record of records) {
    if (record.Draft === 'true' || !record['Quote rich'] || !record.Name) {continue}

    const slug = record.Slug || record.Name.toLowerCase().replace(/[^a-z0-9]/g, '-')

    // Download profile picture if available
    let authorImage = ''
    if (record['Profile picture']) {
      authorImage = await downloadImage(record['Profile picture'], slug, 'testimonials')
    }

    // Extract quote text without HTML tags
    const quoteText = record['Quote rich']
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .trim()

    // Create MDX content
    const content = `---
author: "${record.Name}"
company: "${record['Job title + Company name'] || ''}"
title: "${record['Job title + Company name'] || ''}"
authorImage: "${authorImage}"
linkedin: "${record['LinkedIn URL'] || ''}"
twitter: "${record['Twitter URL'] || ''}"
type: "${record.Type || 'Listener'}"
language: "en"
featured: true
---

${quoteText}
`

    await fs.writeFile(path.join(quotesDir, `${slug}.mdx`), content)
    console.log(`Created quote: ${slug}`)
  }
}

// Process brands CSV
async function processBrands() {
  const csvContent = await fs.readFile(path.join(DOCS_DIR, 'CRO.CAFE - Brand listeners.csv'), 'utf-8')
  const records = parse(csvContent, { columns: true })

  const brandsDir = path.join(CONTENT_DIR, 'brands')
  await fs.mkdir(brandsDir, { recursive: true })

  let order = 0
  for (const record of records) {
    if (record.Draft === 'true' || !record.Name) {continue}

    const slug = record.Slug || record.Name.toLowerCase().replace(/[^a-z0-9]/g, '-')

    // Download logo if available
    let logoUrl = ''
    if (record.Logo) {
      logoUrl = await downloadImage(record.Logo, slug, 'brands')
    }

    // Create JSON content
    const brandData = {
      name: record.Name,
      logoUrl: logoUrl,
      websiteUrl: '',
      featured: true,
      order: order++,
      industry: '',
      description: ''
    }

    await fs.writeFile(
      path.join(brandsDir, `${slug}.json`),
      JSON.stringify(brandData, null, 2)
    )
    console.log(`Created brand: ${slug}`)
  }
}

// Main execution
async function main() {
  try {
    console.log('Processing quotes...')
    await processQuotes()

    console.log('\nProcessing brands...')
    await processBrands()

    console.log('\nImport completed successfully!')
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  }
}

main()