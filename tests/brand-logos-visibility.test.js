/**
 * @jest-environment node
 */

const puppeteer = require('puppeteer')
const { exec } = require('child_process')
const { promisify } = require('util')
const path = require('path')
const fs = require('fs').promises

const execAsync = promisify(exec)

// Test configuration
const TEST_TIMEOUT = 120000 // 2 minutes
const PORT = 8082
const BASE_URL = `http://localhost:${PORT}`

describe('Brand Logos Visibility Test', () => {
  let browser
  let page
  let serverProcess

  beforeAll(async () => {
    // Check if dist directory exists, if not build the project
    const distPath = path.join(process.cwd(), 'dist')
    try {
      await fs.access(distPath)
      console.log('✅ Using existing build in dist/')
    } catch {
      console.log('🔨 Building the project...')
      await execAsync('npm run build', {
        timeout: 60000,
        stdio: 'inherit'
      })
      console.log('✅ Build completed')
    }

    // Start preview server
    console.log('🚀 Starting preview server...')
    const { spawn } = require('child_process')
    serverProcess = spawn('npm', ['run', 'preview', '--', '--port', PORT.toString()], {
      detached: false,
      stdio: 'ignore'
    })

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    page = await browser.newPage()
  }, TEST_TIMEOUT)

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    if (serverProcess) {
      // Kill the server process
      try {
        process.kill(-serverProcess.pid)
      } catch (e) {
        serverProcess.kill()
      }
    }
  })

  test('Should display brand logos on homepage', async () => {
    // Navigate to homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // Wait a bit for any lazy loading
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if brand section exists
    const brandSectionExists = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('section'))
      return sections.some(s =>
        s.textContent && s.textContent.includes('Professionals from these companies')
      )
    })

    expect(brandSectionExists).toBe(true)

    // Get all brand logos
    const logoData = await page.evaluate(() => {
      const logos = Array.from(document.querySelectorAll('img[alt*="CRO.CAFE partner"]'))

      return logos.map(img => {
        const rect = img.getBoundingClientRect()
        const computed = window.getComputedStyle(img)

        return {
          alt: img.alt,
          src: img.src,
          width: rect.width,
          height: rect.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          visible: computed.display !== 'none' &&
                  computed.visibility !== 'hidden' &&
                  parseFloat(computed.opacity) > 0,
          inViewport: rect.top < window.innerHeight && rect.bottom > 0
        }
      })
    })

    // Verify we have logos
    expect(logoData.length).toBeGreaterThan(0)
    console.log(`Found ${logoData.length} brand logos`)

    // Verify each logo
    const expectedBrands = ['Adobe', 'Google', 'Booking', 'Philips', 'IKEA']
    const foundBrands = []

    logoData.forEach((logo, index) => {
      // Extract brand name from alt text
      const brandMatch = logo.alt.match(/^(.*?) - CRO\.CAFE partner$/)
      const brandName = brandMatch ? brandMatch[1] : 'Unknown'
      foundBrands.push(brandName)

      console.log(`${index + 1}. ${brandName}:`)
      console.log(`   - Visible: ${logo.visible}`)
      console.log(`   - Loaded: ${logo.complete}`)
      console.log(`   - Dimensions: ${Math.round(logo.width)}x${Math.round(logo.height)}px`)
      console.log(`   - Natural: ${logo.naturalWidth}x${logo.naturalHeight}px`)

      // Test assertions
      expect(logo.visible).toBe(true)
      expect(logo.width).toBeGreaterThan(0)
      expect(logo.height).toBeGreaterThan(0)
      expect(logo.complete).toBe(true)
      expect(logo.naturalWidth).toBeGreaterThan(0)
      expect(logo.naturalHeight).toBeGreaterThan(0)
    })

    // Verify expected brands are present
    expectedBrands.forEach(brand => {
      const found = foundBrands.some(foundBrand => foundBrand.includes(brand))
      if (!found) {
        console.warn(`⚠️  Expected brand not found: ${brand}`)
      }
    })

    // Take a screenshot for verification
    await page.screenshot({
      path: 'tests/brand-logos-test-result.png',
      fullPage: false,
      clip: {
        x: 0,
        y: 200,
        width: 1200,
        height: 600
      }
    })
    console.log('📸 Screenshot saved to tests/brand-logos-test-result.png')

  }, 60000) // 1 minute timeout for this test

  test('Should have proper styling on brand logos', async () => {
    // This test checks the CSS styling is applied correctly
    const logoStyles = await page.evaluate(() => {
      const firstLogo = document.querySelector('img[alt*="CRO.CAFE partner"]')
      if (!firstLogo) {return null}

      const computed = window.getComputedStyle(firstLogo)
      return {
        filter: computed.filter,
        opacity: computed.opacity,
        transition: computed.transition,
        objectFit: computed.objectFit
      }
    })

    expect(logoStyles).not.toBeNull()
    expect(logoStyles.filter).toContain('grayscale') // Should have grayscale filter
    expect(parseFloat(logoStyles.opacity)).toBeGreaterThan(0) // Should be visible
    expect(logoStyles.objectFit).toBe('contain') // Should maintain aspect ratio
  })
})