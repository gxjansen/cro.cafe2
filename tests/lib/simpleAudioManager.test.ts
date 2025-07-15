import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { simpleAudioManager } from '../../src/lib/simpleAudioManager'
import type { Episode } from '../../src/stores/audioPlayerStore'

// Mock HTMLAudioElement
class MockHTMLAudioElement extends EventTarget {
  src = ''
  currentTime = 0
  duration = 300
  paused = true
  playbackRate = 1
  volume = 1
  preload = 'auto'
  readyState = 0
  networkState = 0
  error: MediaError | null = null
  buffered = {
    length: 0,
    start: () => 0,
    end: () => 0
  }

  constructor() {
    super()
  }

  async play() {
    if (this.readyState < 2) {
      throw new Error('NotAllowedError: play() failed because the user didn\'t interact with the document first')
    }
    this.paused = false
    this.dispatchEvent(new Event('play'))
    return Promise.resolve()
  }

  pause() {
    this.paused = true
    this.dispatchEvent(new Event('pause'))
  }

  load() {
    this.dispatchEvent(new Event('loadstart'))
    // Simulate async loading
    setTimeout(() => {
      this.readyState = 1
      this.dispatchEvent(new Event('loadedmetadata'))
      setTimeout(() => {
        this.readyState = 3
        this.dispatchEvent(new Event('canplay'))
      }, 10)
    }, 10)
  }
}

// Setup and teardown
beforeEach(() => {
  // Mock window
  global.window = {
    dispatchEvent: vi.fn(),
    Audio: MockHTMLAudioElement
  } as any

  // Mock Audio constructor
  global.Audio = MockHTMLAudioElement as any

  // Clear any existing singleton
  if ((global.window as any).__simpleAudioManager) {
    delete (global.window as any).__simpleAudioManager
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('SimpleAudioManager', () => {
  const mockEpisode: Episode = {
    id: 'test-episode-123',
    title: 'Test Episode',
    audioUrl: 'https://example.com/audio.mp3',
    description: 'Test description',
    publishedAt: new Date().toISOString(),
    duration: '45:00',
    imageUrl: 'https://example.com/image.jpg',
    hosts: ['Host 1'],
    guests: ['Guest 1']
  }

  describe('Initialization', () => {
    it('should create a singleton instance', () => {
      const manager1 = simpleAudioManager
      const manager2 = simpleAudioManager
      expect(manager1).toBe(manager2)
    })

    it('should create audio element on initialization', () => {
      const manager = simpleAudioManager
      expect(manager.audioElement).toBeDefined()
      expect(manager.audioElement?.preload).toBe('auto')
    })

    it('should store instance globally for debugging', () => {
      const manager = simpleAudioManager
      expect((window as any).simpleAudioManager).toBe(manager)
      expect((window as any).__simpleAudioManager).toBe(manager)
    })
  })

  describe('Episode Loading', () => {
    it('should load episode with correct URL', async () => {
      const manager = simpleAudioManager
      await manager.loadEpisode(mockEpisode)

      expect(manager.audioElement?.src).toBe(mockEpisode.audioUrl)
    })

    it('should reset audio state when loading new episode', async () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement

      // Set some state
      audio.currentTime = 100
      audio.paused = false

      // Load new episode
      await manager.loadEpisode(mockEpisode)

      expect(audio.currentTime).toBe(0)
      expect(audio.paused).toBe(true)
    })

    it('should call load() to force loading', async () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      const loadSpy = vi.spyOn(audio, 'load')

      await manager.loadEpisode(mockEpisode)

      expect(loadSpy).toHaveBeenCalled()
    })

    it('should dispatch audioLoadStart event', async () => {
      const manager = simpleAudioManager
      await manager.loadEpisode(mockEpisode)

      // Wait for load event
      await new Promise(resolve => setTimeout(resolve, 5))

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'audioLoadStart' })
      )
    })
  })

  describe('Playback Control', () => {
    beforeEach(async () => {
      const manager = simpleAudioManager
      await manager.loadEpisode(mockEpisode)
      // Wait for audio to be ready
      await new Promise(resolve => setTimeout(resolve, 30))
    })

    it('should play audio when ready', async () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.readyState = 3 // HAVE_FUTURE_DATA

      const result = await manager.play()

      expect(result).toBe(true)
      expect(audio.paused).toBe(false)
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'audioPlay' })
      )
    })

    it('should wait for canplay event if not ready', async () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.readyState = 1 // HAVE_METADATA

      const playPromise = manager.play()

      // Simulate canplay after delay
      setTimeout(() => {
        audio.readyState = 3
        audio.dispatchEvent(new Event('canplay'))
      }, 10)

      const result = await playPromise
      expect(result).toBe(true)
    })

    it('should handle play errors gracefully', async () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.readyState = 0 // HAVE_NOTHING

      // Mock play to throw error
      audio.play = vi.fn().mockRejectedValue(new Error('NotAllowedError'))

      const result = await manager.play()

      expect(result).toBe(false)
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioError',
          detail: { error: 'Error: NotAllowedError' }
        })
      )
    })

    it('should pause audio', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.paused = false

      manager.pause()

      expect(audio.paused).toBe(true)
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'audioPause' })
      )
    })

    it('should toggle play/pause correctly', async () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.readyState = 3

      // Initially paused
      expect(audio.paused).toBe(true)

      // Toggle to play
      await manager.togglePlayPause()
      expect(audio.paused).toBe(false)

      // Toggle to pause
      await manager.togglePlayPause()
      expect(audio.paused).toBe(true)
    })
  })

  describe('Seeking and Navigation', () => {
    beforeEach(async () => {
      const manager = simpleAudioManager
      await manager.loadEpisode(mockEpisode)
    })

    it('should seek to specific time', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement

      manager.seek(120)
      expect(audio.currentTime).toBe(120)
    })

    it('should skip forward by default 30 seconds', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.currentTime = 60

      manager.skipForward()
      expect(audio.currentTime).toBe(90)
    })

    it('should skip forward by custom amount', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.currentTime = 60

      manager.skipForward(15)
      expect(audio.currentTime).toBe(75)
    })

    it('should not skip forward past duration', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.currentTime = 290
      audio.duration = 300

      manager.skipForward(30)
      expect(audio.currentTime).toBe(300)
    })

    it('should skip backward by default 15 seconds', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.currentTime = 60

      manager.skipBackward()
      expect(audio.currentTime).toBe(45)
    })

    it('should skip backward by custom amount', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.currentTime = 60

      manager.skipBackward(30)
      expect(audio.currentTime).toBe(30)
    })

    it('should not skip backward past 0', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.currentTime = 10

      manager.skipBackward(30)
      expect(audio.currentTime).toBe(0)
    })
  })

  describe('Playback Settings', () => {
    beforeEach(async () => {
      const manager = simpleAudioManager
      await manager.loadEpisode(mockEpisode)
    })

    it('should set playback rate', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement

      manager.setPlaybackRate(1.5)
      expect(audio.playbackRate).toBe(1.5)
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioPlaybackRateChange',
          detail: { playbackRate: 1.5 }
        })
      )
    })

    it('should set volume', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement

      manager.setVolume(0.5)
      expect(audio.volume).toBe(0.5)
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioVolumeChange',
          detail: { volume: 0.5 }
        })
      )
    })

    it('should clamp volume between 0 and 1', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement

      manager.setVolume(1.5)
      expect(audio.volume).toBe(1)

      manager.setVolume(-0.5)
      expect(audio.volume).toBe(0)
    })
  })

  describe('State Management', () => {
    it('should return default state when no audio', () => {
      // Create manager without audio element
      const manager = simpleAudioManager
      ;(manager as any).audio = null

      const state = manager.getState()
      expect(state).toEqual({
        currentTime: 0,
        duration: 0,
        paused: true,
        volume: 1,
        playbackRate: 1,
        episode: null,
        isLoading: false
      })
    })

    it('should return current state with episode', async () => {
      const manager = simpleAudioManager
      await manager.loadEpisode(mockEpisode)

      const audio = manager.audioElement as MockHTMLAudioElement
      audio.currentTime = 120
      audio.duration = 300
      audio.paused = false
      audio.volume = 0.8
      audio.playbackRate = 1.25

      const state = manager.getState()
      expect(state).toEqual({
        currentTime: 120,
        duration: 300,
        paused: false,
        volume: 0.8,
        playbackRate: 1.25,
        episode: mockEpisode,
        isLoading: false
      })
    })
  })

  describe('Event Handling', () => {
    beforeEach(async () => {
      const manager = simpleAudioManager
      await manager.loadEpisode(mockEpisode)
    })

    it('should dispatch custom events for timeupdate', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.currentTime = 45

      audio.dispatchEvent(new Event('timeupdate'))

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioTimeUpdate',
          detail: { currentTime: 45 }
        })
      )
    })

    it('should dispatch custom events for duration change', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement
      audio.duration = 600

      audio.dispatchEvent(new Event('loadedmetadata'))

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioDurationChange',
          detail: { duration: 600 }
        })
      )
    })

    it('should dispatch ended event', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement

      audio.dispatchEvent(new Event('ended'))

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'audioEnded' })
      )
    })

    it('should handle error events', () => {
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement

      audio.dispatchEvent(new Event('error'))

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audioError',
          detail: { error: 'Failed to load audio' }
        })
      )
    })
  })

  describe('Network State Monitoring', () => {
    it('should log network state changes', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement

      audio.dispatchEvent(new Event('suspend'))
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspend event')
      )

      audio.dispatchEvent(new Event('stalled'))
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stalled event')
      )
    })

    it('should log buffering progress', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const manager = simpleAudioManager
      const audio = manager.audioElement as MockHTMLAudioElement

      // Mock buffered ranges
      audio.buffered = {
        length: 1,
        start: () => 0,
        end: () => 150
      }

      audio.dispatchEvent(new Event('progress'))
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Progress event - buffered: 1')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Buffered range: 0 - 150')
      )
    })
  })
})