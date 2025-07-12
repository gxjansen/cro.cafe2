#!/usr/bin/env tsx

/**
 * Verify Critical Files Script
 * 
 * This script ensures that all critical workflow and npm scripts are properly
 * tracked in git and not accidentally ignored by .gitignore
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Define critical files that must be tracked in git
const CRITICAL_FILES = {
  // GitHub Actions workflow scripts
  workflows: [
    'scripts/generate-episodes.ts',
    'scripts/generate-guests.ts', 
    'scripts/generate-hosts.ts',
    'scripts/generate-platforms.ts',
    'scripts/sync-linkedin-profile-pictures.ts',
    'scripts/sync-images.ts'
  ],
  
  // npm run scripts from package.json
  npmScripts: [
    'scripts/validate-content.ts',
    'scripts/check-links.js',
    'scripts/check-accessibility.ts',
    'scripts/check-accessibility-detailed.ts',
    'scripts/optimize-episode-seo.ts',
    'scripts/validate-schema.ts'
  ],
  
  // Content generation variants
  contentGeneration: [
    'scripts/generate-content.ts',
    'scripts/generate-content-simple.ts',
    'scripts/generate-content-robust.ts',
    'scripts/generate-content-final.ts',
    'scripts/generate-language-sitemaps.ts'
  ]
}

interface ValidationResult {
  file: string
  exists: boolean
  tracked: boolean
  ignored: boolean
  category: string
}

function checkFileStatus(filePath: string): { tracked: boolean; ignored: boolean } {
  try {
    // Check if file is tracked in git
    execSync(`git ls-files --error-unmatch "${filePath}"`, { stdio: 'ignore' })
    return { tracked: true, ignored: false }
  } catch {
    // File is not tracked, check if it's ignored
    try {
      const result = execSync(`git check-ignore "${filePath}"`, { stdio: 'pipe' }).toString()
      return { tracked: false, ignored: true }
    } catch {
      // File is neither tracked nor ignored (might not exist)
      return { tracked: false, ignored: false }
    }
  }
}

function validateCriticalFiles(): ValidationResult[] {
  const results: ValidationResult[] = []
  
  for (const [category, files] of Object.entries(CRITICAL_FILES)) {
    for (const file of files) {
      const exists = existsSync(file)
      const { tracked, ignored } = checkFileStatus(file)
      
      results.push({
        file,
        exists,
        tracked,
        ignored,
        category
      })
    }
  }
  
  return results
}

function main() {
  console.log('🔍 Verifying Critical Files Status')
  console.log('==================================\n')
  
  const results = validateCriticalFiles()
  const problems: ValidationResult[] = []
  
  // Group results by category
  for (const [category, files] of Object.entries(CRITICAL_FILES)) {
    console.log(`📂 ${category}:`)
    
    const categoryResults = results.filter(r => r.category === category)
    
    for (const result of categoryResults) {
      const status = []
      
      if (!result.exists) {
        status.push('❌ MISSING')
        problems.push(result)
      } else {
        status.push('✅ exists')
      }
      
      if (result.tracked) {
        status.push('✅ tracked')
      } else if (result.ignored) {
        status.push('⚠️  IGNORED')
        problems.push(result)
      } else if (result.exists) {
        status.push('⚠️  untracked')
        problems.push(result)
      }
      
      console.log(`  ${result.file}: ${status.join(', ')}`)
    }
    console.log()
  }
  
  // Summary
  console.log('📊 Summary')
  console.log('==========')
  console.log(`Total files checked: ${results.length}`)
  console.log(`Files with issues: ${problems.length}`)
  
  if (problems.length > 0) {
    console.log('\n⚠️  Issues Found:')
    console.log('================')
    
    const missing = problems.filter(p => !p.exists)
    const ignored = problems.filter(p => p.exists && p.ignored)
    const untracked = problems.filter(p => p.exists && !p.tracked && !p.ignored)
    
    if (missing.length > 0) {
      console.log('\n❌ Missing files:')
      missing.forEach(p => console.log(`  - ${p.file}`))
    }
    
    if (ignored.length > 0) {
      console.log('\n⚠️  Files ignored by .gitignore:')
      ignored.forEach(p => console.log(`  - ${p.file}`))
      console.log('\nTo fix: Check .gitignore and add exceptions for these files')
    }
    
    if (untracked.length > 0) {
      console.log('\n⚠️  Untracked files:')
      untracked.forEach(p => console.log(`  - ${p.file}`))
      console.log('\nTo fix: Run "git add" for these files')
    }
    
    // Check .gitignore for problematic patterns
    console.log('\n🔍 Checking .gitignore for problematic patterns...')
    const gitignoreContent = readFileSync('.gitignore', 'utf-8')
    const problematicPatterns = [
      'scripts/generate-*.ts',
      'scripts/sync-*.ts',
      'scripts/validate-*.ts',
      'scripts/check-*.ts',
      'scripts/optimize-*.ts'
    ]
    
    const foundPatterns = problematicPatterns.filter(pattern => 
      gitignoreContent.includes(pattern) && !gitignoreContent.includes(`!${pattern.replace('*', '')}`)
    )
    
    if (foundPatterns.length > 0) {
      console.log('\n⚠️  Overly broad .gitignore patterns found:')
      foundPatterns.forEach(p => console.log(`  - ${p}`))
      console.log('\nThese patterns might ignore critical scripts!')
    }
    
    process.exit(1)
  } else {
    console.log('\n✅ All critical files are properly tracked!')
  }
}

// Run the validation
main()