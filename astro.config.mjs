import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
// import AstroPWA from '@vite-pwa/astro';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sentry from '@sentry/astro';
// import astroBrokenLinksChecker from 'astro-broken-link-checker';
// import { guestImageValidation } from './src/integrations/guest-image-validation.ts';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Check if we're in a real Netlify deployment (not local Netlify CLI)
// DEPLOY_URL is set in both local Netlify CLI and real deployments
// NETLIFY_BUILD_BASE is only set in real deployments
// For local builds, disable Sentry uploads to avoid auth issues
const isRealNetlifyDeployment = process.env.NETLIFY_BUILD_BASE && process.env.DEPLOY_URL;
const isProduction = isRealNetlifyDeployment || process.env.CI === 'true';

// Sentry is only enabled for real Netlify deployments (when NETLIFY_BUILD_BASE is set)

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://cro.cafe',
  integrations: [
    // guestImageValidation(),
    sentry({
      dsn: "https://25fc8e72182ba318ffdde5b0e9913c22@o4509612269830144.ingest.de.sentry.io/4509612285558864",
      sampleRate: 1.0, // 100% of errors will be sent
      tracesSampleRate: 1.0, // 100% sampling for testing mode
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      // Setting this option to true will send default PII data to Sentry.
      // For example, automatic IP address collection on events
      sendDefaultPii: true,
      sourceMapsUploadOptions: process.env.SENTRY_AUTH_TOKEN && isProduction ? {
        org: "x-jkj", // Add your Sentry organization slug here
        project: "crocafe-dev",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      } : {
        disable: true, // Disable source map upload in local dev
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
               !page.includes('-test') &&
               !page.includes('/_') &&
               !page.includes('/api/') &&
               !page.includes('/404');
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
    // Broken links checker - commented out for production build
    // astroBrokenLinksChecker({
    //   logFilePath: './broken-links.log',
    //   checkExternalLinks: false, // Start with internal only, enable external later
    //   cache: true,
    //   parallel: true,
    //   excludeUrls: [
    //     // Exclude known external URLs that might be flaky
    //     /^https?:\/\/linkedin\.com/,
    //     /^https?:\/\/twitter\.com/,
    //     /^https?:\/\/youtube\.com/,
    //     // Exclude anchor links
    //     /^#/,
    //     // Exclude mailto and tel links
    //     /^mailto:/,
    //     /^tel:/
    //   ]
    // })
  ],
  // Redirects are handled in netlify.toml for better performance and subdomain support
  redirects: {},
  image: {
    // Configure allowed external domains for Astro's Image component
    // This enables optimization of external images (like episode artwork from Transistor.fm)
    domains: ['img.transistor.fm', 'media.transistor.fm', 'images.transistor.fm'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.transistor.fm'
      }
    ],
    // Enable responsive images (Astro 5.10 stable feature)
    experimentalLayout: true,
    // Default image quality
    quality: 85,
    // Default image formats (prioritize modern formats)
    formats: ['avif', 'webp', 'jpeg'],
    // Enable eager loading for above-the-fold images
    loading: 'eager'
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
  prefetch: {
    // Prefetch links when they become visible
    prefetchAll: true,
    // Use intersection observer for better performance
    defaultStrategy: 'viewport'
  },
  build: {
    // Optimize build output
    assets: '_astro',
    inlineStylesheets: 'auto',
    // Split code for better caching
    splitting: true,
    // Compress output
    compress: true,
    // Enable critical CSS extraction
    experimental: {
      directCSS: true
    }
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['lightningcss'],
      // Pre-bundle dependencies for faster dev starts
      include: ['react', 'react-dom', 'date-fns']
    },
    build: {
      // Optimize chunk size
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // More aggressive code splitting for better caching
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('@nanostores/react')) {
                return 'react-vendor';
              }
              if (id.includes('date-fns')) {
                return 'date-vendor';
              }
              if (id.includes('astro') || id.includes('@astrojs')) {
                return 'astro-vendor';
              }
              if (id.includes('sentry')) {
                return 'sentry-vendor';
              }
              return 'vendor';
            }
            // Split by feature/page
            if (id.includes('/components/')) {
              return 'components';
            }
            if (id.includes('/lib/') || id.includes('/utils/')) {
              return 'utils';
            }
          },
          // Optimize asset file names for better caching
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name.split('.').pop();
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `assets/img/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(extType)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          }
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable modern JavaScript features
      target: 'es2022',
      // Optimize CSS
      cssCodeSplit: true,
      // Minify more aggressively
      minify: 'esbuild',
      // Generate source maps for debugging but keep them external
      sourcemap: false,
      // Additional optimizations for better performance
      reportCompressedSize: false,
      // Preload module directive for better module loading
      modulePreload: {
        polyfill: true
      }
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