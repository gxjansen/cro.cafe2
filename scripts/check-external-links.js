#!/usr/bin/env node

/**
 * External Link Checker Configuration
 * 
 * This script configures and runs external link validation.
 * The astro-broken-link-checker integration handles most of the work,
 * but this script allows for manual external link checking when needed.
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const logFile = join(rootDir, 'broken-links.log')

// Check if the broken links log exists
if (existsSync(logFile)) {
  console.log(chalk.blue('📋 Reading broken links report...\n'))
  
  const logContent = readFileSync(logFile, 'utf-8')
  const lines = logContent.split('\n').filter(line => line.trim())
  
  let hasExternalErrors = false
  let externalErrorCount = 0
  
  // Parse the log file for external link errors
  lines.forEach(line => {
    if (line.includes('http://') || line.includes('https://')) {
      if (line.includes('404') || line.includes('failed') || line.includes('error')) {
        hasExternalErrors = true
        externalErrorCount++
        console.log(chalk.red(`❌ ${line.trim()}`))
      }
    }
  })
  
  if (hasExternalErrors) {
    console.log(chalk.red(`\n❌ Found ${externalErrorCount} broken external links!`))
    console.log(chalk.yellow('Please review the broken-links.log file for full details.\n'))
    process.exit(1)
  } else {
    console.log(chalk.green('✅ No broken external links found!\n'))
    process.exit(0)
  }
} else {
  console.log(chalk.yellow('⚠️  No broken-links.log file found.'))
  console.log(chalk.gray('Run "npm run build" first to generate the link report.\n'))
  process.exit(1)
}