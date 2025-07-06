import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
// import AstroPWA from '@vite-pwa/astro';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sentry from '@sentry/astro';
import astroBrokenLinksChecker from 'astro-broken-link-checker';
// import { guestImageValidation } from './src/integrations/guest-image-validation.ts';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://cro.cafe',
  integrations: [
    // guestImageValidation(),
    sentry({
      dsn: "https://25fc8e72182ba318ffdde5b0e9913c22@o4509612269830144.ingest.de.sentry.io/4509612285558864",
      tracesSampleRate: 1.0, // 100% sampling for testing mode
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      // Setting this option to true will send default PII data to Sentry.
      // For example, automatic IP address collection on events
      sendDefaultPii: true,
      sourceMapsUploadOptions: {
        project: "crocafe-dev",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
      // Tracing configuration
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/cro\.cafe/,
        /^https:\/\/crocafe2\.netlify\.app/,
      ],
    }),
    react(),
    mdx(),
    // PWA temporarily disabled to debug homepage reload issue
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
    }),
    // Broken links checker - runs after build
    astroBrokenLinksChecker({
      logFilePath: './broken-links.log',
      checkExternalLinks: false, // Start with internal only, enable external later
      cache: true,
      parallel: true,
      excludeUrls: [
        // Exclude known external URLs that might be flaky
        /^https?:\/\/linkedin\.com/,
        /^https?:\/\/twitter\.com/,
        /^https?:\/\/youtube\.com/,
        // Exclude anchor links
        /^#/,
        // Exclude mailto and tel links
        /^mailto:/,
        /^tel:/
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
    // Events pages have been removed - redirect to about page
    '/event': '/about/',
    // Remove subscribe redirects - /subscribe/ is now global
    
    // Individual podcast episode redirects (English)
    // NOTE: Episodes below don't exist yet - removed to prevent 404s
    // '/podcast/s10e01-sander-volbeda-experimentation-and-the-future-of-cro': '/en/episodes/s10e01-sander-volbeda-experimentation-and-the-future-of-cro/',
    // '/podcast/s10e02-craig-sullivan-the-psychology-of-conversion-optimization': '/en/episodes/s10e02-craig-sullivan-the-psychology-of-conversion-optimization/',
    // '/podcast/s10e03-anna-vasylyshyna-digital-maturity-and-data-driven-growth': '/en/episodes/s10e03-anna-vasylyshyna-digital-maturity-and-data-driven-growth/',
    // '/podcast/s10e04-tiffany-da-silva-advanced-ab-testing-strategies': '/en/episodes/s10e04-tiffany-da-silva-advanced-ab-testing-strategies/',
    // '/podcast/s10e05-peep-laja-evidence-based-conversion-optimization': '/en/episodes/s10e05-peep-laja-evidence-based-conversion-optimization/',
    // '/podcast/s9e18-lisa-van-der-knaap-international-expansion-strategies': '/en/episodes/s9e18-lisa-van-der-knaap-international-expansion-strategies/',
    // '/podcast/s9e17-tom-de-ruyck-user-behavior-analytics': '/en/episodes/s9e17-tom-de-ruyck-user-behavior-analytics/',
    // '/podcast/s9e16-tim-ash-persuasive-design-principles': '/en/episodes/s9e16-tim-ash-persuasive-design-principles/',
    // '/podcast/s9e15-jen-clinehens-cx-optimization-strategies': '/en/episodes/s9e15-jen-clinehens-cx-optimization-strategies/',
    // '/podcast/s9e14-dennis-van-der-heijden-product-led-growth': '/en/episodes/s9e14-dennis-van-der-heijden-product-led-growth/',
    
    // Guest profile redirects (English)
    // NOTE: Redirects for guests that exist
    '/guest/sander-volbeda': '/guests/sander-volbeda/',
    '/guest/craig-sullivan': '/guests/craig-sullivan/',
    '/guest/peep-laja': '/guests/peep-laja/',
    '/guest/tim-ash': '/guests/tim-ash/',
    
    // NOTE: Guests below don't exist yet - redirect to all guests page
    '/guest/anna-vasylyshyna': '/all/guests/',
    '/guest/tiffany-da-silva': '/all/guests/',
    '/guest/lisa-van-der-knaap': '/all/guests/',
    '/guest/tom-de-ruyck': '/all/guests/',
    '/guest/jen-clinehens': '/all/guests/',
    '/guest/dennis-van-der-heijden': '/all/guests/',
    
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
    // Events pages have been removed - redirect to about page
    '/events': '/about/',
    
    // SEO-friendly redirects for common variations
    '/shows': '/en/episodes/',
    '/hosts': '/about/',
    '/contact': '/about/',
    
    // Newsletter and subscription variations
    '/newsletter': '/en/subscribe/',
    '/signup': '/en/subscribe/',
    
    // RSS feed redirects to Transistor feeds (English by default)
    '/feed.xml': 'https://feeds.transistor.fm/cro-cafe',
    '/rss': 'https://feeds.transistor.fm/cro-cafe',
    '/feeds': 'https://feeds.transistor.fm/cro-cafe',
    '/rss.xml': 'https://feeds.transistor.fm/cro-cafe',
    
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
    // Configure allowed external domains for Astro's Image component
    // This enables optimization of external images (like episode artwork from Transistor.fm)
    domains: ['img.transistor.fm', 'media.transistor.fm', 'images.transistor.fm'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.transistor.fm'
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
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['lightningcss']
    },
    server: {
      fs: {
        // Allow serving files from these directories
        allow: [
          // Search for the root of the workspace
          '..',
          // Allow node_modules
          './node_modules'
        ]
      }
    }
  },
  // Dev server configuration to expose to local network
  server: {
    host: true, // This binds to all network interfaces (0.0.0.0)
    port: 4321
  },
});