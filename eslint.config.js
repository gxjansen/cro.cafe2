import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import eslintPluginAstro from 'eslint-plugin-astro'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      '.astro/**',
      'node_modules/**',
      'backup/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs'
    ]
  },
  // JavaScript and TypeScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off', // Turned off in favor of TypeScript version
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'dot-notation': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'no-throw-literal': 'error',
      
      // Style
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'never'],
      'comma-dangle': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'indent': ['error', 2, { SwitchCase: 1 }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never']
    }
  },
  // Astro files - use the recommended config
  ...eslintPluginAstro.configs.recommended,
  // Override some Astro rules
  {
    files: ['**/*.astro'],
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      // Disable style rules for Astro files as they can conflict
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',
      'no-trailing-spaces': 'off',
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  // Test files
  {
    files: ['tests/**/*.{js,ts}', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off'
    }
  }
]