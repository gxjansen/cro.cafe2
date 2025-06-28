/**
 * Focus trap utility for managing keyboard navigation within modals, dialogs, and other containers
 * WCAG 2.1 AA Compliance: Ensures keyboard users can navigate within bounded areas
 */

export interface FocusTrapOptions {
  onEscape?: () => void;
  initialFocus?: HTMLElement | string; // Element or selector
  returnFocus?: boolean;
  allowOutsideClick?: boolean;
}

export class FocusTrap {
  private element: HTMLElement;
  private previouslyFocusedElement: HTMLElement | null = null;
  private options: FocusTrapOptions;
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleOutsideClick: (e: MouseEvent) => void;

  constructor(element: HTMLElement, options: FocusTrapOptions = {}) {
    this.element = element;
    this.options = {
      returnFocus: true,
      allowOutsideClick: false,
      ...options
    };

    this.handleKeyDown = this.onKeyDown.bind(this);
    this.handleOutsideClick = this.onOutsideClick.bind(this);
  }

  /**
   * Activate the focus trap
   */
  activate(): void {
    // Store current focus
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    if (this.options.allowOutsideClick) {
      document.addEventListener('click', this.handleOutsideClick);
    }

    // Set initial focus
    const initialFocusElement = this.getInitialFocusElement();
    if (initialFocusElement) {
      setTimeout(() => initialFocusElement.focus(), 0);
    }

    // Ensure the container is focusable for screen readers
    if (!this.element.hasAttribute('tabindex')) {
      this.element.setAttribute('tabindex', '-1');
    }
  }

  /**
   * Deactivate the focus trap
   */
  deactivate(): void {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleOutsideClick);

    // Return focus to previously focused element
    if (this.options.returnFocus && this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }

  /**
   * Get all focusable elements within the trap
   */
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([type="hidden"]):not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]:not([contenteditable="false"])',
      'details summary'
    ].join(', ');

    const elements = Array.from(
      this.element.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    // Filter out elements that are not visible or are in closed details
    return elements.filter(el => {
      if (!this.isVisible(el)) return false;
      
      // Check if element is within a closed details element
      const details = el.closest('details');
      if (details && !details.open && el !== details.querySelector('summary')) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Check if an element is visible
   */
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetParent !== null
    );
  }

  /**
   * Get the element that should receive initial focus
   */
  private getInitialFocusElement(): HTMLElement | null {
    if (this.options.initialFocus) {
      if (typeof this.options.initialFocus === 'string') {
        return this.element.querySelector(this.options.initialFocus);
      }
      return this.options.initialFocus;
    }

    // Find first focusable element
    const focusableElements = this.getFocusableElements();
    return focusableElements[0] || this.element;
  }

  /**
   * Handle keydown events
   */
  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.options.onEscape) {
      e.preventDefault();
      this.options.onEscape();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    // Tab backwards
    if (e.shiftKey) {
      if (activeElement === firstElement || !this.element.contains(activeElement as Node)) {
        e.preventDefault();
        lastElement.focus();
      }
    } 
    // Tab forwards
    else {
      if (activeElement === lastElement || !this.element.contains(activeElement as Node)) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Handle clicks outside the trap
   */
  private onOutsideClick(e: MouseEvent): void {
    if (!this.element.contains(e.target as Node) && this.options.onEscape) {
      this.options.onEscape();
    }
  }
}

/**
 * Convenience function to create and activate a focus trap
 */
export function trapFocus(element: HTMLElement, options?: FocusTrapOptions): FocusTrap {
  const trap = new FocusTrap(element, options);
  trap.activate();
  return trap;
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Get the currently focused element
   */
  getFocusedElement(): HTMLElement | null {
    return document.activeElement as HTMLElement;
  },

  /**
   * Move focus to an element with a fallback
   */
  moveFocusTo(element: HTMLElement | null, fallback?: HTMLElement): void {
    if (element && this.isVisible(element)) {
      element.focus();
    } else if (fallback) {
      fallback.focus();
    }
  },

  /**
   * Check if an element is visible (exported for reuse)
   */
  isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetParent !== null
    );
  },

  /**
   * Announce to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }
};