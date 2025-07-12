import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/e2e/**', // Exclude E2E tests from unit test runs
      '**/*.e2e.test.ts',
      '**/mobile-enhancements.test.js', // Jest test file
      '**/brand-logos-visibility.test.js' // Jest test file
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.astro/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/*',
        'src/env.d.ts'
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90
      }
    },
    setupFiles: ['./tests/setup.ts']
  }
})