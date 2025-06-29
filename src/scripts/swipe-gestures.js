/**
 * Swipe Gesture Support for Mobile Navigation
 * Provides touch-based navigation between pages
 */

export class SwipeGestures {
  constructor(options = {}) {
    this.options = {
      threshold: 50, // Minimum distance for swipe
      velocity: 0.3, // Minimum velocity (px/ms)
      restraint: 100, // Maximum perpendicular movement
      allowedTime: 300, // Maximum time for swipe
      ...options
    }

    this.touchStartX = 0
    this.touchStartY = 0
    this.touchStartTime = 0
    this.isScrolling = false

    this.init()
  }

  init() {
    // Only initialize on touch devices
    if (!('ontouchstart' in window)) {return}

    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true })
  }

  handleTouchStart(e) {
    const touch = e.touches[0]
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.touchStartTime = Date.now()
    this.isScrolling = null
  }

  handleTouchMove(e) {
    if (!this.touchStartX || !this.touchStartY) {return}

    const touch = e.touches[0]
    const diffX = touch.clientX - this.touchStartX
    const diffY = touch.clientY - this.touchStartY

    // Determine if user is scrolling vertically
    if (this.isScrolling === null) {
      this.isScrolling = Math.abs(diffY) > Math.abs(diffX)
    }

    // Prevent default only for horizontal swipes on certain elements
    if (!this.isScrolling && this.shouldPreventDefault(e.target)) {
      e.preventDefault()
    }
  }

  handleTouchEnd(e) {
    if (!this.touchStartX || !this.touchStartY || this.isScrolling) {
      this.reset()
      return
    }

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const elapsedTime = Date.now() - this.touchStartTime

    const diffX = touchEndX - this.touchStartX
    const diffY = touchEndY - this.touchStartY
    const absDiffX = Math.abs(diffX)
    const absDiffY = Math.abs(diffY)

    // Check if it's a valid swipe
    if (elapsedTime <= this.options.allowedTime &&
        absDiffX >= this.options.threshold &&
        absDiffY <= this.options.restraint) {

      const velocity = absDiffX / elapsedTime

      if (velocity >= this.options.velocity) {
        if (diffX > 0) {
          this.handleSwipeRight()
        } else {
          this.handleSwipeLeft()
        }
      }
    }

    this.reset()
  }

  shouldPreventDefault(target) {
    // Don't prevent default on form elements, links, or scrollable containers
    const tagName = target.tagName.toLowerCase()
    const preventTags = ['input', 'textarea', 'select', 'button', 'a']

    if (preventTags.includes(tagName)) {return false}

    // Check if element or parent is scrollable
    let element = target
    while (element && element !== document.body) {
      const style = window.getComputedStyle(element)
      if (style.overflowX === 'scroll' || style.overflowX === 'auto' ||
          style.overflowY === 'scroll' || style.overflowY === 'auto') {
        return false
      }
      element = element.parentElement
    }

    return true
  }

  handleSwipeLeft() {
    // Navigate to next page/section
    const event = new CustomEvent('swipe:left', {
      detail: { direction: 'left', timestamp: Date.now() }
    })
    document.dispatchEvent(event)

    // Default behavior: navigate to next episode/guest
    this.navigateNext()
  }

  handleSwipeRight() {
    // Navigate to previous page/section
    const event = new CustomEvent('swipe:right', {
      detail: { direction: 'right', timestamp: Date.now() }
    })
    document.dispatchEvent(event)

    // Default behavior: navigate to previous episode/guest
    this.navigatePrevious()
  }

  navigateNext() {
    // Check if we're on an episode or guest page
    const currentPath = window.location.pathname
    const nextLink = document.querySelector('a[rel="next"]') ||
                     document.querySelector('.navigation-next') ||
                     document.querySelector('[data-next-link]')

    if (nextLink) {
      // Add swipe animation class
      document.body.classList.add('swipe-transition-left')
      setTimeout(() => {
        window.location.href = nextLink.href
      }, 200)
    }
  }

  navigatePrevious() {
    // Check if we're on an episode or guest page
    const currentPath = window.location.pathname
    const prevLink = document.querySelector('a[rel="prev"]') ||
                     document.querySelector('.navigation-prev') ||
                     document.querySelector('[data-prev-link]')

    if (prevLink) {
      // Add swipe animation class
      document.body.classList.add('swipe-transition-right')
      setTimeout(() => {
        window.location.href = prevLink.href
      }, 200)
    } else if (window.history.length > 1) {
      // Fallback to browser back
      window.history.back()
    }
  }

  reset() {
    this.touchStartX = 0
    this.touchStartY = 0
    this.touchStartTime = 0
    this.isScrolling = false
  }

  destroy() {
    document.removeEventListener('touchstart', this.handleTouchStart)
    document.removeEventListener('touchmove', this.handleTouchMove)
    document.removeEventListener('touchend', this.handleTouchEnd)
  }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  window.SwipeGestures = SwipeGestures

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.swipeGestures = new SwipeGestures()
    })
  } else {
    window.swipeGestures = new SwipeGestures()
  }
}