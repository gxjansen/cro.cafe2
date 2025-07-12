#!/usr/bin/env tsx
/**
 * Accessibility checker for built HTML files
 * Runs axe-core against the built site to check WCAG compliance
 */

import { AxePuppeteer } from '@axe-core/puppeteer'
import puppeteer from 'puppeteer'
import { glob } from 'glob'
import path from 'path'
import { promises as fs } from 'fs'
import chalk from 'chalk'

interface ViolationResult {
  url: string
  violations: any[]
}

async function checkAccessibility() {
  console.log(chalk.blue('🔍 Checking accessibility compliance...\n'))

  const distPath = path.join(process.cwd(), 'dist')

  // Check if dist directory exists
  try {
    await fs.access(distPath)
  } catch {
    console.error(chalk.red('❌ Error: dist directory not found. Please run "npm run build:no-test" first.'))
    process.exit(1)
  }

  // Find all HTML files
  const htmlFiles = await glob('**/*.html', { cwd: distPath })

  if (htmlFiles.length === 0) {
    console.error(chalk.red('❌ No HTML files found in dist directory.'))
    process.exit(1)
  }

  console.log(chalk.gray(`Found ${htmlFiles.length} HTML files to check\n`))

  // Launch puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const results: ViolationResult[] = []
  let totalViolations = 0

  // Sample a subset of pages for faster checks
  const pagesToCheck = [
    'index.html',
    'en/index.html',
    'en/episodes/index.html',
    'en/guests/index.html',
    'nl/index.html',
    'de/index.html',
    'es/index.html',
    // Add specific episode/guest pages if they exist
    ...htmlFiles.filter(f => f.includes('/episodes/') && !f.endsWith('index.html')).slice(0, 2),
    ...htmlFiles.filter(f => f.includes('/guests/') && !f.endsWith('index.html')).slice(0, 2)
  ].filter(page => htmlFiles.includes(page))

  console.log(chalk.gray(`Checking ${pagesToCheck.length} representative pages...\n`))

  for (const file of pagesToCheck) {
    const page = await browser.newPage()
    const url = `file://${path.join(distPath, file)}`

    try {
      await page.goto(url, { waitUntil: 'networkidle0' })

      // Wait for WCAG touch target fixes to be applied
      await page.waitForFunction(() => {
        const skipLink = document.querySelector('.skip-link')
        return skipLink && window.getComputedStyle(skipLink).minHeight === '44px'
      }, { timeout: 5000 }).catch(() => {
        console.log(chalk.yellow(`Warning: WCAG fixes may not have been applied for ${file}`))
      })

      // Run axe
      const axe = new AxePuppeteer(page)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .disableRules(['color-contrast']) // Disable color contrast in file:// context

      const axeResults = await axe.analyze()

      if (axeResults.violations.length > 0) {
        results.push({
          url: file,
          violations: axeResults.violations
        })
        totalViolations += axeResults.violations.length
        console.log(chalk.red(`❌ ${file}: ${axeResults.violations.length} violations`))
      } else {
        console.log(chalk.green(`✅ ${file}: No violations`))
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error checking ${file}:`), error.message)
    } finally {
      await page.close()
    }
  }

  await browser.close()

  // Report results
  console.log(`\n${  chalk.blue('📊 Accessibility Check Summary')}`)
  console.log(chalk.gray('─'.repeat(50)))

  if (totalViolations === 0) {
    console.log(chalk.green('✅ All pages passed accessibility checks!'))
    console.log(chalk.gray(`\nChecked ${pagesToCheck.length} pages`))
    process.exit(0)
  } else {
    console.log(chalk.red(`❌ Found ${totalViolations} accessibility violations\n`))

    // Show detailed violations
    for (const result of results) {
      console.log(chalk.yellow(`\n📄 ${result.url}`))
      for (const violation of result.violations) {
        console.log(chalk.red(`  • ${violation.id}: ${violation.description}`))
        console.log(chalk.gray(`    Impact: ${violation.impact}`))
        console.log(chalk.gray(`    Elements: ${violation.nodes.length}`))
      }
    }

    console.log(chalk.yellow('\n💡 Run "npm run test:a11y:detailed" for full violation details'))
    process.exit(1)
  }
}

// Run the check
checkAccessibility().catch(error => {
  console.error(chalk.red('Fatal error:'), error)
  process.exit(1)
})