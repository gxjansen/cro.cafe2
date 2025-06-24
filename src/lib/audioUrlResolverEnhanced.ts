/**
 * Enhanced Audio URL Resolver with multiple fallback strategies
 * Handles Transistor.fm redirects with maximum reliability
 */

interface ResolverStrategy {
  name: string;
  resolve: (url: string) => Promise<string>;
}

export class AudioUrlResolverEnhanced {
  private cache = new Map<string, { url: string; timestamp: number }>();
  private readonly CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
  
  /**
   * Main resolution method with multiple strategies
   */
  async resolveUrl(url: string): Promise<string> {
    // Check if it's a Transistor URL that needs resolution
    if (!url.includes('media.transistor.fm')) {
      return url;
    }

    // Check cache
    const cached = this.getCached(url);
    if (cached) return cached;

    // Try resolution strategies in order
    const strategies: ResolverStrategy[] = [
      { name: 'Server API', resolve: (url) => this.resolveViaServerApi(url) },
      { name: 'Fetch HEAD', resolve: (url) => this.resolveViaFetchHead(url) },
      { name: 'Image Preload', resolve: (url) => this.resolveViaImagePreload(url) },
      { name: 'Audio Preload', resolve: (url) => this.resolveViaAudioPreload(url) },
    ];

    for (const strategy of strategies) {
      try {
        console.log(`🎵 Trying ${strategy.name} resolution...`);
        const resolved = await strategy.resolve(url);
        if (resolved && resolved !== url) {
          console.log(`✅ ${strategy.name} resolved to:`, resolved);
          this.setCache(url, resolved);
          return resolved;
        }
      } catch (error) {
        console.warn(`⚠️ ${strategy.name} failed:`, error);
      }
    }

    // All strategies failed, return original
    console.warn('⚠️ All resolution strategies failed, using original URL');
    return url;
  }

  /**
   * Strategy 1: Server-side API resolution (most reliable)
   */
  private async resolveViaServerApi(url: string): Promise<string> {
    const response = await fetch('/api/resolve-audio-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) throw new Error('Server API failed');
    
    const data = await response.json();
    return data.resolvedUrl || url;
  }

  /**
   * Strategy 2: Fetch with HEAD request
   */
  private async resolveViaFetchHead(url: string): Promise<string> {
    // Try to get the redirect URL using a HEAD request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'manual'
      });

      clearTimeout(timeout);

      // Check for redirect status
      if (response.status === 301 || response.status === 302) {
        const location = response.headers.get('Location');
        if (location) return location;
      }

      // Some browsers expose the final URL
      if ('url' in response && response.url !== url) {
        return response.url;
      }
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }

    return url;
  }

  /**
   * Strategy 3: Image preload trick
   * Uses the fact that images follow redirects and expose final URL
   */
  private async resolveViaImagePreload(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.src = '';
        reject(new Error('Image preload timeout'));
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        // Try to extract the final URL from currentSrc
        const finalUrl = img.currentSrc || img.src;
        resolve(finalUrl);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image preload failed'));
      };

      // Set crossOrigin to handle CORS
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }

  /**
   * Strategy 4: Audio element preload
   * Creates a temporary audio element to resolve the URL
   */
  private async resolveViaAudioPreload(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const timeout = setTimeout(() => {
        audio.src = '';
        reject(new Error('Audio preload timeout'));
      }, 5000);

      audio.addEventListener('loadstart', () => {
        clearTimeout(timeout);
        // The audio element might expose the resolved URL
        const finalUrl = audio.currentSrc || audio.src;
        audio.src = ''; // Clean up
        resolve(finalUrl);
      });

      audio.addEventListener('error', () => {
        clearTimeout(timeout);
        audio.src = ''; // Clean up
        reject(new Error('Audio preload failed'));
      });

      // Set preload to metadata only
      audio.preload = 'metadata';
      audio.src = url;
    });
  }

  /**
   * Cache management
   */
  private getCached(url: string): string | null {
    const cached = this.cache.get(url);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(url);
      return null;
    }

    return cached.url;
  }

  private setCache(originalUrl: string, resolvedUrl: string): void {
    this.cache.set(originalUrl, {
      url: resolvedUrl,
      timestamp: Date.now()
    });

    // Persist to localStorage
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('audioUrlResolverCache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  loadCache(): void {
    try {
      const stored = localStorage.getItem('audioUrlResolverCache');
      if (stored) {
        const entries: [string, { url: string; timestamp: number }][] = JSON.parse(stored);
        const now = Date.now();
        
        entries.forEach(([key, value]) => {
          if (now - value.timestamp < this.CACHE_TTL) {
            this.cache.set(key, value);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }

  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('audioUrlResolverCache');
  }
}

// Export singleton
export const audioUrlResolverEnhanced = new AudioUrlResolverEnhanced();