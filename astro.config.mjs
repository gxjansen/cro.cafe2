import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import AstroPWA from '@vite-pwa/astro';
import react from '@astrojs/react';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://cro.cafe',
  integrations: [
    tailwind(),
    react(),
    mdx(),
    AstroPWA({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.svg', 'robots.txt', 'sitemap.xml'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'CRO.CAFE Podcast',
        short_name: 'CRO.CAFE',
        theme_color: '#FF6B35',
        background_color: '#0F1419',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // Exclude audio URLs from service worker completely
        navigateFallbackDenylist: [
          /^\/api\//,
          /\.mp3$/,
          /transistor\.fm/
        ],
        runtimeCaching: [
          // Skip audio files completely - let them bypass service worker
          {
            urlPattern: /^https:\/\/img\.transistor\.fm\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // PWA-optimized caching strategy
          {
            urlPattern: /\/(episodes|guests)\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'content-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 3 // 3 days
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Marketing content - different strategy for PWA vs Browser
          {
            urlPattern: /\/(about|subscribe|privacy-policy).*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'marketing-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          nl: 'nl-NL', 
          de: 'de-DE',
          es: 'es-ES'
        }
      },
      // Custom sitemap configuration
      filter: (page) => {
        // Exclude redirect pages and test pages from sitemap
        return !page.includes('/color-test') && 
               !page.includes('/test-') &&
               !page.includes('/_') &&
               !page.includes('/api/');
      },
      customPages: [
        // Add any custom pages that might not be auto-discovered
        'https://cro.cafe/',
        'https://cro.cafe/search/',
        'https://cro.cafe/about/',
        'https://cro.cafe/privacy-policy/',
        'https://cro.cafe/all/episodes/',
        'https://cro.cafe/all/guests/'
      ]
    })
  ],
  redirects: {
    // ============================================================================
    // WEBFLOW TO ASTRO MIGRATION REDIRECTS
    // ============================================================================
    
    // English domain (www.cro.cafe) redirects to new structure
    '/podcast': '/en/episodes/',
    '/guest': '/en/guests/',
    '/event': '/en/events/',
    // Remove subscribe redirects - /subscribe/ is now global
    
    // Individual podcast episode redirects (English)
    // Format: /podcast/episode-title -> /en/episodes/episode-title/
    '/podcast/s10e01-sander-volbeda-experimentation-and-the-future-of-cro': '/en/episodes/s10e01-sander-volbeda-experimentation-and-the-future-of-cro/',
    '/podcast/s10e02-craig-sullivan-the-psychology-of-conversion-optimization': '/en/episodes/s10e02-craig-sullivan-the-psychology-of-conversion-optimization/',
    '/podcast/s10e03-anna-vasylyshyna-digital-maturity-and-data-driven-growth': '/en/episodes/s10e03-anna-vasylyshyna-digital-maturity-and-data-driven-growth/',
    '/podcast/s10e04-tiffany-da-silva-advanced-ab-testing-strategies': '/en/episodes/s10e04-tiffany-da-silva-advanced-ab-testing-strategies/',
    '/podcast/s10e05-peep-laja-evidence-based-conversion-optimization': '/en/episodes/s10e05-peep-laja-evidence-based-conversion-optimization/',
    '/podcast/s9e18-lisa-van-der-knaap-international-expansion-strategies': '/en/episodes/s9e18-lisa-van-der-knaap-international-expansion-strategies/',
    '/podcast/s9e17-tom-de-ruyck-user-behavior-analytics': '/en/episodes/s9e17-tom-de-ruyck-user-behavior-analytics/',
    '/podcast/s9e16-tim-ash-persuasive-design-principles': '/en/episodes/s9e16-tim-ash-persuasive-design-principles/',
    '/podcast/s9e15-jen-clinehens-cx-optimization-strategies': '/en/episodes/s9e15-jen-clinehens-cx-optimization-strategies/',
    '/podcast/s9e14-dennis-van-der-heijden-product-led-growth': '/en/episodes/s9e14-dennis-van-der-heijden-product-led-growth/',
    
    // Guest profile redirects (English)
    // Format: /guest/guest-name -> /all/guests/guest-name/
    '/guest/sander-volbeda': '/all/guests/sander-volbeda/',
    '/guest/craig-sullivan': '/all/guests/craig-sullivan/',
    '/guest/anna-vasylyshyna': '/all/guests/anna-vasylyshyna/',
    '/guest/tiffany-da-silva': '/all/guests/tiffany-da-silva/',
    '/guest/peep-laja': '/all/guests/peep-laja/',
    '/guest/lisa-van-der-knaap': '/all/guests/lisa-van-der-knaap/',
    '/guest/tom-de-ruyck': '/all/guests/tom-de-ruyck/',
    '/guest/tim-ash': '/all/guests/tim-ash/',
    '/guest/jen-clinehens': '/all/guests/jen-clinehens/',
    '/guest/dennis-van-der-heijden': '/all/guests/dennis-van-der-heijden/',
    
    // ============================================================================
    // DUTCH SUBDOMAIN (nl.cro.cafe) REDIRECTS
    // ============================================================================
    
    // Main Dutch pages to new structure
    // These will be handled by subdomain redirect files
    // Listed here for documentation purposes
    
    // ============================================================================
    // GERMAN SUBDOMAIN (de.cro.cafe) REDIRECTS  
    // ============================================================================
    
    // Main German pages to new structure
    // These will be handled by subdomain redirect files
    // Listed here for documentation purposes
    
    // ============================================================================
    // SPANISH SUBDOMAIN (es.cro.cafe) REDIRECTS
    // ============================================================================
    
    // Main Spanish pages to new structure  
    // These will be handled by subdomain redirect files
    // Listed here for documentation purposes
    
    // ============================================================================
    // GENERAL REDIRECTS AND FALLBACKS
    // ============================================================================
    
    // Legacy paths without language prefix now redirect to global pages
    '/events': '/en/events/',
    
    // SEO-friendly redirects for common variations
    '/shows': '/en/episodes/',
    '/hosts': '/about/',
    '/contact': '/about/',
    
    // Newsletter and subscription variations
    '/newsletter': '/en/subscribe/',
    '/signup': '/en/subscribe/',
    
    // RSS feed redirects (if moving from Webflow feeds)
    '/feed.xml': '/rss.xml',
    '/rss': '/rss.xml',
    '/feeds': '/rss.xml',
    
    // About page variations
    '/about-us': '/about/',
    '/team': '/about/',
    
    // Privacy and legal redirects
    '/privacy': '/privacy-policy/',
    '/terms': '/terms-of-service/',
    '/legal': '/privacy-policy/',
    
    // Search variations
    '/find': '/search/',
    '/search-episodes': '/search/',
    '/search-guests': '/search/',
    
    // Common typos and variations
    '/podcast-episodes': '/en/episodes/',
    '/all-episodes': '/all/episodes/',
    '/all-guests': '/all/guests/',
    '/guest-profiles': '/all/guests/',
    '/speaker': '/all/guests/',
    '/speakers': '/all/guests/',
    
    // Social and external redirects (if needed)
    '/linkedin': 'https://linkedin.com/company/cro-cafe',
    '/twitter': 'https://twitter.com/crocafe',
    '/youtube': 'https://youtube.com/@crocafe',
    
    // Webflow-specific redirects
    // Removed sitemap redirect - Astro's sitemap integration handles this automatically
  },
  image: {
    // Allow external images from common podcast/CDN sources
    domains: ['transistor.fm', 'media.transistor.fm', 'images.transistor.fm', 'cdn.transistor.fm'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.transistor.fm',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      }
    ]
  },
  // Disable Astro's automatic i18n routing since we're managing routes manually
  // i18n: {
  //   defaultLocale: 'en',
  //   locales: ['en', 'nl', 'de', 'es'],
  //   routing: {
  //     prefixDefaultLocale: false
  //   }
  // },
  output: 'static',
  trailingSlash: 'always'
});