import { defineCollection, z } from 'astro:content'

// Episode schema based on NocoDB database structure
const episodeSchema = z.object({
  // Core episode fields
  title: z.string(),
  description: z.string(),
  pubDate: z.date(),
  season: z.number(),
  episode: z.number(),
  duration: z.string(),
  audioUrl: z.string().url(),

  // Enhanced metadata
  slug: z.string().optional(),
  language: z.enum(['en', 'nl', 'de', 'es']),
  imageUrl: z.string().url().optional(),

  // Episode details
  hosts: z.array(z.string()).default([]),
  guests: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),

  // Transistor specific
  transistorId: z.string(),
  shareUrl: z.string().url().optional(),
  embedHtml: z.string().optional(),
  downloads_total: z.number().optional(),

  // Content flags
  featured: z.boolean().default(false),
  episodeType: z.enum(['full', 'trailer', 'bonus']).default('full'),
  episode_type: z.enum(['full', 'trailer', 'bonus']).optional(),
  status: z.enum(['published', 'draft', 'scheduled']).default('published'),

  // SEO optimization
  summary: z.string().optional(), // For meta description
  transcript: z.string().optional(),
  seoTitle: z.string().optional(), // SEO-optimized title
  metaDescription: z.string().optional() // SEO-optimized meta description
})

// Guest schema for podcast participants
const guestSchema = z.object({
  name: z.string(),
  bio: z.string(),
  company: z.string().optional(),
  role: z.string().optional(),
  title: z.string().optional(), // Keep for backward compatibility

  // Contact information
  email: z.string().email().optional(),
  website: z.string().url().optional(),

  // Social media - flexible format to handle both YAML arrays and JSON
  twitter: z.string().optional(),
  linkedin: z.string().url().optional(),
  socialLinks: z.any().optional(), // Flexible array format for social links

  // LinkedIn enrichment fields
  linkedin_url: z.string().optional(),
  linkedin_full_name: z.string().optional(),
  linkedin_first_name: z.string().optional(),
  linkedin_headline: z.string().optional(),
  linkedin_email: z.string().optional(),
  linkedin_bio: z.string().optional(),
  linkedin_profile_pic: z.string().optional(),
  linkedin_current_role: z.string().optional(),
  linkedin_current_company: z.string().optional(),
  linkedin_country: z.string().optional(),
  linkedin_skills: z.string().optional(),
  linkedin_company_website: z.string().optional(),
  linkedin_experiences: z.string().optional(),
  linkedin_personal_website: z.string().optional(),
  linkedin_publications: z.string().optional(),
  last_linkedin_sync: z.string().optional(),

  // Media - allow both full URLs and relative paths
  imageUrl: z.string().optional(),

  // Relationships
  episodes: z.array(z.string()).default([]), // Episode slugs
  languages: z.array(z.enum(['en', 'nl', 'de', 'es'])).default(['en']),
  episodeCount: z.number().optional(),

  // Display
  isFeatured: z.boolean().default(false),

  // SEO
  slug: z.string().optional(),
  canonicalLanguage: z.enum(['en', 'nl', 'de', 'es']).default('en'),

  // Timestamps
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
})

// Quote schema for homepage testimonials
const quoteSchema = z.object({
  author: z.string(),
  company: z.string().optional(),
  title: z.string().optional(),

  // Language support
  language: z.enum(['en', 'nl', 'de', 'es']).default('en'),
  type: z.string().optional(),

  // Display
  featured: z.boolean().default(false),
  order: z.number().optional(),

  // Media and links
  authorImage: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional()
})

// Host schema for podcast hosts
const hostSchema = z.object({
  slug: z.string().optional(),
  name: z.string(),
  bio: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  role: z.string().optional(),

  // Media - allow both full URLs and relative paths
  imageUrl: z.string().optional(),

  // Social media - flexible format to handle both YAML arrays and JSON
  socialLinks: z.any().optional(),
  linkedin: z.string().optional(),

  // Relationships
  episodes: z.array(z.string()).optional(), // Episode IDs

  // Timestamps
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
})

// Brand listener schema
const brandSchema = z.object({
  name: z.string(),
  logoUrl: z.string(), // Allow relative paths for brand logos
  websiteUrl: z.string().url().optional(),

  // Display
  featured: z.boolean().default(false),
  order: z.number().optional(),

  // Context
  description: z.string().optional(),
  industry: z.string().optional()
})

// Platform schema for subscription links
const platformSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  iconUrl: z.string(), // Allow relative paths for local images
  websiteUrl: z.string().optional(),

  // Language-specific URLs - allow empty strings
  urls: z.object({
    en: z.string().url().or(z.literal('')),
    nl: z.string().url().or(z.literal('')),
    de: z.string().url().or(z.literal('')),
    es: z.string().url().or(z.literal(''))
  }),

  // Display and status
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().optional(),
  category: z.enum(['podcast', 'music', 'general']).default('podcast'),

  // Timestamps
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

// Define collections
export const collections = {
  episodes: defineCollection({
    type: 'content',
    schema: episodeSchema
  }),
  guests: defineCollection({
    type: 'content',
    schema: guestSchema
  }),
  hosts: defineCollection({
    type: 'content',
    schema: hostSchema
  }),
  quotes: defineCollection({
    type: 'content',
    schema: quoteSchema
  }),
  brands: defineCollection({
    type: 'data',
    schema: brandSchema
  }),
  platforms: defineCollection({
    type: 'data',
    schema: platformSchema
  })
}

// Export types for use in components
export type Episode = z.infer<typeof episodeSchema>;
export type Guest = z.infer<typeof guestSchema>;
export type Host = z.infer<typeof hostSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Platform = z.infer<typeof platformSchema>;