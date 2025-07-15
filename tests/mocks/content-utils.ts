// Mock for content utilities
export const getLanguageCounts = () => Promise.resolve({
  global: { episodes: 50, guests: 25 },
  en: { episodes: 20, guests: 10 },
  nl: { episodes: 15, guests: 8 },
  de: { episodes: 10, guests: 5 },
  es: { episodes: 5, guests: 2 }
})