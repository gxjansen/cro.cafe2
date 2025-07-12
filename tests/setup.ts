import { vi } from 'vitest'

// Mock environment variables for testing
process.env.NOCODB_API_KEY = 'test-api-key'
process.env.NOCODB_BASE_URL = 'http://localhost:8080'
process.env.NODE_ENV = 'test'

// Mock Astro modules
vi.mock('astro:content', () => ({
  getCollection: vi.fn().mockResolvedValue([]),
  getEntry: vi.fn().mockResolvedValue(null),
  getEntries: vi.fn().mockResolvedValue([]),
  getEntryBySlug: vi.fn().mockResolvedValue(null),
  reference: vi.fn(),
  defineCollection: vi.fn(),
  z: vi.fn()
}))

// Global test utilities
global.testTimeout = 10000

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}

// Clean up after each test
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.resetAllMocks()
})