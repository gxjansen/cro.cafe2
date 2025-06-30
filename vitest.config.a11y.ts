import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/accessibility-setup.ts'],
    include: ['tests/**/*.a11y.test.{js,ts,jsx,tsx}'],
    pool: 'forks' // Use forks to avoid esbuild issues
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      // Mock astro:content to avoid server-only module errors
      'astro:content': path.resolve(__dirname, './tests/mocks/astro-content.ts'),
      // Mock content utilities
      '@/utils/content': path.resolve(__dirname, './tests/mocks/content-utils.ts')
    }
  }
})