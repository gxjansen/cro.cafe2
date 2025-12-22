import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://cro.cafe',
  integrations: [
    react(),
    mdx(),
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
    // Enable responsive images (Astro 5.10+ stable feature)
    // Options: 'constrained' | 'fixed' | 'full-width' | 'none'
    layout: 'constrained',
    // Default image quality
    quality: 85,
    // Default image formats (prioritize modern formats)
    formats: ['avif', 'webp', 'jpeg'],
    // Enable eager loading for above-the-fold images
    loading: 'eager'
  },
  // Note: i18n routing is managed manually via [lang] routes
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
      // Chunk size warning limit (Vite default is 500)
      chunkSizeWarningLimit: 500,
      // Enable modern JavaScript features
      target: 'es2022',
      // Optimize CSS
      cssCodeSplit: true,
      // Use terser for better minification compatibility
      minify: 'terser',
      terserOptions: {
        compress: {
          // Keep function names to avoid minification issues
          keep_fnames: true,
          // Drop console logs in production for smaller bundles
          drop_console: true,
          drop_debugger: true
        },
        mangle: {
          // Don't mangle function names
          keep_fnames: true
        }
      },
      // Enable source maps for production debugging
      sourcemap: 'hidden',
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