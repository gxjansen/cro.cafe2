#!/usr/bin/env node

/**
 * LinkedIn Data Sanitization Script
 *
 * This script sanitizes existing LinkedIn data in NocoDB by converting styled Unicode text
 * to regular ASCII and removing problematic characters like emojis and special symbols.
 *
 * Usage: node sanitize-linkedin-data.js
 */

import https from 'https'

// NocoDB Configuration
const NOCODB_CONFIG = {
  baseUrl: 'https://nocodb-4zvf2-u31495.vm.elestio.app',
  apiToken: process.env.NOCODB_API_TOKEN || 'noco_vj8FqbYMgKEy7YT1e0dqrQP4_tgE1e_MFEwpCw7sWfbQtgJPftSNmU0Sf_iKYSSz', // Using the working token from MCP
  projectId: 'p5mcqm7lvi5ty8i',
  tableId: 'm09pid7tgznxcqs'
}

// Helper function to convert styled Unicode text to regular ASCII
function convertStyledText(text) {
  if (!text) {return ''}

  // Comprehensive map of styled Unicode characters to regular ASCII
  const unicodeMap = {
    // Mathematical Alphanumeric Symbols - Bold (U+1D400-U+1D433)
    '𝐀': 'A', '𝐁': 'B', '𝐂': 'C', '𝐃': 'D', '𝐄': 'E', '𝐅': 'F', '𝐆': 'G', '𝐇': 'H', '𝐈': 'I', '𝐉': 'J',
    '𝐊': 'K', '𝐋': 'L', '𝐌': 'M', '𝐍': 'N', '𝐎': 'O', '𝐏': 'P', '𝐐': 'Q', '𝐑': 'R', '𝐒': 'S', '𝐓': 'T',
    '𝐔': 'U', '𝐕': 'V', '𝐖': 'W', '𝐗': 'X', '𝐘': 'Y', '𝐙': 'Z',
    '𝐚': 'a', '𝐛': 'b', '𝐜': 'c', '𝐝': 'd', '𝐞': 'e', '𝐟': 'f', '𝐠': 'g', '𝐡': 'h', '𝐢': 'i', '𝐣': 'j',
    '𝐤': 'k', '𝐥': 'l', '𝐦': 'm', '𝐧': 'n', '𝐨': 'o', '𝐩': 'p', '𝐪': 'q', '𝐫': 'r', '𝐬': 's', '𝐭': 't',
    '𝐮': 'u', '𝐯': 'v', '𝐰': 'w', '𝐱': 'x', '𝐲': 'y', '𝐳': 'z',

    // Mathematical Alphanumeric Symbols - Sans-serif Bold (U+1D5D4-U+1D607) - Wesley's text uses these!
    '𝗔': 'A', '𝗕': 'B', '𝗖': 'C', '𝗗': 'D', '𝗘': 'E', '𝗙': 'F', '𝗚': 'G', '𝗛': 'H', '𝗜': 'I', '𝗝': 'J',
    '𝗞': 'K', '𝗟': 'L', '𝗠': 'M', '𝗡': 'N', '𝗢': 'O', '𝗣': 'P', '𝗤': 'Q', '𝗥': 'R', '𝗦': 'S', '𝗧': 'T',
    '𝗨': 'U', '𝗩': 'V', '𝗪': 'W', '𝗫': 'X', '𝗬': 'Y', '𝗭': 'Z',
    '𝗮': 'a', '𝗯': 'b', '𝗰': 'c', '𝗱': 'd', '𝗲': 'e', '𝗳': 'f', '𝗴': 'g', '𝗵': 'h', '𝗶': 'i', '𝗷': 'j',
    '𝗸': 'k', '𝗹': 'l', '𝗺': 'm', '𝗻': 'n', '𝗼': 'o', '𝗽': 'p', '𝗾': 'q', '𝗿': 'r', '𝘀': 's', '𝘁': 't',
    '𝘂': 'u', '𝘃': 'v', '𝘄': 'w', '𝘅': 'x', '𝘆': 'y', '𝘇': 'z',

    // Mathematical Alphanumeric Symbols - Italic (U+1D434-U+1D467)
    '𝐴': 'A', '𝐵': 'B', '𝐶': 'C', '𝐷': 'D', '𝐸': 'E', '𝐹': 'F', '𝐺': 'G', '𝐻': 'H', '𝐼': 'I', '𝐽': 'J',
    '𝐾': 'K', '𝐿': 'L', '𝑀': 'M', '𝑁': 'N', '𝑂': 'O', '𝑃': 'P', '𝑄': 'Q', '𝑅': 'R', '𝑆': 'S', '𝑇': 'T',
    '𝑈': 'U', '𝑉': 'V', '𝑊': 'W', '𝑋': 'X', '𝑌': 'Y', '𝑍': 'Z',
    '𝑎': 'a', '𝑏': 'b', '𝑐': 'c', '𝑑': 'd', '𝑒': 'e', '𝑓': 'f', '𝑔': 'g', '𝘩': 'h', '𝑖': 'i', '𝑗': 'j',
    '𝑘': 'k', '𝑙': 'l', '𝑚': 'm', '𝑛': 'n', '𝑜': 'o', '𝑝': 'p', '𝑞': 'q', '𝑟': 'r', '𝑠': 's', '𝑡': 't',
    '𝑢': 'u', '𝑣': 'v', '𝑤': 'w', '𝑥': 'x', '𝑦': 'y', '𝑧': 'z',

    // Mathematical Alphanumeric Symbols - Script
    '𝒜': 'A', '𝒞': 'C', '𝒟': 'D', '𝒢': 'G', '𝒥': 'J', '𝒦': 'K', '𝒩': 'N', '𝒪': 'O', '𝒫': 'P',
    '𝒬': 'Q', '𝒮': 'S', '𝒯': 'T', '𝒰': 'U', '𝒱': 'V', '𝒲': 'W', '𝒳': 'X', '𝒴': 'Y', '𝒵': 'Z'
  }

  // Replace styled characters
  let result = text
  for (const [styled, regular] of Object.entries(unicodeMap)) {
    result = result.replace(new RegExp(styled, 'g'), regular)
  }

  return result
}

// Sanitization functions for different field types
function sanitizeName(text) {
  if (!text) {return ''}

  let sanitized = convertStyledText(text)
  sanitized = sanitized.replace(/[^\p{L}\s\-'\.]/gu, ' ')
  sanitized = sanitized.replace(/\s+/g, ' ').trim()
  sanitized = sanitized.replace(/[⌆⌇⌈⌉⌊⌋]/g, '')

  return sanitized
}

function sanitizeProfessionalField(text) {
  if (!text) {return ''}

  let sanitized = convertStyledText(text)
  sanitized = sanitized.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
  sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-&\/@\.,;:()]/gu, ' ')
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  return sanitized
}

function sanitizeBio(text) {
  if (!text) {return ''}

  // Convert styled text FIRST - this is the key fix for Wesley's bio
  let sanitized = convertStyledText(text)

  // Be more lenient with bios - keep most punctuation but remove problematic characters
  sanitized = sanitized.replace(/[\u{1F300}-\u{1F5FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')

  // Keep newlines and paragraph structure
  sanitized = sanitized.replace(/\r\n/g, '\n')

  // Clean up excessive whitespace while preserving paragraph breaks
  sanitized = sanitized.replace(/ +/g, ' ')
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n')

  return sanitized.trim()
}

function sanitizeHeadline(text) {
  if (!text) {return ''}

  let sanitized = convertStyledText(text)
  sanitized = sanitized.replace(/[⌆⌇⌈⌉⌊⌋]/g, '')
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  return sanitized
}

function sanitizeSkills(text) {
  if (!text) {return ''}

  let sanitized = convertStyledText(text)
  sanitized = sanitized.replace(/[^\p{L}\p{N}\s,\-+#\.]/gu, '')
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  return sanitized
}

// HTTP request helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const response = JSON.parse(body)
          resolve(response)
        } catch (e) {
          resolve(body)
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Get all LinkedIn data from NocoDB
async function getLinkedInData() {
  const options = {
    hostname: NOCODB_CONFIG.baseUrl.replace('https://', ''),
    path: `/api/v1/db/data/v1/${NOCODB_CONFIG.projectId}/${NOCODB_CONFIG.tableId}?limit=100&where=(linkedin_full_name,isnot,null)~or(linkedin_headline,isnot,null)~or(linkedin_bio,isnot,null)`,
    method: 'GET',
    headers: {
      'xc-token': NOCODB_CONFIG.apiToken,
      'Content-Type': 'application/json'
    }
  }

  console.log('📖 Fetching LinkedIn data from NocoDB...')
  return await makeRequest(options)
}

// Update a record in NocoDB
async function updateRecord(recordId, updates) {
  const options = {
    hostname: NOCODB_CONFIG.baseUrl.replace('https://', ''),
    path: `/api/v1/db/data/v1/${NOCODB_CONFIG.projectId}/${NOCODB_CONFIG.tableId}/${recordId}`,
    method: 'PATCH',
    headers: {
      'xc-token': NOCODB_CONFIG.apiToken,
      'Content-Type': 'application/json'
    }
  }

  return await makeRequest(options, updates)
}

// Main sanitization function
function sanitizeRecord(record) {
  const updates = {}
  let needsUpdate = false

  // Check and sanitize each field
  if (record.linkedin_full_name) {
    const sanitized = sanitizeName(record.linkedin_full_name)
    if (sanitized !== record.linkedin_full_name) {
      updates.linkedin_full_name = sanitized
      needsUpdate = true
    }
  }

  if (record.linkedin_first_name) {
    const sanitized = sanitizeName(record.linkedin_first_name)
    if (sanitized !== record.linkedin_first_name) {
      updates.linkedin_first_name = sanitized
      needsUpdate = true
    }
  }

  if (record.linkedin_headline) {
    const sanitized = sanitizeHeadline(record.linkedin_headline)
    if (sanitized !== record.linkedin_headline) {
      updates.linkedin_headline = sanitized
      needsUpdate = true
    }
  }

  if (record.linkedin_bio) {
    const sanitized = sanitizeBio(record.linkedin_bio)
    if (sanitized !== record.linkedin_bio) {
      updates.linkedin_bio = sanitized
      needsUpdate = true
    }
  }

  if (record.linkedin_current_role) {
    const sanitized = sanitizeProfessionalField(record.linkedin_current_role)
    if (sanitized !== record.linkedin_current_role) {
      updates.linkedin_current_role = sanitized
      needsUpdate = true
    }
  }

  if (record.linkedin_current_company) {
    const sanitized = sanitizeProfessionalField(record.linkedin_current_company)
    if (sanitized !== record.linkedin_current_company) {
      updates.linkedin_current_company = sanitized
      needsUpdate = true
    }
  }

  if (record.linkedin_skills) {
    const sanitized = sanitizeSkills(record.linkedin_skills)
    if (sanitized !== record.linkedin_skills) {
      updates.linkedin_skills = sanitized
      needsUpdate = true
    }
  }

  return { needsUpdate, updates }
}

// Main execution
async function main() {
  console.log('🚀 LinkedIn Data Sanitization Script')
  console.log('=====================================\n')

  // Check configuration
  if (NOCODB_CONFIG.apiToken === 'your-nocodb-api-token-here') {
    console.error('❌ Error: Please update the NOCODB_CONFIG.apiToken in the script with your actual NocoDB API token.')
    console.log('\n💡 You can find your API token in NocoDB under Account Settings > API Tokens')
    process.exit(1)
  }

  try {
    // Get all records with LinkedIn data
    const response = await getLinkedInData()
    const records = response.list || response

    if (!Array.isArray(records)) {
      console.error('❌ Error: Could not fetch records from NocoDB')
      return
    }

    console.log(`📊 Found ${records.length} records with LinkedIn data\n`)

    let updatedCount = 0
    let processedCount = 0

    // Process each record
    for (const record of records) {
      processedCount++
      const guestName = record.Name || 'Unknown'

      console.log(`🔍 Processing: ${guestName}`)

      const { needsUpdate, updates } = sanitizeRecord(record)

      if (needsUpdate) {
        try {
          await updateRecord(record.Id, updates)
          updatedCount++

          console.log(`✅ Updated: ${guestName}`)

          // Show what was changed for important cases
          if (updates.linkedin_bio && record.linkedin_bio.includes('𝗛')) {
            console.log('   📝 Bio sanitized: Converted styled Unicode text to regular text')
          }
          if (updates.linkedin_full_name) {
            console.log(`   👤 Name sanitized: "${record.linkedin_full_name}" → "${updates.linkedin_full_name}"`)
          }

        } catch (error) {
          console.error(`❌ Failed to update ${guestName}:`, error.message)
        }
      } else {
        console.log(`✨ Already clean: ${guestName}`)
      }
    }

    console.log('\n📈 Sanitization Complete!')
    console.log('==========================')
    console.log(`📊 Records processed: ${processedCount}`)
    console.log(`✅ Records updated: ${updatedCount}`)
    console.log(`✨ Records already clean: ${processedCount - updatedCount}`)

    if (updatedCount > 0) {
      console.log('\n🎉 Success! Your LinkedIn data has been sanitized.')
      console.log('   - Styled Unicode text converted to regular ASCII')
      console.log('   - Emojis and special symbols removed from names')
      console.log('   - Professional appearance maintained')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Test function to show what Wesley's bio would look like after sanitization
function testWesleyBio() {
  const wesleyBio = '𝗛𝗼𝗲𝘃𝗲𝗲𝗹 𝗼𝗺𝘇𝗲𝘁 𝘂𝗶𝘁 𝗷𝗲 𝘄𝗲𝗯𝘀𝗵𝗼𝗽 𝗹𝗮𝗮𝘁 𝗷𝗶𝗷 𝗹𝗶𝗴𝗴𝗲𝗻?'
  const sanitized = sanitizeBio(wesleyBio)

  console.log('🧪 Test - Wesley\'s Bio Sanitization:')
  console.log('Before:', wesleyBio)
  console.log('After: ', sanitized)
  console.log('')
}

// Run the script
// Show test first
testWesleyBio()

// Run main script
main().catch(console.error)

export {
  convertStyledText,
  sanitizeName,
  sanitizeProfessionalField,
  sanitizeBio,
  sanitizeHeadline,
  sanitizeSkills
}