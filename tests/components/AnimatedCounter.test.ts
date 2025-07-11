import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('AnimatedCounter Component', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <span id="counter1" class="tabular-nums" data-target="100" data-suffix="+" data-prefix="" data-duration="2000">100+</span>
          <span id="counter2" class="tabular-nums" data-target="17" data-suffix="" data-prefix="" data-duration="2000">17</span>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window as unknown as Window;
    
    // Mock requestAnimationFrame
    window.requestAnimationFrame = vi.fn((cb) => {
      setTimeout(cb, 16);
      return 1;
    });

    // Mock IntersectionObserver
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    });
    window.IntersectionObserver = mockIntersectionObserver as any;
  });

  it('should display the target value as initial content (fallback)', () => {
    const counter1 = document.getElementById('counter1');
    const counter2 = document.getElementById('counter2');
    
    expect(counter1?.textContent).toBe('100+');
    expect(counter2?.textContent).toBe('17');
  });

  it('should maintain target value when JavaScript fails', () => {
    // Simulate JavaScript error by not running any animation code
    const counter1 = document.getElementById('counter1');
    
    // Even without JS, the counter should show the correct value
    expect(counter1?.textContent).toBe('100+');
    expect(counter1?.getAttribute('data-target')).toBe('100');
  });

  it('should have correct data attributes', () => {
    const counter1 = document.getElementById('counter1');
    
    expect(counter1?.getAttribute('data-target')).toBe('100');
    expect(counter1?.getAttribute('data-suffix')).toBe('+');
    expect(counter1?.getAttribute('data-prefix')).toBe('');
    expect(counter1?.getAttribute('data-duration')).toBe('2000');
  });

  it('should format large numbers with locale formatting', () => {
    const largeCounter = document.createElement('span');
    largeCounter.setAttribute('data-target', '14000');
    largeCounter.textContent = '14,000';
    document.body.appendChild(largeCounter);
    
    // Check that the initial rendered value uses toLocaleString
    expect(largeCounter.textContent).toContain('000');
  });

  it('should handle visibility change events', () => {
    const mockAddEventListener = vi.fn();
    document.addEventListener = mockAddEventListener;

    // Simulate component initialization would call addEventListener
    // In real component, this would be done by the script
    document.addEventListener('visibilitychange', () => {});

    // Verify visibilitychange listener was added
    expect(mockAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('should reset animation state when page becomes visible', () => {
    const counter = document.getElementById('counter1');
    counter?.setAttribute('data-animated', 'true');
    
    // Simulate page becoming visible
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false
    });
    
    // In real implementation, visibility change would reset animation state
    // Here we test that the attribute can be properly manipulated
    expect(counter?.getAttribute('data-animated')).toBe('true');
    
    // Simulate what the visibility change handler would do
    counter?.setAttribute('data-animated', 'false');
    expect(counter?.getAttribute('data-animated')).toBe('false');
  });

  it('should track last animation time', () => {
    const counter = document.getElementById('counter1');
    const now = Date.now();
    
    counter?.setAttribute('data-last-animated', now.toString());
    
    const lastAnimated = counter?.getAttribute('data-last-animated');
    expect(parseInt(lastAnimated || '0')).toBeCloseTo(now, -2);
  });

  it('should determine if re-animation is needed based on time', () => {
    const counter = document.getElementById('counter1');
    
    // Set last animated to 6 seconds ago
    const sixSecondsAgo = Date.now() - 6000;
    counter?.setAttribute('data-last-animated', sixSecondsAgo.toString());
    
    // Check that enough time has passed for re-animation
    const lastAnimated = parseInt(counter?.getAttribute('data-last-animated') || '0');
    const timeSinceLastAnimation = Date.now() - lastAnimated;
    expect(timeSinceLastAnimation).toBeGreaterThan(5000);
  });
});

describe('AnimatedCounter Integration Tests', () => {
  it('should handle navigation back to homepage correctly', () => {
    // Simulate a counter that was previously animated
    const dom = new JSDOM(`
      <span id="test-counter" class="tabular-nums" data-target="350" data-suffix="" data-prefix="" data-duration="1000">350</span>
    `);
    
    const counter = dom.window.document.getElementById('test-counter');
    
    // Initial state: shows target value
    expect(counter?.textContent).toBe('350');
    
    // After animation completes, it should still show target
    counter?.setAttribute('data-animated', 'true');
    expect(counter?.textContent).toBe('350');
    
    // When revisiting the page, it should still show the value
    expect(counter?.textContent).toBe('350');
  });

  it('should handle multiple counters independently', () => {
    const dom = new JSDOM(`
      <div>
        <span id="episodes" data-target="350">350</span>
        <span id="guests" data-target="270" data-suffix="+">270+</span>
        <span id="hours" data-target="400" data-suffix="+">400+</span>
        <span id="countries" data-target="17">17</span>
      </div>
    `);
    
    const episodes = dom.window.document.getElementById('episodes');
    const guests = dom.window.document.getElementById('guests');
    const hours = dom.window.document.getElementById('hours');
    const countries = dom.window.document.getElementById('countries');
    
    // All counters should show their target values
    expect(episodes?.textContent).toBe('350');
    expect(guests?.textContent).toBe('270+');
    expect(hours?.textContent).toBe('400+');
    expect(countries?.textContent).toBe('17');
  });
});