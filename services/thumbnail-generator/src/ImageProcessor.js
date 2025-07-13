import sharp from 'sharp';

export class ImageProcessor {
  constructor() {
    this.defaultImageSize = 400;
    this.maxFileSize = 512 * 1024; // 512KB
  }

  /**
   * Download and process image from URL
   */
  async downloadImage(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CRO-Cafe-Thumbnail-Generator/1.0'
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return this.processImageBuffer(buffer);
    } catch (error) {
      console.warn(`Failed to download image from ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Process image buffer to ensure it meets requirements
   */
  async processImageBuffer(buffer, targetSize = this.defaultImageSize) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Validate image
      if (!this.isValidImageFormat(metadata.format)) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      // Resize and optimize
      const processedBuffer = await image
        .resize(targetSize, targetSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 90,
          progressive: true
        })
        .toBuffer();

      return processedBuffer;
    } catch (error) {
      console.warn('Image processing failed:', error.message);
      return null;
    }
  }

  /**
   * Create circular crop of image
   */
  async createCircularImage(buffer, size) {
    try {
      // Create circular mask
      const circle = Buffer.from(
        `<svg width="${size}" height="${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
        </svg>`
      );

      const processedImage = await sharp(buffer)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .composite([{ input: circle, blend: 'dest-in' }])
        .png()
        .toBuffer();

      return processedImage;
    } catch (error) {
      console.warn('Circular image creation failed:', error.message);
      return buffer; // Return original if processing fails
    }
  }

  /**
   * Optimize final thumbnail image
   */
  async optimizeThumbnail(buffer, format = 'jpeg', quality = 85) {
    try {
      let optimized;

      if (format === 'jpeg') {
        optimized = await sharp(buffer)
          .jpeg({
            quality,
            progressive: true,
            mozjpeg: true
          })
          .toBuffer();
      } else {
        optimized = await sharp(buffer)
          .png({
            quality,
            progressive: true,
            compressionLevel: 9
          })
          .toBuffer();
      }

      // Check if size is acceptable
      if (optimized.length <= this.maxFileSize) {
        return optimized;
      }

      // If too large, reduce quality
      if (format === 'jpeg' && quality > 60) {
        return this.optimizeThumbnail(buffer, format, quality - 15);
      }

      // If still too large with JPEG, try PNG
      if (format === 'jpeg') {
        return this.optimizeThumbnail(buffer, 'png', 80);
      }

      console.warn(`Final image size (${optimized.length} bytes) exceeds limit (${this.maxFileSize} bytes)`);
      return optimized;
    } catch (error) {
      console.warn('Thumbnail optimization failed:', error.message);
      return buffer;
    }
  }

  /**
   * Get image information
   */
  async getImageInfo(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: metadata.size,
        hasAlpha: metadata.hasAlpha,
        channels: metadata.channels
      };
    } catch (error) {
      console.warn('Failed to get image info:', error.message);
      return null;
    }
  }

  /**
   * Validate image format
   */
  isValidImageFormat(format) {
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
    return supportedFormats.includes(format?.toLowerCase());
  }

  /**
   * Create placeholder image
   */
  async createPlaceholder(size = this.defaultImageSize, initials = '?') {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#e2e8f0"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#94a3b8"/>
        <text x="${size/2}" y="${size/2 + 10}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="${size/8}" 
              fill="white">${initials}</text>
      </svg>
    `;

    try {
      return await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
    } catch (error) {
      console.warn('Placeholder creation failed:', error.message);
      return Buffer.alloc(0);
    }
  }

  /**
   * Extract dominant colors from image
   */
  async extractDominantColors(buffer, count = 5) {
    try {
      const { dominant } = await sharp(buffer)
        .resize(100, 100)
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simplified color extraction
      // In production, use a proper color extraction library
      return [{
        r: dominant.r || 0,
        g: dominant.g || 0,
        b: dominant.b || 0,
        hex: `#${(dominant.r || 0).toString(16).padStart(2, '0')}${(dominant.g || 0).toString(16).padStart(2, '0')}${(dominant.b || 0).toString(16).padStart(2, '0')}`
      }];
    } catch (error) {
      console.warn('Color extraction failed:', error.message);
      return [];
    }
  }

  /**
   * Batch process multiple images
   */
  async batchProcess(imageUrls, targetSize = this.defaultImageSize) {
    const results = await Promise.allSettled(
      imageUrls.map(url => this.downloadImage(url))
    );

    return results.map((result, index) => ({
      url: imageUrls[index],
      success: result.status === 'fulfilled',
      buffer: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }
}