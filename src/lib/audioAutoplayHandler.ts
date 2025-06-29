// Handle browser autoplay policies and mobile restrictions
export class AudioAutoplayHandler {
  private static hasUserInteraction = false
  private static isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  private static isAndroid = /Android/.test(navigator.userAgent)

  // Track user interaction
  static {
    if (typeof window !== 'undefined') {
      ['click', 'touchstart', 'keydown'].forEach(event => {
        window.addEventListener(event, () => {
          this.hasUserInteraction = true
        }, { once: true, passive: true })
      })
    }
  }

  static canAutoplay(): boolean {
    // Most browsers require user interaction for autoplay
    return this.hasUserInteraction
  }

  static async testAutoplay(): Promise<boolean> {
    try {
      const audio = new Audio()
      audio.volume = 0
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        await playPromise
        audio.pause()
        return true
      }
      return false
    } catch {
      return false
    }
  }

  static getMobilePlaybackTips(): string[] {
    if (this.isIOS) {
      return [
        'iOS requires user interaction to start audio playback',
        'Tap the play button to begin',
        'Audio will continue playing in the background'
      ]
    }

    if (this.isAndroid) {
      return [
        'Android may pause audio when switching apps',
        'Use notification controls to resume playback',
        'Consider using Chrome for best experience'
      ]
    }

    return []
  }

  static async handlePlayAttempt(playFunction: () => Promise<void>): Promise<{
    success: boolean;
    error?: string;
    requiresUserAction?: boolean;
  }> {
    try {
      await playFunction()
      return { success: true }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Playback requires user interaction',
          requiresUserAction: true
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}