/**
 * LinkedIn Data Sanitization Rules for CRO.CAFE
 *
 * This file contains sanitization functions for each LinkedIn field
 * to ensure data consistency and prevent display issues on the website.
 */

// Helper function to convert styled Unicode text to regular text
function convertStyledText(text) {
  if (!text) {return text}

  // Unicode mathematical alphanumeric symbols mapping
  const styledTextMap = {
    // Bold letters
    '𝗔': 'A', '𝗕': 'B', '𝗖': 'C', '𝗗': 'D', '𝗘': 'E', '𝗙': 'F', '𝗚': 'G', '𝗛': 'H', '𝗜': 'I', '𝗝': 'J',
    '𝗞': 'K', '𝗟': 'L', '𝗠': 'M', '𝗡': 'N', '𝗢': 'O', '𝗣': 'P', '𝗤': 'Q', '𝗥': 'R', '𝗦': 'S', '𝗧': 'T',
    '𝗨': 'U', '𝗩': 'V', '𝗪': 'W', '𝗫': 'X', '𝗬': 'Y', '𝗭': 'Z',
    '𝗮': 'a', '𝗯': 'b', '𝗰': 'c', '𝗱': 'd', '𝗲': 'e', '𝗳': 'f', '𝗴': 'g', '𝗵': 'h', '𝗶': 'i', '𝗷': 'j',
    '𝗸': 'k', '𝗹': 'l', '𝗺': 'm', '𝗻': 'n', '𝗼': 'o', '𝗽': 'p', '𝗾': 'q', '𝗿': 'r', '𝘀': 's', '𝘁': 't',
    '𝘂': 'u', '𝘃': 'v', '𝘄': 'w', '𝘅': 'x', '𝘆': 'y', '𝘇': 'z',
    // Italic letters
    '𝑨': 'A', '𝑩': 'B', '𝑪': 'C', '𝑫': 'D', '𝑬': 'E', '𝑭': 'F', '𝑮': 'G', '𝑯': 'H', '𝑰': 'I', '𝑱': 'J',
    '𝑲': 'K', '𝑳': 'L', '𝑴': 'M', '𝑵': 'N', '𝑶': 'O', '𝑷': 'P', '𝑸': 'Q', '𝑹': 'R', '𝑺': 'S', '𝑻': 'T',
    '𝑼': 'U', '𝑽': 'V', '𝑾': 'W', '𝑿': 'X', '𝒀': 'Y', '𝒁': 'Z',
    '𝒂': 'a', '𝒃': 'b', '𝒄': 'c', '𝒅': 'd', '𝒆': 'e', '𝒇': 'f', '𝒈': 'g', '𝒉': 'h', '𝒊': 'i', '𝒋': 'j',
    '𝒌': 'k', '𝒍': 'l', '𝒎': 'm', '𝒏': 'n', '𝒐': 'o', '𝒑': 'p', '𝒒': 'q', '𝒓': 'r', '𝒔': 's', '𝒕': 't',
    '𝒖': 'u', '𝒗': 'v', '𝒘': 'w', '𝒙': 'x', '𝒚': 'y', '𝒛': 'z'
  }

  let result = text
  for (const [styled, normal] of Object.entries(styledTextMap)) {
    result = result.replace(new RegExp(styled, 'g'), normal)
  }

  return result
}

// Helper function to remove or replace problematic symbols
function sanitizeSymbols(text, preserveEmojis = false) {
  if (!text) {return text}

  // Replace specific problematic symbols
  let result = text
    .replace(/⌆/g, '') // Remove the ⌆ symbol
    .replace(/☑️/g, '✓') // Replace checkbox emoji with simple checkmark
    .replace(/✉️/g, '') // Remove email emoji
    .replace(/📱/g, '') // Remove phone emoji
    .replace(/☕️/g, '') // Remove coffee emoji
    .replace(/🤝/g, '') // Remove handshake emoji
    .replace(/💬/g, '') // Remove speech bubble
    .replace(/🎯/g, '') // Remove target emoji
    .replace(/❤️/g, '') // Remove heart emoji
    .replace(/🔍/g, '') // Remove magnifying glass
    .replace(/🛠️/g, '') // Remove tools emoji
    .replace(/🌎🌴🥥/g, '') // Remove travel emojis
    .replace(/🍹🍺🌞/g, '') // Remove vacation emojis
    .replace(/\*\*/g, '') // Remove markdown bold markers
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines to 2

  // Optionally remove all emojis
  if (!preserveEmojis) {
    // Remove most common emoji ranges
    result = result.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    result = result.replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & pictographs
    result = result.replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map symbols
    result = result.replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical symbols
    result = result.replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric shapes extended
    result = result.replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental arrows-C
    result = result.replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous symbols
    result = result.replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
  }

  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim()

  return result
}

// Helper function to clean up HTML and formatting
function cleanFormatting(text) {
  if (!text) {return text}

  return text
    .replace(/<[^>]*>/g, '') // Remove any HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML spaces
    .replace(/&amp;/g, '&') // Replace HTML ampersands
    .replace(/&lt;/g, '<') // Replace HTML less than
    .replace(/&gt;/g, '>') // Replace HTML greater than
    .replace(/&quot;/g, '"') // Replace HTML quotes
    .replace(/&#39;/g, "'") // Replace HTML apostrophes
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Normalize line endings
    .trim()
}

// Sanitization rules for each LinkedIn field
const sanitizationRules = {
  // Names and titles - remove all special characters
  linkedin_full_name: (value) => {
    if (!value) {return value}
    return cleanFormatting(convertStyledText(sanitizeSymbols(value, false)))
  },

  linkedin_first_name: (value) => {
    if (!value) {return value}
    return cleanFormatting(convertStyledText(sanitizeSymbols(value, false)))
  },

  // Headlines - preserve some formatting but remove problematic symbols
  linkedin_headline: (value) => {
    if (!value) {return value}
    // Allow emojis in headlines for personality, but remove problematic symbols
    let cleaned = cleanFormatting(convertStyledText(value))
    // Remove specific problematic symbols while keeping useful emojis
    cleaned = cleaned.replace(/⌆/g, '').replace(/\*\*/g, '')
    // Limit length to prevent layout issues
    if (cleaned.length > 200) {
      cleaned = `${cleaned.substring(0, 197)  }...`
    }
    return cleaned.trim()
  },

  // Email - strict sanitization
  linkedin_email: (value) => {
    if (!value) {return value}
    // Remove all non-email characters
    return value.toLowerCase().trim().replace(/[^a-z0-9@._+-]/gi, '')
  },

  // Bio - preserve formatting but clean up
  linkedin_bio: (value) => {
    if (!value) {return value}
    let cleaned = cleanFormatting(convertStyledText(value))
    // Remove all emojis and special symbols from bio
    cleaned = sanitizeSymbols(cleaned, false)
    // Preserve paragraph structure
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    return cleaned.trim()
  },

  // URLs - ensure valid URLs
  linkedin_profile_pic: (value) => {
    if (!value) {return value}
    // Basic URL validation and cleaning
    return value.trim().replace(/\s/g, '%20')
  },

  linkedin_url: (value) => {
    if (!value) {return value}
    // Ensure it's a valid LinkedIn URL
    const cleaned = value.trim()
    if (cleaned.includes('linkedin.com')) {
      return cleaned
    }
    return null
  },

  // Job titles and companies - moderate cleaning
  linkedin_current_role: (value) => {
    if (!value) {return value}
    return cleanFormatting(convertStyledText(sanitizeSymbols(value, false)))
  },

  linkedin_current_company: (value) => {
    if (!value) {return value}
    return cleanFormatting(convertStyledText(sanitizeSymbols(value, false)))
  },

  // Location data - basic cleaning
  linkedin_country: (value) => {
    if (!value) {return value}
    return cleanFormatting(value).replace(/[^a-zA-Z\s-]/g, '')
  },

  // Skills - clean list format
  linkedin_skills: (value) => {
    if (!value) {return value}
    return cleanFormatting(convertStyledText(sanitizeSymbols(value, false)))
  },

  // Company website - ensure valid URL
  linkedin_company_website: (value) => {
    if (!value) {return value}
    const cleaned = value.trim().toLowerCase()
    // Add https:// if missing
    if (cleaned && !cleaned.startsWith('http')) {
      return `https://${cleaned}`
    }
    return cleaned
  },

  // JSON fields - ensure valid JSON
  linkedin_experiences: (value) => {
    if (!value) {return value}
    try {
      // If it's already a string, try to parse and re-stringify to ensure valid JSON
      if (typeof value === 'string') {
        const parsed = JSON.parse(value)
        // Clean the text content within the JSON
        const cleanJson = (obj) => {
          if (typeof obj === 'string') {
            return cleanFormatting(convertStyledText(sanitizeSymbols(obj, false)))
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
      console.error('Error processing experiences JSON:', e)
      return '[]'
    }
  },

  linkedin_personal_website: (value) => {
    if (!value) {return value}
    try {
      if (typeof value === 'string') {
        const parsed = JSON.parse(value)
        if (parsed.name) {
          parsed.name = cleanFormatting(convertStyledText(sanitizeSymbols(parsed.name, false)))
        }
        if (parsed.link && !parsed.link.startsWith('http')) {
          parsed.link = `https://${parsed.link}`
        }
        return JSON.stringify(parsed)
      }
      return JSON.stringify(value)
    } catch (e) {
      console.error('Error processing personal website JSON:', e)
      return '{}'
    }
  },

  linkedin_publications: (value) => {
    if (!value) {return value}
    try {
      if (typeof value === 'string') {
        const parsed = JSON.parse(value)
        const cleanJson = (obj) => {
          if (typeof obj === 'string') {
            return cleanFormatting(convertStyledText(sanitizeSymbols(obj, false)))
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
      console.error('Error processing publications JSON:', e)
      return '[]'
    }
  }
}

// Main sanitization function
function sanitizeLinkedInData(data) {
  const sanitized = {}

  for (const [field, value] of Object.entries(data)) {
    if (field.startsWith('linkedin_') && sanitizationRules[field]) {
      sanitized[field] = sanitizationRules[field](value)
    } else {
      sanitized[field] = value
    }
  }

  return sanitized
}

// Export for use in n8n
module.exports = {
  sanitizeLinkedInData,
  convertStyledText,
  sanitizeSymbols,
  cleanFormatting
}