import puppeteer from 'puppeteer'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔍 Validating Mobile Enhancements on Built Site')
console.log('==============================================\n')

async function startPreviewServer() {
  console.log('🚀 Starting preview server...')

  return new Promise((resolve, reject) => {
    const server = spawn('npm', ['run', 'preview'], {
      cwd: dirname(__dirname),
      stdio: 'pipe'
    })

    let serverReady = false

    server.stdout.on('data', (data) => {
      const output = data.toString()
      console.log(`   ${output.trim()}`)

      if (output.includes('Local:') && !serverReady) {
        serverReady = true
        // Extract the port from the output
        const portMatch = output.match(/http:\/\/localhost:(\d+)/)
        const port = portMatch ? portMatch[1] : '4321'
        setTimeout(() => resolve({ server, port }), 2000) // Wait 2s for server to fully start
      }
    })

    server.stderr.on('data', (data) => {
      console.error(`   Error: ${data}`)
    })

    server.on('error', reject)
  })
}

async function validateMobileEnhancements() {
  let serverProcess
  let browser

  try {
    // Start the preview server
    const { server, port } = await startPreviewServer()
    serverProcess = server
    console.log(`✅ Preview server started on port ${port}\n`)

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Set mobile viewport
    await page.setViewport({
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    })

    // Set mobile user agent
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1')

    console.log('📱 Testing Mobile Experience\n')

    // Navigate to the home page
    await page.goto(`http://localhost:${port}/`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // Test 1: Touch Targets
    console.log('1️⃣  Touch Target Validation')
    const touchTargets = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, select, [role="button"], .touch-target')
      const results = []

      elements.forEach(el => {
        const rect = el.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          results.push({
            selector: el.tagName.toLowerCase() + (el.className ? `.${  el.className.split(' ')[0]}` : ''),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            meetsRequirement: rect.width >= 48 && rect.height >= 48
          })
        }
      })

      return results
    })

    const compliant = touchTargets.filter(t => t.meetsRequirement).length
    console.log(`   ✅ ${compliant}/${touchTargets.length} elements meet 48px requirement`)

    const nonCompliant = touchTargets.filter(t => !t.meetsRequirement)
    if (nonCompliant.length > 0) {
      console.log('   ⚠️  Non-compliant elements:')
      nonCompliant.slice(0, 5).forEach(el => {
        console.log(`      - ${el.selector}: ${el.width}x${el.height}px`)
      })
      if (nonCompliant.length > 5) {
        console.log(`      ... and ${nonCompliant.length - 5} more`)
      }
    }

    // Test 2: Bottom Navigation
    console.log('\n2️⃣  Bottom Navigation')
    const bottomNav = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Mobile navigation"]')
      if (!nav) {return null}

      const rect = nav.getBoundingClientRect()
      const style = window.getComputedStyle(nav)

      return {
        exists: true,
        visible: style.display !== 'none',
        position: style.position,
        height: rect.height,
        items: nav.querySelectorAll('a, button').length
      }
    })

    if (bottomNav) {
      console.log(`   ✅ Bottom nav exists and is ${bottomNav.visible ? 'visible' : 'hidden'}`)
      console.log(`   ✅ Position: ${bottomNav.position}, Height: ${bottomNav.height}px`)
      console.log(`   ✅ Navigation items: ${bottomNav.items}`)
    } else {
      console.log('   ❌ Bottom navigation not found')
    }

    // Test 3: Viewport Overflow
    console.log('\n3️⃣  Viewport Overflow Check')
    const overflow = await page.evaluate(() => {
      return {
        htmlOverflowX: window.getComputedStyle(document.documentElement).overflowX,
        bodyOverflowX: window.getComputedStyle(document.body).overflowX,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      }
    })

    console.log(`   ✅ HTML overflow-x: ${overflow.htmlOverflowX}`)
    console.log(`   ✅ Body overflow-x: ${overflow.bodyOverflowX}`)
    console.log(`   ${overflow.hasHorizontalScroll ? '❌' : '✅'} Horizontal scroll: ${overflow.hasHorizontalScroll ? 'Present' : 'None'}`)

    // Test 4: CSS Containment
    console.log('\n4️⃣  CSS Containment')
    const containment = await page.evaluate(() => {
      const results = {}

      // Check various components
      const selectors = {
        header: 'header',
        bottomNav: 'nav[aria-label="Mobile navigation"]',
        guestCard: '.guest-card',
        episodeCard: '.episode-card'
      }

      Object.entries(selectors).forEach(([name, selector]) => {
        const el = document.querySelector(selector)
        if (el) {
          results[name] = window.getComputedStyle(el).contain || 'none'
        }
      })

      return results
    })

    Object.entries(containment).forEach(([component, value]) => {
      console.log(`   ${value !== 'none' ? '✅' : '⚠️ '} ${component}: ${value}`)
    })

    // Test 5: Performance Metrics
    console.log('\n5️⃣  Performance Metrics')
    const metrics = await page.metrics()
    console.log(`   📊 DOM Nodes: ${metrics.Nodes}`)
    console.log(`   📊 JS Heap: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   📊 Layout Count: ${metrics.LayoutCount}`)

    // Test 6: Desktop Mode
    console.log('\n6️⃣  Desktop Compatibility')
    await page.setViewport({ width: 1920, height: 1080 })

    const desktopCheck = await page.evaluate(() => {
      const bottomNav = document.querySelector('nav[aria-label="Mobile navigation"]')
      const header = document.querySelector('header')

      return {
        bottomNavHidden: !bottomNav || window.getComputedStyle(bottomNav).display === 'none',
        headerVisible: header && window.getComputedStyle(header).display !== 'none',
        bodyPadding: window.getComputedStyle(document.body).paddingBottom
      }
    })

    console.log(`   ${desktopCheck.bottomNavHidden ? '✅' : '❌'} Bottom nav hidden on desktop`)
    console.log(`   ${desktopCheck.headerVisible ? '✅' : '❌'} Header visible on desktop`)
    console.log(`   ✅ Body padding: ${desktopCheck.bodyPadding}`)

    console.log('\n✨ Validation Complete!\n')

  } catch (error) {
    console.error('❌ Error during validation:', error.message)
  } finally {
    // Cleanup
    if (browser) {
      await browser.close()
    }

    if (serverProcess) {
      console.log('🛑 Stopping preview server...')
      serverProcess.kill()
    }
  }
}

// Run validation
validateMobileEnhancements().catch(console.error)