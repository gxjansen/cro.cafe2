import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔍 Mobile Enhancement Validation Script')
console.log('=====================================\n')

async function validateMobileEnhancements() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  // Mobile viewport settings
  await page.setViewport({
    width: 375,
    height: 812,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  })

  // Set mobile user agent
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1')

  console.log('📱 Testing Mobile Enhancements on Sample HTML\n')

  // Create a test HTML page with our mobile enhancements
  const testHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mobile Enhancement Test</title>
      <style>
        ${readFileSync(join(__dirname, '../src/styles/mobile-enhancements.css'), 'utf8')}
        
        /* Additional test styles */
        body {
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .test-container {
          padding: 20px;
        }
        
        .test-button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          margin: 10px 0;
          cursor: pointer;
        }
        
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-around;
        }
        
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          text-decoration: none;
          color: #374151;
        }
        
        .guest-card {
          border: 1px solid #e5e7eb;
          padding: 16px;
          margin: 10px 0;
          border-radius: 8px;
        }
        
        @media (min-width: 768px) {
          .bottom-nav {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="test-container">
        <h1>Mobile Enhancement Validation</h1>
        
        <button class="test-button">Test Button</button>
        
        <a href="#" class="test-button" style="display: inline-block; text-decoration: none;">Link Button</a>
        
        <div class="guest-card contain-layout contain-style contain-paint">
          <h3>Guest Card</h3>
          <p>Testing CSS containment</p>
        </div>
        
        <select style="width: 100%;">
          <option>Select Option</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
        
        <input type="checkbox" id="checkbox1">
        <label for="checkbox1">Checkbox Label</label>
      </div>
      
      <nav class="bottom-nav" aria-label="Mobile navigation">
        <a href="#" class="nav-item">
          <span>Episodes</span>
        </a>
        <a href="#" class="nav-item">
          <span>Guests</span>
        </a>
        <a href="#" class="nav-item">
          <span>Search</span>
        </a>
        <button class="nav-item">
          <span>More</span>
        </button>
      </nav>
    </body>
    </html>
  `

  await page.setContent(testHTML)

  // Test 1: Touch Target Validation
  console.log('✅ Touch Target Validation')
  const touchTargets = await page.evaluate(() => {
    const elements = document.querySelectorAll('button, a, input, select, [role="button"]')
    const results = []

    elements.forEach(el => {
      const rect = el.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(el)

      if (rect.width > 0 && rect.height > 0) {
        results.push({
          tag: el.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          minWidth: computedStyle.minWidth,
          minHeight: computedStyle.minHeight,
          meetsRequirement: rect.width >= 48 && rect.height >= 48
        })
      }
    })

    return results
  })

  const compliantTargets = touchTargets.filter(t => t.meetsRequirement).length
  console.log(`   - ${compliantTargets}/${touchTargets.length} elements meet 48px requirement`)
  touchTargets.forEach(target => {
    if (!target.meetsRequirement) {
      console.log(`   ⚠️  ${target.tag}: ${target.width}x${target.height}px (below 48px)`)
    }
  })

  // Test 2: Viewport Overflow
  console.log('\n✅ Viewport Overflow Prevention')
  const overflow = await page.evaluate(() => {
    const html = document.documentElement
    const body = document.body

    return {
      htmlOverflowX: window.getComputedStyle(html).overflowX,
      bodyOverflowX: window.getComputedStyle(body).overflowX,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
    }
  })

  console.log(`   - HTML overflow-x: ${overflow.htmlOverflowX}`)
  console.log(`   - Body overflow-x: ${overflow.bodyOverflowX}`)
  console.log(`   - Horizontal scroll: ${overflow.hasHorizontalScroll ? '❌ Present' : '✅ None'}`)

  // Test 3: CSS Containment
  console.log('\n✅ CSS Containment')
  const containment = await page.evaluate(() => {
    const results = {}

    const guestCard = document.querySelector('.guest-card')
    if (guestCard) {
      results.guestCard = window.getComputedStyle(guestCard).contain
    }

    const bottomNav = document.querySelector('.bottom-nav')
    if (bottomNav) {
      results.bottomNav = window.getComputedStyle(bottomNav).contain
    }

    return results
  })

  Object.entries(containment).forEach(([element, value]) => {
    console.log(`   - ${element}: ${value || 'none'}`)
  })

  // Test 4: Bottom Navigation
  console.log('\n✅ Bottom Navigation (Mobile)')
  const bottomNav = await page.evaluate(() => {
    const nav = document.querySelector('.bottom-nav')
    if (!nav) {return null}

    const rect = nav.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(nav)

    return {
      visible: computedStyle.display !== 'none',
      position: computedStyle.position,
      bottom: computedStyle.bottom,
      height: rect.height,
      items: nav.querySelectorAll('a, button').length
    }
  })

  if (bottomNav) {
    console.log(`   - Visible: ${bottomNav.visible ? '✅' : '❌'}`)
    console.log(`   - Position: ${bottomNav.position}`)
    console.log(`   - Height: ${bottomNav.height}px`)
    console.log(`   - Items: ${bottomNav.items}`)
  }

  // Test 5: Desktop View
  console.log('\n✅ Desktop Compatibility Check')
  await page.setViewport({ width: 1920, height: 1080 })

  const desktopNav = await page.evaluate(() => {
    const nav = document.querySelector('.bottom-nav')
    if (!nav) {return null}

    const computedStyle = window.getComputedStyle(nav)
    return {
      visible: computedStyle.display !== 'none'
    }
  })

  console.log(`   - Bottom nav hidden on desktop: ${desktopNav && !desktopNav.visible ? '✅' : '❌'}`)

  // Test 6: Safe Area Support
  console.log('\n✅ Safe Area Support')
  await page.setViewport({
    width: 375,
    height: 812,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  })

  const safeAreaClasses = await page.evaluate(() => {
    const elements = document.querySelectorAll('.safe-top, .safe-bottom, .safe-left, .safe-right')
    return elements.length
  })

  console.log(`   - Elements with safe area classes: ${safeAreaClasses}`)

  // Performance metrics
  console.log('\n✅ Performance Metrics')
  const metrics = await page.metrics()
  console.log(`   - JS Heap Size: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   - DOM Nodes: ${metrics.Nodes}`)
  console.log(`   - Layout Count: ${metrics.LayoutCount}`)
  console.log(`   - Recalc Styles: ${metrics.RecalcStyleCount}`)

  await browser.close()

  console.log('\n✨ Mobile Enhancement Validation Complete!\n')
}

// Run the validation
validateMobileEnhancements().catch(console.error)