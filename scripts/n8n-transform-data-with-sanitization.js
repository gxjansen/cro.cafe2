// Updated Transform Data node code for n8n with sanitization
// Copy this code into your n8n Transform Data node

// Helper function to convert styled Unicode text to regular text
function convertStyledText(text) {
  if (!text) {return text}

  // Unicode mathematical alphanumeric symbols mapping (partial list - extend as needed)
  const styledTextMap = {
    // Bold letters
    '𝗔': 'A', '𝗕': 'B', '𝗖': 'C', '𝗗': 'D', '𝗘': 'E', '𝗙': 'F', '𝗚': 'G', '𝗛': 'H', '𝗜': 'I', '𝗝': 'J',
    '𝗞': 'K', '𝗟': 'L', '𝗠': 'M', '𝗡': 'N', '𝗢': 'O', '𝗣': 'P', '𝗤': 'Q', '𝗥': 'R', '𝗦': 'S', '𝗧': 'T',
    '𝗨': 'U', '𝗩': 'V', '𝗪': 'W', '𝗫': 'X', '𝗬': 'Y', '𝗭': 'Z',
    '𝗮': 'a', '𝗯': 'b', '𝗰': 'c', '𝗱': 'd', '𝗲': 'e', '𝗳': 'f', '𝗴': 'g', '𝗵': 'h', '𝗶': 'i', '𝗷': 'j',
    '𝗸': 'k', '𝗹': 'l', '𝗺': 'm', '𝗻': 'n', '𝗼': 'o', '𝗽': 'p', '𝗾': 'q', '𝗿': 'r', '𝘀': 's', '𝘁': 't',
    '𝘂': 'u', '𝘃': 'v', '𝘄': 'w', '𝘅': 'x', '𝘆': 'y', '𝘇': 'z'
  }

  let result = text
  for (const [styled, normal] of Object.entries(styledTextMap)) {
    result = result.replace(new RegExp(styled, 'g'), normal)
  }

  return result
}

// Helper function to sanitize text
function sanitizeText(text, options = {}) {
  if (!text) {return text}

  const {
    removeEmojis = true,
    removeSymbols = true,
    convertStyled = true,
    maxLength = null
  } = options

  let result = text

  // Convert styled text
  if (convertStyled) {
    result = convertStyledText(result)
  }

  // Remove specific problematic symbols
  if (removeSymbols) {
    result = result
      .replace(/⌆/g, '') // Remove the ⌆ symbol
      .replace(/\*\*/g, '') // Remove markdown bold markers
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
  }

  // Remove emojis
  if (removeEmojis) {
    // Remove most common emoji ranges
    result = result.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    result = result.replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & pictographs
    result = result.replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map
    result = result.replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous symbols
    result = result.replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
  }

  // Clean up formatting
  result = result
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML spaces
    .replace(/&amp;/g, '&') // Replace HTML ampersands
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()

  // Apply max length if specified
  if (maxLength && result.length > maxLength) {
    result = `${result.substring(0, maxLength - 3)  }...`
  }

  return result
}

// Helper to sanitize JSON fields
function sanitizeJsonField(value) {
  if (!value) {return value}

  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value)

      // Recursively clean JSON content
      const cleanJson = (obj) => {
        if (typeof obj === 'string') {
          return sanitizeText(obj)
        } else if (Array.isArray(obj)) {
          return obj.map(cleanJson)
        } else if (obj && typeof obj === 'object') {
          const cleaned = {}
          for (const [key, val] of Object.entries(obj)) {
            cleaned[key] = cleanJson(val)
          }
          return cleaned
        }
        return obj
      }

      return JSON.stringify(cleanJson(parsed))
    }
    return JSON.stringify(value)
  } catch (e) {
    console.error('Error processing JSON:', e)
    return Array.isArray(value) ? '[]' : '{}'
  }
}

// Extract the LinkedIn data from the wrapped response
const dataArray = $json.linkedinData
if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
  throw new Error('No LinkedIn data found')
}

// Get the first (and should be only) item from the array
const linkedinData = dataArray[0]

// Get the guest ID from the original NocoDB data
let guestId = null

try {
  guestId = $('Get Guests with LinkedIn').item.json.Id
} catch (error) {
  throw new Error(`Could not find guest ID. Error: ${  error.message}`)
}

if (!guestId) {
  throw new Error('Guest ID is null or undefined')
}

// Get the current timestamp
const currentTimestamp = new Date().toISOString()

// Transform and sanitize the data
const transformedData = {
  Id: guestId,
  linkedin_url: linkedinData.linkedinUrl || '',

  // Names - remove all special characters
  linkedin_full_name: sanitizeText(linkedinData.fullName || '', {
    removeEmojis: true,
    removeSymbols: true
  }),
  linkedin_first_name: sanitizeText(linkedinData.firstName || '', {
    removeEmojis: true,
    removeSymbols: true
  }),

  // Headline - allow some emojis for personality but limit length
  linkedin_headline: sanitizeText(linkedinData.headline || '', {
    removeEmojis: false,
    removeSymbols: true,
    maxLength: 200
  }),

  // Email - strict sanitization
  linkedin_email: (linkedinData.email || '').toLowerCase().trim().replace(/[^a-z0-9@._+-]/gi, ''),

  // Bio - remove all special characters
  linkedin_bio: sanitizeText(linkedinData.about || '', {
    removeEmojis: true,
    removeSymbols: true
  }),

  // URLs - basic cleaning
  linkedin_profile_pic: (linkedinData.profilePicHighQuality || linkedinData.profilePic || '').trim(),

  // Job info - moderate cleaning
  linkedin_current_role: sanitizeText(linkedinData.jobTitle || '', {
    removeEmojis: true,
    removeSymbols: true
  }),
  linkedin_current_company: sanitizeText(linkedinData.companyName || '', {
    removeEmojis: true,
    removeSymbols: true
  }),

  // Location - basic cleaning
  linkedin_country: sanitizeText(linkedinData.addressCountryOnly || '', {
    removeEmojis: true,
    removeSymbols: true
  }).replace(/[^a-zA-Z\s-]/g, ''),

  // Skills - clean text
  linkedin_skills: sanitizeText(linkedinData.topSkillsByEndorsements || '', {
    removeEmojis: true,
    removeSymbols: true
  }),

  // Company website - ensure valid URL
  linkedin_company_website: (() => {
    const website = (linkedinData.companyWebsite || '').trim().toLowerCase()
    if (website && !website.startsWith('http')) {
      return `https://${website}`
    }
    return website
  })(),

  // JSON fields - sanitize content within JSON
  linkedin_experiences: sanitizeJsonField(linkedinData.experiences || []),
  linkedin_personal_website: sanitizeJsonField(linkedinData.creatorWebsite || {}),
  linkedin_publications: sanitizeJsonField(linkedinData.publications || []),

  // Metadata
  linkedin_last_modified: currentTimestamp,
  linkedin_scrape_status: 'success',
  linkedin_scrape_last_attempt: currentTimestamp
}

return transformedData