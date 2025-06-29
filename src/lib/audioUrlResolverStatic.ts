/**
 * Static Audio URL Resolver
 * Handles audio URL resolution for static builds without server-side API
 * Uses a different approach that works with CORS restrictions
 */

interface ResolvedUrl {
  originalUrl: string;
  resolvedUrl: string;
  timestamp: number;
  ttl: number;
}

class StaticAudioUrlResolver {
  private cache: Map<string, ResolvedUrl> = new Map()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  private readonly CACHE_KEY = 'audio_url_cache_v2'
  private pendingRequests: Map<string, Promise<string>> = new Map()

  constructor() {
    this.loadCacheFromStorage()
  }

  private loadCacheFromStorage() {
    if (typeof window === 'undefined') {return}

    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        const now = Date.now()
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value.timestamp + value.ttl > now) {
            this.cache.set(key, value)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load URL cache from storage:', error)
    }
  }

  private saveCacheToStorage() {
    if (typeof window === 'undefined') {return}

    try {
      const data: Record<string, ResolvedUrl> = {}
      this.cache.forEach((value, key) => {
        data[key] = value
      })
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save URL cache to storage:', error)
    }
  }

  private needsResolution(url: string): boolean {
    return url.includes('media.transistor.fm')
  }

  private getCachedUrl(originalUrl: string): string | null {
    const cached = this.cache.get(originalUrl)
    if (cached && cached.timestamp + cached.ttl > Date.now()) {
      console.log('🎵 Using cached URL for:', originalUrl)
      return cached.resolvedUrl
    }
    return null
  }

  private cacheUrl(originalUrl: string, resolvedUrl: string) {
    const entry: ResolvedUrl = {
      originalUrl,
      resolvedUrl,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    }
    this.cache.set(originalUrl, entry)
    this.saveCacheToStorage()
  }

  /**
   * Try to resolve URL by creating a temporary audio element
   * This works because the browser will follow redirects when loading audio
   */
  private async resolveViaAudioElement(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('🎵 Trying audio element resolution...')

      const audio = new Audio()
      let resolved = false

      const cleanup = () => {
        audio.src = ''
        audio.load()
      }

      // Set a timeout
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          cleanup()
          console.log('🎵 Audio element resolution timed out, using original URL')
          resolve(url)
        }
      }, 5000)

      // Listen for successful load
      audio.addEventListener('loadstart', () => {
        // The audio element will have followed any redirects
        // We can try to extract the final URL from the audio element
        if (audio.currentSrc && audio.currentSrc !== url) {
          resolved = true
          clearTimeout(timeout)
          cleanup()
          console.log('🎵 Resolved via audio element:', audio.currentSrc)
          resolve(audio.currentSrc)
        }
      })

      audio.addEventListener('error', () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          cleanup()
          console.warn('🎵 Audio element resolution failed')
          resolve(url)
        }
      })

      // Start loading
      audio.src = url
      audio.load()
    })
  }

  /**
   * Use known URL patterns for Transistor.fm
   * This is a fallback that uses our knowledge of how Transistor URLs work
   */
  private async resolveViaKnownPatterns(url: string): Promise<string> {
    // Known pattern: media.transistor.fm redirects often follow a pattern
    // This is based on observed behavior and may need updates
    if (url.includes('media.transistor.fm')) {
      // For now, we'll return the original URL since we can't reliably predict the redirect
      // In production, you might maintain a mapping of known redirects
      console.log('🎵 Using known patterns (no reliable pattern found)')
      return url
    }
    return url
  }

  async resolveUrl(url: string): Promise<string> {
    // For non-Transistor URLs, return as-is
    if (!this.needsResolution(url)) {
      return url
    }

    // Check cache first
    const cached = this.getCachedUrl(url)
    if (cached) {
      return cached
    }

    // Check pending requests
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url)!
    }

    // Create resolution promise
    const resolutionPromise = this.performResolution(url)
    this.pendingRequests.set(url, resolutionPromise)

    try {
      const resolvedUrl = await resolutionPromise
      this.pendingRequests.delete(url)
      return resolvedUrl
    } catch (error) {
      this.pendingRequests.delete(url)
      throw error
    }
  }

  private async performResolution(url: string): Promise<string> {
    console.log('🎵 Resolving audio URL (static mode):', url)

    // For static builds, we have limited options
    // The audio element approach might work in some cases
    try {
      const resolvedUrl = await this.resolveViaAudioElement(url)
      if (resolvedUrl && resolvedUrl !== url) {
        this.cacheUrl(url, resolvedUrl)
        return resolvedUrl
      }
    } catch (error) {
      console.warn('🎵 Resolution failed:', error)
    }

    // If resolution fails, we'll use the original URL
    // The browser's audio element will handle the redirect automatically
    console.log('🎵 Using original URL (browser will handle redirect)')
    return url
  }

  clearCache() {
    this.cache.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY)
    }
    console.log('🎵 Audio URL cache cleared')
  }

  getCacheStats() {
    const now = Date.now()
    let valid = 0
    let expired = 0

    this.cache.forEach((entry) => {
      if (entry.timestamp + entry.ttl > now) {
        valid++
      } else {
        expired++
      }
    })

    return {
      total: this.cache.size,
      valid,
      expired,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        originalUrl: key,
        resolvedUrl: value.resolvedUrl,
        age: Math.floor((now - value.timestamp) / 1000 / 60),
        expires: Math.floor((value.timestamp + value.ttl - now) / 1000 / 60)
      }))
    }
  }
}

// Export singleton instance
export const audioUrlResolver = new StaticAudioUrlResolver()

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).audioUrlResolver = audioUrlResolver
}