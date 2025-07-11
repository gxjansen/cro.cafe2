import puppeteer from 'puppeteer';
import { test, expect, describe, beforeAll, afterAll } from '@jest/globals';

describe('Mobile Enhancements Validation', () => {
  let browser;
  let page;
  
  // Mobile viewport settings
  const mobileViewport = {
    width: 375,
    height: 812,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  };

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport(mobileViewport);
    // Set user agent to mobile
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Touch Target Validation', () => {
    test('All interactive elements should have minimum 48px touch targets', async () => {
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      // Get all interactive elements
      const touchTargets = await page.evaluate(() => {
        const interactiveElements = document.querySelectorAll('button, a, input, select, [role="button"], .touch-target');
        const results = [];
        
        interactiveElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);
          
          results.push({
            selector: element.tagName.toLowerCase() + (element.className ? '.' + element.className.split(' ').join('.') : ''),
            width: rect.width,
            height: rect.height,
            minWidth: computedStyle.minWidth,
            minHeight: computedStyle.minHeight,
            isVisible: rect.width > 0 && rect.height > 0,
            meetsRequirement: rect.width >= 48 && rect.height >= 48
          });
        });
        
        return results;
      });
      
      // Filter visible elements only
      const visibleTargets = touchTargets.filter(target => target.isVisible);
      
      // Check that all visible touch targets meet the 48px requirement
      const nonCompliantTargets = visibleTargets.filter(target => !target.meetsRequirement);
      
      if (nonCompliantTargets.length > 0) {
        console.log('Non-compliant touch targets:', nonCompliantTargets);
      }
      
      expect(nonCompliantTargets.length).toBe(0);
    });

    test('Audio player controls should have proper touch targets', async () => {
      await page.goto('http://localhost:4321/en/episodes/', { waitUntil: 'networkidle2' });
      
      // Click on first episode to load audio player
      await page.click('.episode-card:first-child');
      await page.waitForSelector('.simple-audio-player', { visible: true });
      
      const audioControls = await page.evaluate(() => {
        const controls = {
          playButton: document.querySelector('.play-pause'),
          skipBackward: document.querySelector('.skip-backward'),
          skipForward: document.querySelector('.skip-forward')
        };
        
        const results = {};
        for (const [name, element] of Object.entries(controls)) {
          if (element) {
            const rect = element.getBoundingClientRect();
            results[name] = {
              width: rect.width,
              height: rect.height,
              meetsRequirement: rect.width >= 48 && rect.height >= 48
            };
          }
        }
        
        return results;
      });
      
      expect(audioControls.playButton?.meetsRequirement).toBe(true);
      expect(audioControls.skipBackward?.meetsRequirement).toBe(true);
      expect(audioControls.skipForward?.meetsRequirement).toBe(true);
    });
  });

  describe('Bottom Navigation Validation', () => {
    test('Bottom navigation should be visible on mobile', async () => {
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      const bottomNav = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Mobile navigation"]');
        if (!nav) return null;
        
        const rect = nav.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(nav);
        
        return {
          exists: true,
          isVisible: computedStyle.display !== 'none' && rect.height > 0,
          position: computedStyle.position,
          bottom: computedStyle.bottom,
          height: rect.height,
          navItems: nav.querySelectorAll('a, button').length
        };
      });
      
      expect(bottomNav).not.toBeNull();
      expect(bottomNav.exists).toBe(true);
      expect(bottomNav.isVisible).toBe(true);
      expect(bottomNav.position).toBe('fixed');
      expect(bottomNav.bottom).toBe('0px');
      expect(bottomNav.navItems).toBe(4); // Episodes, Guests, Search, More
    });

    test('Bottom navigation should be hidden on desktop', async () => {
      // Set desktop viewport
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      const bottomNavVisible = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Mobile navigation"]');
        if (!nav) return false;
        
        const computedStyle = window.getComputedStyle(nav);
        return computedStyle.display !== 'none';
      });
      
      expect(bottomNavVisible).toBe(false);
    });

    test('Bottom navigation links should work correctly', async () => {
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      // Test Episodes link
      await page.click('nav[aria-label="Mobile navigation"] a[href*="episodes"]');
      await page.waitForNavigation();
      expect(page.url()).toContain('/episodes/');
      
      // Test Guests link
      await page.click('nav[aria-label="Mobile navigation"] a[href*="guests"]');
      await page.waitForNavigation();
      expect(page.url()).toContain('/guests/');
      
      // Test Search link
      await page.click('nav[aria-label="Mobile navigation"] a[href*="search"]');
      await page.waitForNavigation();
      expect(page.url()).toContain('/search/');
    });

    test('More menu should open and close correctly', async () => {
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      // Click More button
      await page.click('nav[aria-label="Mobile navigation"] button[data-action="more-menu"]');
      
      // Check if modal is visible
      const modalVisible = await page.evaluate(() => {
        const modal = document.getElementById('more-menu-modal');
        return modal && modal.classList.contains('active');
      });
      
      expect(modalVisible).toBe(true);
      
      // Close modal
      await page.click('[data-close-menu]');
      await page.waitForTimeout(400); // Wait for animation
      
      const modalHidden = await page.evaluate(() => {
        const modal = document.getElementById('more-menu-modal');
        return modal && modal.classList.contains('hidden');
      });
      
      expect(modalHidden).toBe(true);
    });
  });

  describe('Viewport Overflow Prevention', () => {
    test('No horizontal overflow should occur', async () => {
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      const overflow = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        
        return {
          htmlOverflowX: window.getComputedStyle(html).overflowX,
          bodyOverflowX: window.getComputedStyle(body).overflowX,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
        };
      });
      
      expect(overflow.htmlOverflowX).toBe('hidden');
      expect(overflow.bodyOverflowX).toBe('hidden');
      expect(overflow.hasHorizontalScroll).toBe(false);
    });

    test('All containers should respect viewport width', async () => {
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      const overflowingElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const overflowing = [];
        const viewportWidth = window.innerWidth;
        
        elements.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.right > viewportWidth || rect.left < 0) {
            overflowing.push({
              selector: element.tagName.toLowerCase() + (element.className ? '.' + element.className.split(' ').join('.') : ''),
              left: rect.left,
              right: rect.right,
              width: rect.width
            });
          }
        });
        
        return overflowing;
      });
      
      expect(overflowingElements.length).toBe(0);
    });
  });

  describe('CSS Containment Validation', () => {
    test('Components should have proper CSS containment', async () => {
      await page.goto('http://localhost:4321/en/guests/', { waitUntil: 'networkidle2' });
      
      const containment = await page.evaluate(() => {
        const results = {};
        
        // Check guest cards
        const guestCards = document.querySelectorAll('.guest-card');
        if (guestCards.length > 0) {
          results.guestCard = window.getComputedStyle(guestCards[0]).contain;
        }
        
        // Check bottom nav
        const bottomNav = document.querySelector('nav[aria-label="Mobile navigation"]');
        if (bottomNav) {
          results.bottomNav = window.getComputedStyle(bottomNav).contain;
        }
        
        // Check header
        const header = document.querySelector('header');
        if (header) {
          results.header = window.getComputedStyle(header).contain;
        }
        
        return results;
      });
      
      // Verify containment is applied
      expect(containment.guestCard).toMatch(/layout|paint|style/);
      expect(containment.bottomNav).toMatch(/layout/);
    });
  });

  describe('Mobile-Specific Styles', () => {
    test('Safe area insets should be applied', async () => {
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      const safeAreas = await page.evaluate(() => {
        const bottomNav = document.querySelector('nav[aria-label="Mobile navigation"]');
        if (!bottomNav) return null;
        
        const computedStyle = window.getComputedStyle(bottomNav);
        
        return {
          paddingBottom: computedStyle.paddingBottom,
          // Check if safe area CSS variables are being used
          hasSafeAreaClass: bottomNav.classList.contains('safe-bottom')
        };
      });
      
      expect(safeAreas.hasSafeAreaClass).toBe(true);
    });

    test('Touch feedback should be enabled', async () => {
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      const touchFeedback = await page.evaluate(() => {
        const button = document.querySelector('button');
        if (!button) return null;
        
        const computedStyle = window.getComputedStyle(button);
        
        return {
          tapHighlightColor: computedStyle.webkitTapHighlightColor,
          touchAction: computedStyle.touchAction
        };
      });
      
      expect(touchFeedback.touchAction).toBe('manipulation');
    });
  });

  describe('Desktop Compatibility', () => {
    test('Desktop layout should remain unchanged', async () => {
      // Set desktop viewport
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      
      const desktopLayout = await page.evaluate(() => {
        const header = document.querySelector('header');
        const mainNav = document.querySelector('header nav');
        const bottomNav = document.querySelector('nav[aria-label="Mobile navigation"]');
        
        return {
          headerVisible: header && window.getComputedStyle(header).display !== 'none',
          mainNavVisible: mainNav && window.getComputedStyle(mainNav).display !== 'none',
          bottomNavHidden: !bottomNav || window.getComputedStyle(bottomNav).display === 'none',
          bodyPaddingBottom: window.getComputedStyle(document.body).paddingBottom
        };
      });
      
      expect(desktopLayout.headerVisible).toBe(true);
      expect(desktopLayout.mainNavVisible).toBe(true);
      expect(desktopLayout.bottomNavHidden).toBe(true);
      expect(parseInt(desktopLayout.bodyPaddingBottom)).toBeLessThan(50); // Should not have mobile padding
    });
  });

  describe('Performance Validation', () => {
    test('Page should load efficiently on mobile', async () => {
      const metrics = await page.goto('http://localhost:4321/', { waitUntil: 'networkidle2' });
      const timing = await page.evaluate(() => performance.timing);
      
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      // Mobile pages should load reasonably fast
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
      expect(domReady).toBeLessThan(2000); // 2 seconds for DOM ready
    });
  });
});