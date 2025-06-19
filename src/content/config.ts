import { defineCollection, z } from 'astro:content';

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
  
  // Content flags
  featured: z.boolean().default(false),
  episodeType: z.enum(['full', 'trailer', 'bonus']).default('full'),
  
  // SEO optimization
  summary: z.string().optional(), // For meta description
  transcript: z.string().optional(),
});

// Guest schema for podcast participants
const guestSchema = z.object({
  name: z.string(),
  bio: z.string(),
  company: z.string().optional(),
  title: z.string().optional(),
  
  // Contact information
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  
  // Social media
  twitter: z.string().optional(),
  linkedin: z.string().url().optional(),
  
  // Media
  imageUrl: z.string().url().optional(),
  
  // Relationships
  episodes: z.array(z.string()).default([]), // Episode slugs
  languages: z.array(z.enum(['en', 'nl', 'de', 'es'])).default(['en']),
  
  // SEO
  slug: z.string().optional(),
  canonicalLanguage: z.enum(['en', 'nl', 'de', 'es']).default('en'),
});

// Quote schema for homepage testimonials
const quoteSchema = z.object({
  text: z.string(),
  author: z.string(),
  company: z.string().optional(),
  title: z.string().optional(),
  
  // Language support
  language: z.enum(['en', 'nl', 'de', 'es']),
  originalLanguage: z.enum(['en', 'nl', 'de', 'es']).optional(),
  
  // Display
  featured: z.boolean().default(false),
  order: z.number().optional(),
  
  // Media
  authorImage: z.string().url().optional(),
});

// Host schema for podcast hosts
const hostSchema = z.object({
  slug: z.string().optional(),
  name: z.string(),
  bio: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  role: z.string().optional(),
  
  // Media
  imageUrl: z.string().url().optional(),
  
  // Social media - flexible format to handle both YAML arrays and JSON
  socialLinks: z.any().optional(),
  
  // Relationships
  episodes: z.array(z.string()).optional(), // Episode IDs
  
  // Timestamps
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

// Brand listener schema
const brandSchema = z.object({
  name: z.string(),
  logoUrl: z.string().url(),
  websiteUrl: z.string().url().optional(),
  
  // Display
  featured: z.boolean().default(false),
  order: z.number().optional(),
  
  // Context
  description: z.string().optional(),
  industry: z.string().optional(),
});

// Platform schema for subscription links
const platformSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  iconUrl: z.string(), // Allow relative paths for local images
  websiteUrl: z.string(),
  
  // Language-specific URLs
  urls: z.object({
    en: z.string().url(),
    nl: z.string().url(),
    de: z.string().url(),
    es: z.string().url(),
  }),
  
  // Display and status
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().optional(),
  category: z.enum(['podcast', 'music', 'general']).default('podcast'),
  
  // Timestamps
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Define collections
export const collections = {
  episodes: defineCollection({
    type: 'content',
    schema: episodeSchema,
  }),
  guests: defineCollection({
    type: 'content', 
    schema: guestSchema,
  }),
  hosts: defineCollection({
    type: 'content',
    schema: hostSchema,
  }),
  quotes: defineCollection({
    type: 'content',
    schema: quoteSchema,
  }),
  brands: defineCollection({
    type: 'data',
    schema: brandSchema,
  }),
  platforms: defineCollection({
    type: 'data',
    schema: platformSchema,
  }),
};

// Export types for use in components
export type Episode = z.infer<typeof episodeSchema>;
export type Guest = z.infer<typeof guestSchema>;
export type Host = z.infer<typeof hostSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Platform = z.infer<typeof platformSchema>;