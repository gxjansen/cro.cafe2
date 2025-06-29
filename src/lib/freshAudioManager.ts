/**
 * Fresh Audio Manager - Absolutely minimal implementation
 */

export class FreshAudioManager {
  private audio: HTMLAudioElement | null = null

  constructor() {
    console.log('🎵 Fresh Audio Manager constructor')
  }

  createAudio() {
    console.log('🎵 Creating fresh audio element')
    this.audio = new Audio()

    // Log all events
    const events = [
      'loadstart', 'progress', 'suspend', 'abort', 'error', 'emptied',
      'stalled', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough',
      'playing', 'waiting', 'seeking', 'seeked', 'ended', 'durationchange',
      'timeupdate', 'play', 'pause', 'ratechange', 'volumechange'
    ]

    events.forEach(event => {
      this.audio!.addEventListener(event, (e) => {
        console.log(`🎵 Event: ${event}`, e)
        if (event === 'error' && this.audio!.error) {
          console.error('🎵 Error details:', this.audio!.error)
        }
      })
    })
  }

  async testPlay(url: string): Promise<boolean> {
    console.log('🎵 testPlay called with:', url)

    if (!this.audio) {
      this.createAudio()
    }

    console.log('🎵 Setting src')
    this.audio!.src = url

    console.log('🎵 Waiting 1 second...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('🎵 Audio state:', {
      readyState: this.audio!.readyState,
      networkState: this.audio!.networkState,
      error: this.audio!.error,
      duration: this.audio!.duration,
      currentSrc: this.audio!.currentSrc
    })

    try {
      console.log('🎵 Attempting play...')
      await this.audio!.play()
      console.log('🎵 ✅ Play successful!')
      return true
    } catch (err: any) {
      console.error('🎵 ❌ Play failed:', err)
      return false
    }
  }
}

// Export singleton
export const freshAudioManager = new FreshAudioManager()

// Expose globally
if (typeof window !== 'undefined') {
  (window as any).freshAudioManager = freshAudioManager
}