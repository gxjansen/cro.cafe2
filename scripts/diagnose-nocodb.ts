#!/usr/bin/env tsx

/**
 * NocoDB Connection Diagnostic Script
 * Shows exact connection details for debugging
 */

async function main() {
  console.log('🔍 NocoDB Connection Diagnostic')
  console.log('==============================')

  // Get environment variables
  const baseUrl = process.env.NOCODB_BASE_URL
  const apiKey = process.env.NOCODB_API_KEY  
  const baseId = process.env.NOCODB_BASE_ID

  console.log('\n📋 Environment Variables:')
  console.log(`NOCODB_BASE_URL: ${baseUrl || 'NOT SET'}`)
  console.log(`NOCODB_API_KEY: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET'}`)
  console.log(`NOCODB_BASE_ID: ${baseId || 'NOT SET'}`)

  if (!baseUrl || !apiKey || !baseId) {
    console.log('\n❌ Missing required environment variables!')
    console.log('Required: NOCODB_BASE_URL, NOCODB_API_KEY, NOCODB_BASE_ID')
    process.exit(1)
  }

  // Test basic connectivity
  console.log('\n🌐 Testing Basic Connectivity:')
  
  try {
    const response = await fetch(baseUrl)
    console.log(`✅ Base URL accessible: ${response.status} ${response.statusText}`)
  } catch (error) {
    console.log(`❌ Base URL not accessible: ${error}`)
  }

  // Test various auth endpoints
  console.log('\n🔐 Testing Authentication Endpoints:')
  
  const authEndpoints = [
    '/api/v1/auth/user/me',
    '/api/v2/auth/user/me', 
    '/api/v1/user/me',
    '/api/v2/user/me',
    '/auth/user/me',
    '/user/me'
  ]

  for (const endpoint of authEndpoints) {
    try {
      const url = `${baseUrl}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'xc-token': apiKey,
          'xc-auth': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      console.log(`${response.ok ? '✅' : '❌'} ${endpoint}: ${response.status} ${response.statusText}`)
    } catch (error) {
      console.log(`❌ ${endpoint}: Network error - ${error}`)
    }
  }

  // Test direct table access patterns
  console.log('\n📊 Testing Table Access Patterns:')
  
  const tableEndpoints = [
    '/api/v1/tables',
    '/api/v2/tables',
    '/tables', 
    `/api/v1/meta/bases/${baseId}/tables`,
    `/api/v2/meta/bases/${baseId}/tables`,
    `/nc/${baseId}/api/v1/tables`,
    `/nc/${baseId}/api/v2/tables`
  ]

  for (const endpoint of tableEndpoints) {
    try {
      const url = `${baseUrl}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'xc-token': apiKey,
          'xc-auth': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      console.log(`${response.ok ? '✅' : '❌'} ${endpoint}: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`   📝 Response sample: ${JSON.stringify(data).substring(0, 100)}...`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Network error - ${error}`)
    }
  }

  console.log('\n🎯 Diagnostic complete!')
  console.log('Use the results above to identify the correct API pattern.')
}

// Run the script
main().catch((error) => {
  console.error('Diagnostic failed:', error)
  process.exit(1)
})