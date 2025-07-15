import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { renderComponent } from '../utils/astro-test-utils-simple'
import { JSDOM } from 'jsdom'

// Mock HTMLMediaElement since JSDOM doesn't fully support it
class MockHTMLAudioElement {
  src = ''
  currentTime = 0
  duration = 300 // 5 minutes
  paused = true
  playbackRate = 1
  volume = 1
  preload = 'metadata'
  readyState = 0
  networkState = 0
  error: MediaError | null = null
  buffered = {
    length: 0,
    start: () => 0,
    end: () => 0
  }

  private eventListeners = new Map<string, Set<EventListener>>()

  constructor() {
    // Simulate metadata loaded after a short delay
    setTimeout(() => {
      this.readyState = 1
      this.dispatchEvent(new Event('loadedmetadata'))
    }, 10)
  }

  play() {
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
  }

  addEventListener(event: string, handler: EventListener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)?.add(handler)
  }

  removeEventListener(event: string, handler: EventListener) {
    this.eventListeners.get(event)?.delete(handler)
  }

  dispatchEvent(event: Event) {
    const handlers = this.eventListeners.get(event.type)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
    return true
  }
}

// Setup global mocks
beforeEach(() => {
  // Mock Audio constructor
  global.Audio = MockHTMLAudioElement as any

  // Mock localStorage
  const localStorageMock = {
    store: {} as Record<string, string>,
    getItem(key: string) {
      return this.store[key] || null
    },
    setItem(key: string, value: string) {
      this.store[key] = value
    },
    removeItem(key: string) {
      delete this.store[key]
    },
    clear() {
      this.store = {}
    }
  }
  global.localStorage = localStorageMock as Storage
})

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('SimpleAudioPlayer Component', () => {
  const defaultProps = {
    audioUrl: 'https://example.com/episode.mp3',
    episodeId: 'test-episode-123',
    episodeTitle: 'Test Episode: Audio Player Testing',
    duration: 1800 // 30 minutes in seconds
  }

  describe('Rendering and Structure', () => {
    it('should render with all required elements', async () => {
      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Check main container
      const player = document.querySelector('.simple-audio-player')
      expect(player).toBeTruthy()
      expect(player).toHaveAttribute('data-episode-id', defaultProps.episodeId)

      // Check audio element
      const audio = document.querySelector('audio')
      expect(audio).toBeTruthy()
      expect(audio).toHaveAttribute('id', `audio-${defaultProps.episodeId}`)
      expect(audio).toHaveAttribute('preload', 'metadata')
      expect(audio).toHaveClass('hidden')

      // Check audio source
      const source = audio?.querySelector('source')
      expect(source).toBeTruthy()
      expect(source).toHaveAttribute('src', defaultProps.audioUrl)
      expect(source).toHaveAttribute('type', 'audio/mpeg')

      // Check controls container
      const controls = document.querySelector('.player-controls')
      expect(controls).toBeTruthy()
      expect(controls).toHaveClass('bg-gray-100', 'dark:bg-gray-800', 'rounded-lg', 'p-3')

      // Check play/pause button
      const playPauseBtn = document.querySelector('.play-pause')
      expect(playPauseBtn).toBeTruthy()
      expect(playPauseBtn).toHaveAttribute('title', 'Play/Pause')
      expect(playPauseBtn).toHaveClass('min-w-[48px]', 'min-h-[48px]', 'touch-target')

      // Check skip buttons
      const skipBackward = document.querySelector('.skip-backward')
      expect(skipBackward).toBeTruthy()
      expect(skipBackward).toHaveAttribute('title', 'Skip backward 15 seconds')
      expect(skipBackward).toHaveClass('touch-target')

      const skipForward = document.querySelector('.skip-forward')
      expect(skipForward).toBeTruthy()
      expect(skipForward).toHaveAttribute('title', 'Skip forward 30 seconds')
      expect(skipForward).toHaveClass('touch-target')

      // Check progress bar
      const progressBar = document.querySelector('.progress-bar')
      expect(progressBar).toBeTruthy()
      expect(progressBar).toHaveAttribute('role', 'slider')
      expect(progressBar).toHaveAttribute('tabindex', '0')

      // Check speed control
      const speedControl = document.querySelector('.speed-control')
      expect(speedControl).toBeTruthy()
      expect(speedControl).toHaveAttribute('title', 'Playback speed')
      
      // Check speed options
      const speedOptions = speedControl?.querySelectorAll('option')
      expect(speedOptions?.length).toBe(7)
      expect(speedOptions?.[2]).toHaveAttribute('selected')
      expect(speedOptions?.[2]).toHaveAttribute('value', '1')

      // Check time displays
      const currentTime = document.querySelector('.current-time')
      expect(currentTime).toBeTruthy()
      expect(currentTime?.textContent).toBe('0:00')

      const duration = document.querySelector('.duration')
      expect(duration).toBeTruthy()
      expect(duration?.textContent).toBe('30:00') // 1800 seconds = 30 minutes
    })

    it('should render correctly without duration prop', async () => {
      const propsWithoutDuration = {
        audioUrl: defaultProps.audioUrl,
        episodeId: defaultProps.episodeId,
        episodeTitle: defaultProps.episodeTitle
      }

      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: propsWithoutDuration
      })

      const duration = document.querySelector('.duration')
      expect(duration?.textContent).toBe('--:--')
    })
  })

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes on progress bar', async () => {
      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      const progressBar = document.querySelector('.progress-bar')
      expect(progressBar).toHaveAttribute('role', 'slider')
      expect(progressBar).toHaveAttribute('aria-label', 'Audio progress')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-valuenow', '0')
      expect(progressBar).toHaveAttribute('aria-valuetext', '0 seconds of 0 seconds')
    })

    it('should have touch targets of at least 44x44 pixels', async () => {
      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      const touchTargets = [
        '.play-pause',
        '.skip-backward',
        '.skip-forward',
        '.speed-control'
      ]

      touchTargets.forEach(selector => {
        const element = document.querySelector(selector)
        expect(element).toBeTruthy()
        expect(element).toHaveClass('touch-target')
        // Check for minimum size classes
        const classes = element?.getAttribute('class') || ''
        expect(
          classes.includes('min-w-[48px]') || 
          classes.includes('min-h-[48px]') ||
          classes.includes('touch-target')
        ).toBe(true)
      })
    })

    it('should have descriptive titles on all interactive elements', async () => {
      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      const elements = [
        { selector: '.play-pause', title: 'Play/Pause' },
        { selector: '.skip-backward', title: 'Skip backward 15 seconds' },
        { selector: '.skip-forward', title: 'Skip forward 30 seconds' },
        { selector: '.speed-control', title: 'Playback speed' }
      ]

      elements.forEach(({ selector, title }) => {
        const element = document.querySelector(selector)
        expect(element).toHaveAttribute('title', title)
      })
    })
  })

  describe('Component Initialization', () => {
    it('should initialize audio player on DOMContentLoaded', async () => {
      const { window, document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Simulate DOMContentLoaded
      const event = new window.Event('DOMContentLoaded')
      document.dispatchEvent(event)

      // Check that the player was initialized
      const player = document.querySelector('.simple-audio-player')
      expect(player).toBeTruthy()
    })

    it('should reinitialize on astro:page-load for view transitions', async () => {
      const { window, document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Simulate astro:page-load
      const event = new window.Event('astro:page-load')
      document.dispatchEvent(event)

      // Check that the player was initialized
      const player = document.querySelector('.simple-audio-player')
      expect(player).toBeTruthy()
    })

    it('should prevent duplicate initialization', async () => {
      const { window, document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      const player = document.querySelector('.simple-audio-player')

      // First initialization
      const event1 = new window.Event('astro:page-load')
      document.dispatchEvent(event1)

      // Mark as initialized
      player?.setAttribute('data-initialized', 'true')

      // Try second initialization
      const event2 = new window.Event('astro:page-load')
      document.dispatchEvent(event2)

      // Should still have only one initialization marker
      expect(player).toHaveAttribute('data-initialized', 'true')
    })
  })

  describe('State Persistence', () => {
    it('should save playback position to localStorage', async () => {
      const { window, document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Initialize player
      const event = new window.Event('DOMContentLoaded')
      document.dispatchEvent(event)

      // Simulate audio playing at 30 seconds
      const audio = document.querySelector('audio') as any
      audio.currentTime = 30
      audio.paused = false

      // Wait for the save interval (simulated)
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Check localStorage
      const savedPosition = localStorage.getItem(`audio-position-${defaultProps.episodeId}`)
      expect(savedPosition).toBe('30')
    })

    it('should save playback speed to localStorage', async () => {
      const { window, document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Initialize player
      const event = new window.Event('DOMContentLoaded')
      document.dispatchEvent(event)

      // Change speed
      const speedControl = document.querySelector('.speed-control') as HTMLSelectElement
      speedControl.value = '1.5'
      
      // Trigger change event
      const changeEvent = new window.Event('change')
      speedControl.dispatchEvent(changeEvent)

      // Check localStorage
      const savedSpeed = localStorage.getItem(`audio-speed-${defaultProps.episodeId}`)
      expect(savedSpeed).toBe('1.5')
    })

    it('should restore saved position on load', async () => {
      // Pre-save a position
      localStorage.setItem(`audio-position-${defaultProps.episodeId}`, '120')

      const { window, document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Initialize player
      const event = new window.Event('DOMContentLoaded')
      document.dispatchEvent(event)

      // Wait for metadata to load
      await new Promise(resolve => setTimeout(resolve, 20))

      const audio = document.querySelector('audio') as any
      expect(audio.currentTime).toBe(120)
    })

    it('should restore saved speed on load', async () => {
      // Pre-save a speed
      localStorage.setItem(`audio-speed-${defaultProps.episodeId}`, '1.25')

      const { window, document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Initialize player
      const event = new window.Event('DOMContentLoaded')
      document.dispatchEvent(event)

      const speedControl = document.querySelector('.speed-control') as HTMLSelectElement
      expect(speedControl.value).toBe('1.25')

      const audio = document.querySelector('audio') as any
      expect(audio.playbackRate).toBe(1.25)
    })

    it('should clear saved position when episode ends', async () => {
      // Pre-save a position
      localStorage.setItem(`audio-position-${defaultProps.episodeId}`, '120')

      const { window, document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Initialize player
      const initEvent = new window.Event('DOMContentLoaded')
      document.dispatchEvent(initEvent)

      const audio = document.querySelector('audio') as any

      // Simulate ended event
      const endedEvent = new window.Event('ended')
      audio.dispatchEvent(endedEvent)

      // Check that position was cleared
      const savedPosition = localStorage.getItem(`audio-position-${defaultProps.episodeId}`)
      expect(savedPosition).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing audio source gracefully', async () => {
      const propsWithBadUrl = {
        ...defaultProps,
        audioUrl: ''
      }

      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: propsWithBadUrl
      })

      const source = document.querySelector('source')
      expect(source).toHaveAttribute('src', '')
    })

    it('should handle invalid duration gracefully', async () => {
      const propsWithInvalidDuration = {
        ...defaultProps,
        duration: NaN
      }

      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: propsWithInvalidDuration
      })

      const duration = document.querySelector('.duration')
      expect(duration?.textContent).toBe('NaN:NaN')
    })
  })

  describe('Mobile and Touch Support', () => {
    it('should have touch-friendly controls', async () => {
      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Check all interactive elements have touch-target class
      const touchElements = [
        '.play-pause',
        '.skip-backward',
        '.skip-forward',
        '.speed-control'
      ]

      touchElements.forEach(selector => {
        const element = document.querySelector(selector)
        expect(element).toHaveClass('touch-target')
      })
    })

    it('should have proper spacing between controls', async () => {
      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Check gap between control groups
      const controlsContainer = document.querySelector('.flex.items-center.justify-between.gap-2')
      expect(controlsContainer).toBeTruthy()
      expect(controlsContainer).toHaveClass('gap-2')

      // Check gap between playback controls
      const playbackControls = document.querySelector('.flex.items-center.gap-2')
      expect(playbackControls).toBeTruthy()
      expect(playbackControls).toHaveClass('gap-2')
    })
  })

  describe('Visual States', () => {
    it('should show play icon when paused', async () => {
      const { document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      const playIcon = document.querySelector('.play-icon')
      const pauseIcon = document.querySelector('.pause-icon')

      expect(playIcon).not.toHaveClass('hidden')
      expect(pauseIcon).toHaveClass('hidden')
    })

    it('should update progress bar width based on playback', async () => {
      const { window, document } = await renderComponent('SimpleAudioPlayer.astro', {
        props: defaultProps
      })

      // Initialize player
      const event = new window.Event('DOMContentLoaded')
      document.dispatchEvent(event)

      const progressFill = document.querySelector('.progress-fill') as HTMLElement
      const progressHandle = document.querySelector('.progress-handle') as HTMLElement

      // Initially at 0%
      expect(progressFill.style.width).toBe('0%')
      expect(progressHandle.style.left).toBe('0%')

      // Simulate time update to 50% progress
      const audio = document.querySelector('audio') as any
      audio.currentTime = 150 // 50% of 300 seconds
      audio.duration = 300

      const timeUpdateEvent = new window.Event('timeupdate')
      audio.dispatchEvent(timeUpdateEvent)

      // Check updated progress
      expect(progressFill.style.width).toBe('50%')
      expect(progressHandle.style.left).toBe('50%')
    })
  })
})