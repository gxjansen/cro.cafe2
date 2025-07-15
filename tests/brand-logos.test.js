/**
 * Test to verify brand logos are visible on the homepage
 * This test builds the site and checks that brand logos are properly displayed
 */

const puppeteer = require('puppeteer')
const { exec } = require('child_process')
const { promisify } = require('util')
const handler = require('serve-handler')
const http = require('http')

const execAsync = promisify(exec)

const PORT = 8080
const BASE_URL = `http://localhost:${PORT}`

async function buildSite() {
  console.log('🔨 Building the site...')
  try {
    await execAsync('npm run build')
    console.log('✅ Build completed successfully')
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

async function startServer() {
  console.log('🚀 Starting preview server...')
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      return handler(request, response, {
        public: 'dist'
      })
    })

    server.listen(PORT, () => {
      console.log(`✅ Server running at ${BASE_URL}`)
      resolve(server)
    })
  })
}

async function testBrandLogos() {
  const browser = await puppeteer.launch({
    headless: true
  })

  try {
    const page = await browser.newPage()

    console.log('📄 Navigating to homepage...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' })

    // Wait for the brand section to be visible
    console.log('🔍 Looking for brand section...')
    const brandSectionExists = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('section'))
      return sections.some(s => s.textContent.includes('Professionals from these companies'))
    })

    if (!brandSectionExists) {
      throw new Error('Brand section not found on the page')
    }

    // Check for brand logos
    console.log('🔍 Checking for brand logos...')
    const brandLogos = await page.$$('img[alt*="CRO.CAFE partner"]')

    if (brandLogos.length === 0) {
      throw new Error('No brand logos found on the page')
    }

    console.log(`✅ Found ${brandLogos.length} brand logos`)

    // Verify each logo is visible and has proper dimensions
    const logoDetails = []
    for (let i = 0; i < brandLogos.length; i++) {
      const logo = brandLogos[i]

      const logoData = await page.evaluate((el) => {
        const rect = el.getBoundingClientRect()
        const computed = window.getComputedStyle(el)
        return {
          alt: el.alt,
          src: el.src,
          visible: computed.display !== 'none' && computed.visibility !== 'hidden' && computed.opacity !== '0',
          width: rect.width,
          height: rect.height,
          naturalWidth: el.naturalWidth,
          naturalHeight: el.naturalHeight,
          complete: el.complete
        }
      }, logo)

      if (!logoData.visible) {
        throw new Error(`Logo "${logoData.alt}" is not visible`)
      }

      if (logoData.width === 0 || logoData.height === 0) {
        throw new Error(`Logo "${logoData.alt}" has zero dimensions`)
      }

      // Check if image actually loaded
      const imageLoaded = logoData.complete && logoData.naturalWidth > 0 && logoData.naturalHeight > 0

      if (!imageLoaded) {
        throw new Error(`Logo "${logoData.alt}" failed to load. Source: ${logoData.src}`)
      }

      logoDetails.push({
        alt: logoData.alt,
        width: logoData.width,
        height: logoData.height,
        visible: logoData.visible,
        loaded: imageLoaded
      })
    }

    // Display results
    console.log('\n📊 Brand Logo Test Results:')
    console.log('─'.repeat(50))
    logoDetails.forEach((logo, index) => {
      console.log(`${index + 1}. ${logo.alt}`)
      console.log(`   ✓ Visible: ${logo.visible}`)
      console.log(`   ✓ Loaded: ${logo.loaded}`)
      console.log(`   ✓ Dimensions: ${Math.round(logo.width)}x${Math.round(logo.height)}px`)
    })
    console.log('─'.repeat(50))

    // Additional checks
    const expectedBrands = ['Adobe', 'Google', 'Booking', 'Philips', 'IKEA']
    const foundBrands = logoDetails.map(logo => {
      const match = logo.alt.match(/^(.*?) - CRO\.CAFE partner$/)
      return match ? match[1] : null
    }).filter(Boolean)

    const missingBrands = expectedBrands.filter(brand =>
      !foundBrands.some(found => found.includes(brand))
    )

    if (missingBrands.length > 0) {
      console.warn(`⚠️  Warning: Expected brands not found: ${missingBrands.join(', ')}`)
    }

    console.log('\n✅ All brand logos are visible and properly loaded!')
    return true

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)

    // Take a screenshot for debugging
    try {
      await page.screenshot({
        path: 'tests/brand-logos-error.png',
        fullPage: true
      })
      console.log('📸 Screenshot saved to tests/brand-logos-error.png')
    } catch (screenshotError) {
      console.error('Failed to take screenshot:', screenshotError.message)
    }

    throw error
  } finally {
    await browser.close()
  }
}

async function runTest() {
  let server

  try {
    // Build the site
    await buildSite()

    // Start the server
    server = await startServer()

    // Wait a bit for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Run the test
    await testBrandLogos()

    console.log('\n🎉 All tests passed!')
    process.exit(0)

  } catch (error) {
    console.error('\n💥 Test suite failed')
    process.exit(1)
  } finally {
    // Clean up
    if (server) {
      server.close()
    }
  }
}

// Run the test
runTest()