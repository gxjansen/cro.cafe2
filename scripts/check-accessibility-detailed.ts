#!/usr/bin/env tsx
/**
 * Detailed accessibility checker - provides verbose output for debugging violations
 */

import { AxePuppeteer } from '@axe-core/puppeteer'
import puppeteer from 'puppeteer'
import path from 'path'
import { promises as fs } from 'fs'
import chalk from 'chalk'

async function checkAccessibilityDetailed() {
  console.log(chalk.blue('🔍 Running detailed accessibility check...\n'))
  
  const distPath = path.join(process.cwd(), 'dist')
  
  // Check if dist directory exists
  try {
    await fs.access(distPath)
  } catch {
    console.error(chalk.red('❌ Error: dist directory not found. Please run "npm run build:no-test" first.'))
    process.exit(1)
  }
  
  // Launch puppeteer
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  // Check a single page for detailed output
  const page = await browser.newPage()
  const testFile = 'en/index.html'
  const url = `file://${path.join(distPath, testFile)}`
  
  console.log(chalk.yellow(`Checking ${testFile} in detail...\n`))
  
  try {
    await page.goto(url, { waitUntil: 'networkidle0' })
    
    // Run axe with all details
    const axe = new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .disableRules(['color-contrast'])
    
    const axeResults = await axe.analyze()
    
    if (axeResults.violations.length > 0) {
      console.log(chalk.red(`Found ${axeResults.violations.length} violations:\n`))
      
      for (const violation of axeResults.violations) {
        console.log(chalk.red(`\n━━━ ${violation.id} ━━━`))
        console.log(chalk.yellow(`Description: ${violation.description}`))
        console.log(chalk.yellow(`Impact: ${violation.impact}`))
        console.log(chalk.yellow(`Help: ${violation.help}`))
        console.log(chalk.cyan(`Learn more: ${violation.helpUrl}\n`))
        
        console.log(chalk.magenta(`Affected elements (${violation.nodes.length}):`))
        
        for (const node of violation.nodes.slice(0, 3)) { // Show first 3
          console.log(chalk.gray('\n  Element:'))
          console.log(chalk.gray(`  - Selector: ${node.target.join(' ')}`))
          console.log(chalk.gray(`  - HTML: ${node.html.substring(0, 100)}...`))
          
          if (node.failureSummary) {
            console.log(chalk.red(`  - Issue: ${node.failureSummary}`))
          }
          
          // For target-size violations, show the actual size
          if (violation.id === 'target-size' && node.any) {
            const sizeCheck = node.any.find(check => check.id === 'target-size')
            if (sizeCheck?.data) {
              console.log(chalk.yellow(`  - Current size: ${sizeCheck.data.width}x${sizeCheck.data.height}px`))
              console.log(chalk.yellow(`  - Required: 44x44px minimum`))
            }
          }
        }
        
        if (violation.nodes.length > 3) {
          console.log(chalk.gray(`\n  ... and ${violation.nodes.length - 3} more elements`))
        }
      }
      
      // Provide specific fix suggestions
      console.log(chalk.blue('\n\n💡 Fix Suggestions:'))
      
      if (axeResults.violations.find(v => v.id === 'aria-hidden-focus')) {
        console.log(chalk.green('\nFor aria-hidden-focus violations:'))
        console.log('- Remove aria-hidden="true" from parent elements that contain interactive content')
        console.log('- OR make child elements non-focusable with tabindex="-1"')
        console.log('- OR move aria-hidden to non-interactive elements only')
      }
      
      if (axeResults.violations.find(v => v.id === 'target-size')) {
        console.log(chalk.green('\nFor target-size violations:'))
        console.log('- Add CSS classes: min-w-[44px] min-h-[44px] or use the .touch-target class')
        console.log('- Increase padding: p-3 or px-3 py-3')
        console.log('- For inline links, they are exempt from this requirement')
      }
    } else {
      console.log(chalk.green('✅ No accessibility violations found!'))
    }
    
    // Also show passed checks
    console.log(chalk.blue(`\n\n✅ Passed checks: ${axeResults.passes.length}`))
    console.log(chalk.gray(axeResults.passes.map(p => `  - ${p.id}`).join('\n')))
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message)
  } finally {
    await page.close()
  }
  
  await browser.close()
}

// Run the check
checkAccessibilityDetailed().catch(error => {
  console.error(chalk.red('Fatal error:'), error)
  process.exit(1)
})