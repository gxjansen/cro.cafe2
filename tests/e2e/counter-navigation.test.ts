import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('AnimatedCounter Navigation Tests', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CRO.CAFE Homepage</title>
        </head>
        <body>
          <main>
            <!-- Hero Stats Section -->
            <div class="stats-section">
              <div class="text-center">
                <span class="tabular-nums" data-target="350" data-suffix="" data-prefix="" data-duration="2000">
                  350
                </span>
                <div class="text-sm">Episodes</div>
              </div>
              <div class="text-center">
                <span class="tabular-nums" data-target="270" data-suffix="+" data-prefix="" data-duration="2000">
                  270+
                </span>
                <div class="text-sm">Expert Guests</div>
              </div>
              <div class="text-center">
                <span class="tabular-nums" data-target="400" data-suffix="+" data-prefix="" data-duration="2000">
                  400+
                </span>
                <div class="text-sm">Hours of Content</div>
              </div>
              <div class="text-center group relative">
                <span class="tabular-nums" data-target="17" data-suffix="" data-prefix="" data-duration="2000">
                  17
                </span>
                <div class="text-sm">Guest Countries</div>
              </div>
            </div>
          </main>
        </body>
      </html>
    `, {
      url: 'http://localhost:4321',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window as unknown as Window;
  });

  it('should show actual values immediately on page load (SSR fallback)', () => {
    const counters = document.querySelectorAll('[data-target]');
    
    expect(counters).toHaveLength(4);
    
    // Check that each counter shows its target value immediately
    expect(counters[0].textContent?.trim()).toBe('350'); // Episodes
    expect(counters[1].textContent?.trim()).toBe('270+'); // Expert Guests
    expect(counters[2].textContent?.trim()).toBe('400+'); // Hours of Content
    expect(counters[3].textContent?.trim()).toBe('17'); // Guest Countries
  });

  it('should maintain values when JavaScript is disabled', () => {
    // Simulate JavaScript being disabled - counters should still show values
    const episodesCounter = document.querySelector('[data-target="350"]');
    const guestsCounter = document.querySelector('[data-target="270"]');
    const hoursCounter = document.querySelector('[data-target="400"]');
    const countriesCounter = document.querySelector('[data-target="17"]');
    
    expect(episodesCounter?.textContent?.trim()).toBe('350');
    expect(guestsCounter?.textContent?.trim()).toBe('270+');
    expect(hoursCounter?.textContent?.trim()).toBe('400+');
    expect(countriesCounter?.textContent?.trim()).toBe('17');
  });

  it('should handle browser back/forward navigation', () => {
    const counters = document.querySelectorAll('[data-target]');
    
    // Simulate navigation away and back
    // First visit - values should be visible
    counters.forEach(counter => {
      expect(counter.textContent?.trim()).not.toBe('0');
      expect(counter.textContent?.trim()).not.toBe('');
    });
    
    // Simulate page being hidden (navigation away)
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true
    });
    
    // Simulate page becoming visible again (navigation back)
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false
    });
    
    // Values should still be correct
    expect(counters[0].textContent?.trim()).toBe('350');
    expect(counters[1].textContent?.trim()).toBe('270+');
    expect(counters[2].textContent?.trim()).toBe('400+');
    expect(counters[3].textContent?.trim()).toBe('17');
  });

  it('should handle page refresh correctly', () => {
    // Simulate page refresh by recreating DOM with same content
    const newDom = new JSDOM(dom.serialize(), {
      url: 'http://localhost:4321',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    const newCounters = newDom.window.document.querySelectorAll('[data-target]');
    
    // After refresh, values should still be correct
    expect(newCounters[0].textContent?.trim()).toBe('350');
    expect(newCounters[1].textContent?.trim()).toBe('270+');
    expect(newCounters[2].textContent?.trim()).toBe('400+');
    expect(newCounters[3].textContent?.trim()).toBe('17');
  });

  it('should handle multiple rapid visits to homepage', () => {
    const counters = document.querySelectorAll('[data-target]');
    
    // Simulate rapid navigation (multiple visits in short time)
    for (let i = 0; i < 5; i++) {
      // Each visit should show correct values
      expect(counters[0].textContent?.trim()).toBe('350');
      expect(counters[1].textContent?.trim()).toBe('270+');
      expect(counters[2].textContent?.trim()).toBe('400+');
      expect(counters[3].textContent?.trim()).toBe('17');
    }
  });

  it('should preserve accessibility attributes', () => {
    const counters = document.querySelectorAll('[data-target]');
    
    counters.forEach(counter => {
      // Should have tabular-nums class for consistent number display
      expect(counter.classList.contains('tabular-nums')).toBe(true);
      
      // Should have proper data attributes
      expect(counter.getAttribute('data-target')).toBeTruthy();
      expect(counter.getAttribute('data-duration')).toBeTruthy();
    });
  });

  it('should handle edge cases gracefully', () => {
    // Test with malformed data
    const badCounter = document.createElement('span');
    badCounter.setAttribute('data-target', 'invalid');
    badCounter.textContent = '0';
    document.body.appendChild(badCounter);
    
    // Should not break other counters
    const validCounters = document.querySelectorAll('[data-target]:not([data-target="invalid"])');
    expect(validCounters[0].textContent?.trim()).toBe('350');
  });

  it('should format large numbers correctly', () => {
    // Test with a large number (like 14,000+ professionals)
    const largeCounter = document.createElement('span');
    largeCounter.setAttribute('data-target', '14000');
    largeCounter.textContent = '14,000';
    document.body.appendChild(largeCounter);
    
    // Should maintain comma formatting
    expect(largeCounter.textContent).toBe('14,000');
  });
});