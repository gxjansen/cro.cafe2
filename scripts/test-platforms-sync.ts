#!/usr/bin/env tsx

/**
 * Test script for Platforms table synchronization
 * This script tests the complete lifecycle of platform records:
 * - Creation
 * - Update
 * - Deletion
 */

import { NocoDBWorkingClient } from '../src/lib/services/nocodb-working-client.js'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { execSync } from 'child_process'

interface TestPlatform {
  Name: string
  slug: string
  url_en: string
  url_nl?: string
  url_de?: string
  url_es?: string
  logo_url: string
  display_order: number
  is_active: boolean
}

class PlatformSyncTester {
  private client: NocoDBWorkingClient
  private testRecordId: string | null = null
  private baseDir: string

  constructor(client: NocoDBWorkingClient, baseDir: string) {
    this.client = client
    this.baseDir = baseDir
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Platforms Table Sync Tests')
    console.log('=====================================\n')

    try {
      await this.testPhaseA_Creation()
      await this.testPhaseB_Update()
      await this.testPhaseC_Deletion()
      
      console.log('\n✅ All tests completed successfully!')
    } catch (error) {
      console.error('\n❌ Test failed:', error)
      // Cleanup if test failed
      if (this.testRecordId) {
        await this.cleanupTestRecord()
      }
      throw error
    }
  }

  private async testPhaseA_Creation(): Promise<void> {
    console.log('📝 Phase A: Test File Creation')
    console.log('------------------------------')

    // Step 1: Create test platform
    const testPlatform: TestPlatform = {
      Name: 'Test Platform QA',
      slug: 'test-platform-qa',
      url_en: 'https://testplatform.example.com',
      url_nl: 'https://testplatform.example.com/nl',
      url_de: 'https://testplatform.example.com/de',
      url_es: 'https://testplatform.example.com/es',
      logo_url: 'https://example.com/icons/test-icon.png',
      display_order: 999,
      is_active: true
    }

    console.log('1. Creating test platform in NocoDB...')
    this.testRecordId = await this.createPlatform(testPlatform)
    console.log(`   ✓ Created platform with ID: ${this.testRecordId}`)

    // Step 2: Trigger sync
    console.log('2. Triggering GitHub Action sync...')
    await this.triggerSync()
    console.log('   ✓ Sync triggered, waiting for completion...')
    
    // Wait for sync to complete
    await this.waitForSync(30000) // 30 seconds timeout

    // Step 3: Validate file creation
    console.log('3. Validating file creation...')
    const filePath = join(this.baseDir, 'src/content/platforms/test-platform-qa.json')
    const fileExists = await this.fileExists(filePath)
    
    if (!fileExists) {
      throw new Error(`File not created at expected location: ${filePath}`)
    }
    console.log('   ✓ File created successfully')

    // Step 4: Validate content
    console.log('4. Validating file content...')
    const content = JSON.parse(await readFile(filePath, 'utf-8'))
    
    if (content.name !== testPlatform.Name) {
      throw new Error(`Name mismatch: expected "${testPlatform.Name}", got "${content.name}"`)
    }
    if (content.slug !== testPlatform.slug) {
      throw new Error(`Slug mismatch: expected "${testPlatform.slug}", got "${content.slug}"`)
    }
    if (content.websiteUrl !== testPlatform.url_en) {
      throw new Error(`URL mismatch: expected "${testPlatform.url_en}", got "${content.websiteUrl}"`)
    }
    
    console.log('   ✓ Content validation passed')
    console.log('\n✅ Phase A completed successfully!\n')
  }

  private async testPhaseB_Update(): Promise<void> {
    console.log('📝 Phase B: Test File Update')
    console.log('----------------------------')

    if (!this.testRecordId) {
      throw new Error('No test record ID from Phase A')
    }

    // Step 1: Update platform
    const updatedPlatform: Partial<TestPlatform> = {
      Name: 'Test Platform QA Updated',
      url_en: 'https://updated-testplatform.example.com',
      logo_url: 'https://example.com/icons/updated-test-icon.png'
    }

    console.log('1. Updating test platform in NocoDB...')
    await this.updatePlatform(this.testRecordId, updatedPlatform)
    console.log('   ✓ Platform updated')

    // Step 2: Trigger sync
    console.log('2. Triggering GitHub Action sync...')
    await this.triggerSync()
    console.log('   ✓ Sync triggered, waiting for completion...')
    
    await this.waitForSync(30000)

    // Step 3: Validate update
    console.log('3. Validating file update...')
    const filePath = join(this.baseDir, 'src/content/platforms/test-platform-qa.json')
    const content = JSON.parse(await readFile(filePath, 'utf-8'))
    
    if (content.name !== updatedPlatform.Name) {
      throw new Error(`Name not updated: expected "${updatedPlatform.Name}", got "${content.name}"`)
    }
    if (content.websiteUrl !== updatedPlatform.url_en) {
      throw new Error(`URL not updated: expected "${updatedPlatform.url_en}", got "${content.websiteUrl}"`)
    }
    
    console.log('   ✓ Update validation passed')
    console.log('\n✅ Phase B completed successfully!\n')
  }

  private async testPhaseC_Deletion(): Promise<void> {
    console.log('📝 Phase C: Test File Deletion')
    console.log('------------------------------')

    if (!this.testRecordId) {
      throw new Error('No test record ID from previous phases')
    }

    // Step 1: Delete platform
    console.log('1. Deleting test platform from NocoDB...')
    await this.deletePlatform(this.testRecordId)
    console.log('   ✓ Platform deleted')
    this.testRecordId = null

    // Step 2: Trigger sync
    console.log('2. Triggering GitHub Action sync...')
    await this.triggerSync()
    console.log('   ✓ Sync triggered, waiting for completion...')
    
    await this.waitForSync(30000)

    // Step 3: Validate deletion
    console.log('3. Validating file deletion...')
    const filePath = join(this.baseDir, 'src/content/platforms/test-platform-qa.json')
    const fileExists = await this.fileExists(filePath)
    
    if (fileExists) {
      throw new Error(`File was not deleted: ${filePath}`)
    }
    
    console.log('   ✓ File successfully removed')
    console.log('\n✅ Phase C completed successfully!\n')
  }

  private async createPlatform(platform: TestPlatform): Promise<string> {
    // Get table ID first
    const tableId = await this.getTableId('Platforms')
    
    // Create record
    const response = await this.request(`/api/v2/tables/${tableId}/records`, {
      method: 'POST',
      body: JSON.stringify(platform)
    })
    
    return response.Id || response.id
  }

  private async updatePlatform(id: string, updates: Partial<TestPlatform>): Promise<void> {
    const tableId = await this.getTableId('Platforms')
    
    await this.request(`/api/v2/tables/${tableId}/records`, {
      method: 'PATCH',
      body: JSON.stringify({
        Id: id,
        ...updates
      })
    })
  }

  private async deletePlatform(id: string): Promise<void> {
    const tableId = await this.getTableId('Platforms')
    
    await this.request(`/api/v2/tables/${tableId}/records`, {
      method: 'DELETE',
      body: JSON.stringify({ Id: id })
    })
  }

  private async cleanupTestRecord(): Promise<void> {
    if (this.testRecordId) {
      console.log('\n🧹 Cleaning up test record...')
      try {
        await this.deletePlatform(this.testRecordId)
        console.log('   ✓ Test record cleaned up')
      } catch (error) {
        console.error('   ⚠️ Failed to cleanup test record:', error)
      }
    }
  }

  private async getTableId(tableName: string): Promise<string> {
    // This would normally be handled by the client, but we need direct access
    const response = await this.request(`/api/v2/meta/bases/${process.env.NOCODB_BASE_ID}/tables`)
    const tables = response.list || []
    
    const table = tables.find((t: any) => t.table_name === tableName || t.title === tableName)
    if (!table) {
      throw new Error(`Table ${tableName} not found`)
    }
    
    return table.id
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${process.env.NOCODB_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'xc-token': process.env.NOCODB_API_KEY!,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NocoDB API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  private async triggerSync(): Promise<void> {
    // In a real test, this would trigger the GitHub Action
    // For now, we'll simulate by running the script directly
    console.log('   📌 Note: In production, this would trigger GitHub Action workflow')
    console.log('   📌 For testing, run the content generation script manually')
    
    // Optionally, run the script directly if in test mode
    if (process.env.TEST_MODE === 'local') {
      execSync('npm run generate:content', { stdio: 'inherit' })
    }
  }

  private async waitForSync(timeout: number): Promise<void> {
    // In production, this would poll GitHub API for workflow status
    // For now, just wait a bit
    console.log(`   ⏳ Waiting ${timeout/1000} seconds for sync to complete...`)
    await new Promise(resolve => setTimeout(resolve, timeout))
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath)
      return true
    } catch {
      return false
    }
  }
}

// Main execution
async function main() {
  try {
    // Validate environment
    const requiredEnvVars = ['NOCODB_BASE_URL', 'NOCODB_API_KEY', 'NOCODB_BASE_ID']
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`)
      }
    }

    // Initialize client
    const client = new NocoDBWorkingClient({
      baseUrl: process.env.NOCODB_BASE_URL,
      apiKey: process.env.NOCODB_API_KEY,
      baseId: process.env.NOCODB_BASE_ID
    })

    // Test connection
    console.log('🔌 Testing NocoDB connection...')
    const connected = await client.testConnection()
    if (!connected) {
      throw new Error('Failed to connect to NocoDB')
    }
    console.log('✅ Connected to NocoDB\n')

    // Run tests
    const tester = new PlatformSyncTester(client, process.cwd())
    await tester.runAllTests()

  } catch (error) {
    console.error('\n❌ Test execution failed:')
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}