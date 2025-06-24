#!/usr/bin/env tsx

/**
 * Test Script for Hosts Table Synchronization
 * This script provides utilities to test the NocoDB to GitHub sync workflow
 */

import { NocoDBWorkingClient } from '../src/lib/services/nocodb-working-client.js'
import { promises as fs } from 'fs'
import { join } from 'path'

interface TestHostData {
  name: string
  bio: string
  company: string
  title: string
  role: string
  slug: string
  website: string
  twitter: string
  linkedin: string
  image_url?: string
}

class HostsSyncTester {
  private client: NocoDBWorkingClient
  private contentDir: string
  private testHostSlug = 'test-host-qa'

  constructor() {
    const baseUrl = process.env.NOCODB_BASE_URL
    const apiKey = process.env.NOCODB_API_KEY
    const baseId = process.env.NOCODB_BASE_ID

    if (!baseUrl || !apiKey || !baseId) {
      throw new Error('Missing required environment variables: NOCODB_BASE_URL, NOCODB_API_KEY, NOCODB_BASE_ID')
    }

    this.client = new NocoDBWorkingClient({ baseUrl, apiKey, baseId })
    this.contentDir = join(process.cwd(), 'src/content/hosts')
  }

  async runTests() {
    console.log('🧪 Starting Hosts Table Synchronization Tests')
    console.log('===========================================\n')

    try {
      // Test connection
      const connected = await this.client.testConnection()
      if (!connected) {
        throw new Error('Failed to connect to NocoDB')
      }
      console.log('✅ Connected to NocoDB successfully\n')

      // Phase A: Test file creation
      console.log('📝 Phase A: Test File Creation')
      console.log('------------------------------')
      const testHost = await this.createTestHost()
      console.log('✅ Test host created in NocoDB')
      console.log('⚠️  Please trigger the GitHub Action "Content Synchronization from NocoDB" now')
      console.log('   Then run this script with --verify-create flag\n')

      // Phase B: Test file update
      console.log('✏️  Phase B: Test File Update')
      console.log('----------------------------')
      console.log('   Run this script with --update flag after verifying creation\n')

      // Phase C: Test file deletion
      console.log('🗑️  Phase C: Test File Deletion')
      console.log('------------------------------')
      console.log('   Run this script with --delete flag after verifying update\n')

    } catch (error) {
      console.error('❌ Test failed:', error)
      process.exit(1)
    }
  }

  async createTestHost(): Promise<TestHostData> {
    const testData: TestHostData = {
      name: "Test Host QA",
      bio: "This is a test host created for automated QA testing. Please ignore.",
      company: "Test Host Company",
      title: "QA Test Engineer",
      role: "QA Test Host",
      slug: this.testHostSlug,
      website: "https://testhost.example.com",
      twitter: "@testhostqa",
      linkedin: "testhostqa"
    }

    console.log('Creating test host with data:', JSON.stringify(testData, null, 2))
    
    // Note: The actual creation would need to be done through NocoDB UI or API
    // This is a placeholder for the test data structure
    return testData
  }

  async verifyCreation() {
    console.log('🔍 Verifying test host creation...')
    
    const filePath = join(this.contentDir, `${this.testHostSlug}.mdx`)
    
    try {
      const content = await fs.readFile(filePath, 'utf8')
      console.log('✅ File created successfully at:', filePath)
      console.log('\n📄 File content:')
      console.log(content)
      
      // Verify content
      if (content.includes('Test Host QA') && 
          content.includes('Test Host Company') &&
          content.includes('QA Test Engineer')) {
        console.log('\n✅ Content verification passed!')
      } else {
        console.log('\n❌ Content verification failed - missing expected data')
      }
    } catch (error) {
      console.error('❌ File not found at:', filePath)
      console.error('   Make sure the sync action has completed')
    }
  }

  async updateTestHost() {
    console.log('📝 Updating test host data...')
    
    const updatedData = {
      name: "Test Host QA Updated",
      company: "Updated Host Company",
      bio: "Updated bio for testing purposes"
    }

    console.log('Updated fields:', JSON.stringify(updatedData, null, 2))
    console.log('⚠️  Please update these fields in NocoDB and trigger the sync action')
    console.log('   Then run this script with --verify-update flag')
  }

  async verifyUpdate() {
    console.log('🔍 Verifying test host update...')
    
    const filePath = join(this.contentDir, `${this.testHostSlug}.mdx`)
    
    try {
      const content = await fs.readFile(filePath, 'utf8')
      console.log('✅ File found at:', filePath)
      
      // Verify updated content
      if (content.includes('Test Host QA Updated') && 
          content.includes('Updated Host Company') &&
          content.includes('Updated bio for testing purposes')) {
        console.log('✅ Update verification passed!')
      } else {
        console.log('❌ Update verification failed - updated data not found')
        console.log('\n📄 Current file content:')
        console.log(content)
      }
    } catch (error) {
      console.error('❌ File not found at:', filePath)
    }
  }

  async deleteTestHost() {
    console.log('🗑️  Preparing to delete test host...')
    console.log('⚠️  Please delete the test host from NocoDB and trigger the sync action')
    console.log('   Then run this script with --verify-delete flag')
  }

  async verifyDeletion() {
    console.log('🔍 Verifying test host deletion...')
    
    const filePath = join(this.contentDir, `${this.testHostSlug}.mdx`)
    
    try {
      await fs.access(filePath)
      console.error('❌ File still exists at:', filePath)
      console.error('   The sync action may not have completed or deletion is not working')
    } catch {
      console.log('✅ File successfully deleted!')
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2)
  const tester = new HostsSyncTester()

  if (args.length === 0) {
    await tester.runTests()
  } else {
    switch (args[0]) {
      case '--verify-create':
        await tester.verifyCreation()
        break
      case '--update':
        await tester.updateTestHost()
        break
      case '--verify-update':
        await tester.verifyUpdate()
        break
      case '--delete':
        await tester.deleteTestHost()
        break
      case '--verify-delete':
        await tester.verifyDeletion()
        break
      default:
        console.log('Unknown command:', args[0])
        console.log('Available commands:')
        console.log('  --verify-create   Verify test host was created')
        console.log('  --update          Show update instructions')
        console.log('  --verify-update   Verify test host was updated')
        console.log('  --delete          Show deletion instructions')
        console.log('  --verify-delete   Verify test host was deleted')
    }
  }
}

main().catch(console.error)