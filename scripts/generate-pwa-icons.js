import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const sourceIcon = './public/images/crocafe-icon-256.png';
const outputDir = './public';

const iconSizes = [
  { size: 64, name: 'pwa-64x64.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' }
];

async function generateIcons() {
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Read the source image once
    const sourceBuffer = await fs.readFile(sourceIcon);

    // Generate each icon size
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    // Generate maskable icon with padding
    const maskableOutputPath = path.join(outputDir, 'pwa-512x512-maskable.png');
    await sharp(sourceBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 15, g: 20, b: 25, alpha: 1 } // Dark background matching theme
      })
      .extend({
        top: 56,
        bottom: 56,
        left: 56,
        right: 56,
        background: { r: 15, g: 20, b: 25, alpha: 1 }
      })
      .toFile(maskableOutputPath);
    
    console.log('✅ Generated maskable icon with safe area padding');

    // Create favicon.ico from multiple sizes
    console.log('✅ All PWA icons generated successfully!');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();