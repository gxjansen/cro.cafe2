import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { DesignSystem } from './DesignSystem.js';
import { ImageProcessor } from './ImageProcessor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ThumbnailGenerator {
  constructor() {
    this.designSystem = new DesignSystem();
    this.imageProcessor = new ImageProcessor();
    this.initializeFonts();
  }

  initializeFonts() {
    // Using system fonts - no registration needed
    // Canvas will use system Arial and Georgia fonts
  }
  
  // Add roundRect method to context if needed
  addRoundRect(ctx) {
    if (!ctx.roundRect) {
      ctx.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
      };
    }
  }

  async generate(data) {
    const { episode, hosts, guests, canvas: canvasConfig } = data;
    
    // Calculate layout based on participant count
    const layout = this.designSystem.calculateLayout(hosts.length, guests.length);
    
    // Create canvas
    const canvas = createCanvas(canvasConfig.width, canvasConfig.height);
    const ctx = canvas.getContext('2d');
    
    // Add roundRect polyfill if needed
    this.addRoundRect(ctx);
    
    // Draw background
    await this.drawBackground(ctx, canvas.width, canvas.height);
    
    // Draw header (tagline and episode info)
    await this.drawHeader(ctx, canvas.width, episode);
    
    // Load and process participant images
    const hostImages = await this.loadParticipantImages(hosts);
    const guestImages = await this.loadParticipantImages(guests);
    
    // Draw participants using adaptive layout
    await this.drawParticipants(ctx, hostImages, guestImages, layout);
    
    // Draw episode information
    this.drawEpisodeInfo(ctx, canvas.width, canvas.height, episode, layout);
    
    // Convert to optimized image
    const imageBuffer = await this.optimizeImage(canvas, canvasConfig);
    
    return {
      image_data: imageBuffer.toString('base64'),
      mime_type: `image/${canvasConfig.format}`,
      size_bytes: imageBuffer.length,
      dimensions: {
        width: canvasConfig.width,
        height: canvasConfig.height
      },
      layout_used: layout.name,
      participants: {
        hosts: hosts.length,
        guests: guests.length
      }
    };
  }

  async drawBackground(ctx, width, height) {
    try {
      // Load the backdrop image - now using crocafe-3000.png which is already 3000x3000
      const backdropPath = path.join(path.dirname(__dirname), '..', '..', 'public', 'images', 'crocafe-3000.png');
      const backdropImage = await loadImage(backdropPath);
      
      // Draw the backdrop directly (no cropping needed since it's already 3000x3000)
      ctx.drawImage(backdropImage, 0, 0, width, height);
      
    } catch (error) {
      console.warn('Could not load backdrop image, falling back to gradient:', error.message);
      
      // Fallback to gradient background
      const gradient = ctx.createRadialGradient(
        width * 0.3, height * 0.3, 0,
        width * 0.7, height * 0.7, width
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#f0f9f9');
      gradient.addColorStop(1, '#d6e8e7');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add dynamic geometric pattern
      ctx.save();
      ctx.globalAlpha = 0.05;
      
      // Top left accent
      ctx.fillStyle = this.designSystem.colors.primary;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(800, 0);
      ctx.lineTo(0, 800);
      ctx.closePath();
      ctx.fill();
      
      // Bottom right accent
      ctx.fillStyle = this.designSystem.colors.accent;
      ctx.beginPath();
      ctx.moveTo(width, height);
      ctx.lineTo(width - 800, height);
      ctx.lineTo(width, height - 800);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
  }

  async drawHeader(ctx, canvasWidth, episode) {
    // The logo and tagline are already in the background image, so we don't need to draw anything
    // This method is kept for potential future use
  }

  async loadParticipantImages(participants) {
    const images = [];
    
    for (const person of participants) {
      try {
        // Try different image sources in order of preference
        const imageUrl = person.linkedin_profile_pic || 
                        person.image_url || 
                        person.picture ||
                        this.getGitHubImageUrl(person.name);
        
        if (imageUrl) {
          const image = await this.loadImageWithFallback(imageUrl);
          images.push({
            ...person,
            image,
            imageUrl
          });
        } else {
          // Create placeholder
          images.push({
            ...person,
            image: await this.createPlaceholderImage(),
            imageUrl: null
          });
        }
      } catch (error) {
        console.warn(`Failed to load image for ${person.name}:`, error.message);
        images.push({
          ...person,
          image: await this.createPlaceholderImage(),
          imageUrl: null
        });
      }
    }
    
    return images;
  }

  async loadImageWithFallback(url) {
    try {
      // Use built-in fetch (Node.js 18+)
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return await loadImage(buffer);
    } catch (error) {
      console.warn(`Failed to load image from ${url}:`, error.message);
      return await this.createPlaceholderImage();
    }
  }

  async createPlaceholderImage() {
    const size = 400;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Draw placeholder
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '120px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👤', size/2, size/2 + 40);
    
    return await loadImage(canvas.toBuffer());
  }

  getGitHubImageUrl(personName) {
    // Generate GitHub image path based on naming convention
    const slug = personName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    
    return `https://raw.githubusercontent.com/yourusername/crocafesparc/main/public/images/guests/${slug}.jpg`;
  }

  async drawParticipants(ctx, hostImages, guestImages, layout) {
    const { grid, imageSize, customSizes } = layout;
    
    // Draw hosts
    let participantIndex = 0;
    for (let i = 0; i < hostImages.length; i++) {
      const position = grid[participantIndex];
      const size = customSizes && customSizes[participantIndex] ? customSizes[participantIndex] : imageSize;
      await this.drawParticipant(ctx, hostImages[i], position, size, 'host');
      participantIndex++;
    }
    
    // Draw guests
    for (let i = 0; i < guestImages.length; i++) {
      const position = grid[participantIndex];
      const size = customSizes && customSizes[participantIndex] ? customSizes[participantIndex] : imageSize;
      await this.drawParticipant(ctx, guestImages[i], position, size, 'guest');
      participantIndex++;
    }
  }

  async drawParticipant(ctx, participant, position, imageSize, type) {
    const { x, y } = position;
    
    // Enhanced shadow for depth
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    
    // Draw gradient background circle
    const bgGradient = ctx.createRadialGradient(
      x + imageSize/2, y + imageSize/2 - 20, imageSize/3,
      x + imageSize/2, y + imageSize/2, imageSize/2 + 10
    );
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(1, '#f0f4f8');
    
    ctx.beginPath();
    ctx.arc(x + imageSize/2, y + imageSize/2, imageSize/2 + 10, 0, Math.PI * 2);
    ctx.fillStyle = bgGradient;
    ctx.fill();
    
    ctx.restore();
    
    // Draw circular image
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + imageSize/2, y + imageSize/2, imageSize/2 - 5, 0, Math.PI * 2);
    ctx.clip();
    
    if (participant.image) {
      ctx.drawImage(participant.image, x + 5, y + 5, imageSize - 10, imageSize - 10);
    }
    
    ctx.restore();
    
    // Draw double ring effect - match the background colors
    const ringColor = type === 'host' ? '#5a8a87' : '#c05559'; // Teal for hosts, coral for guests
    
    // Outer ring (subtle)
    ctx.strokeStyle = ringColor;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(x + imageSize/2, y + imageSize/2, imageSize/2 + 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Inner ring (bold)
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(x + imageSize/2, y + imageSize/2, imageSize/2 - 3, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw name with enhanced typography
    const nameY = y + imageSize + 80;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    
    ctx.fillStyle = this.designSystem.colors.text.primary;
    ctx.font = `800 ${this.designSystem.typography.personName.size + 8}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(participant.name, x + imageSize/2, nameY);
    
    ctx.restore();
    
    // Draw role/title with modern styling
    const roleY = nameY + 50;
    
    if (type === 'host') {
      // Modern HOST badge
      const badgeText = 'PODCAST HOST';
      ctx.font = `600 ${this.designSystem.typography.personRole.size - 8}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`;
      const metrics = ctx.measureText(badgeText);
      const badgeWidth = metrics.width + 40;
      const badgeHeight = 50;
      const badgeX = x + imageSize/2 - badgeWidth/2;
      const badgeY = roleY - 25;
      
      // Badge gradient background
      const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY);
      badgeGradient.addColorStop(0, 'rgba(90, 138, 135, 0.1)');
      badgeGradient.addColorStop(0.5, 'rgba(90, 138, 135, 0.15)');
      badgeGradient.addColorStop(1, 'rgba(90, 138, 135, 0.1)');
      
      ctx.fillStyle = badgeGradient;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 25);
      ctx.fill();
      
      // Badge border
      ctx.strokeStyle = this.designSystem.colors.primary;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      
      // Badge text
      ctx.fillStyle = this.designSystem.colors.primary;
      ctx.font = `700 ${this.designSystem.typography.personRole.size - 8}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`;
      ctx.fillText(badgeText, x + imageSize/2, roleY);
    } else {
      // Guest styling
      ctx.font = `600 ${this.designSystem.typography.personRole.size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = this.designSystem.colors.text.secondary;
      const title = participant.title || 'Guest';
      ctx.textAlign = 'center';
      ctx.fillText(title, x + imageSize/2, roleY);
      
      if (participant.company) {
        // Company with accent color
        ctx.font = `700 ${this.designSystem.typography.personRole.size - 4}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`;
        ctx.fillStyle = this.designSystem.colors.accent;
        ctx.fillText(participant.company, x + imageSize/2, roleY + 45);
      }
    }
  }

  drawEpisodeInfo(ctx, canvasWidth, canvasHeight, episode, layout) {
    // Position episode number and title at the bottom
    const episodeY = 2400;
    
    // Draw episode number in a badge
    ctx.save();
    
    // Badge background with better visibility
    const badgeWidth = 450;
    const badgeHeight = 90;
    const badgeX = canvasWidth/2 - badgeWidth/2;
    const badgeY = episodeY - 45;
    
    // White background for better contrast
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(badgeX - 5, badgeY - 5, badgeWidth + 10, badgeHeight + 10, 45);
    ctx.fill();
    
    ctx.fillStyle = this.designSystem.colors.accent;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 40);
    ctx.fill();
    
    // Episode number text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${this.designSystem.typography.episodeNumber.size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`EPISODE ${episode.episode_number}`, canvasWidth/2, episodeY);
    
    ctx.restore();
    
    // Draw episode title with enhanced typography
    const truncatedTitle = this.truncateTitle(episode.title, 8);
    
    // Title with better contrast
    ctx.save();
    
    // White background for text
    const titleY = episodeY + 140;
    const titleMetrics = ctx.measureText(truncatedTitle);
    const titleWidth = titleMetrics.width + 100;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(canvasWidth/2 - titleWidth/2, titleY - 50, titleWidth, 100, 20);
    ctx.fill();
    
    ctx.fillStyle = this.designSystem.colors.text.primary;
    ctx.font = `700 ${this.designSystem.typography.episodeTitle.size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Split long titles if needed
    const words = truncatedTitle.split(' ');
    if (words.length > 5) {
      const midPoint = Math.ceil(words.length / 2);
      const line1 = words.slice(0, midPoint).join(' ');
      const line2 = words.slice(midPoint).join(' ');
      ctx.fillText(line1, canvasWidth/2, titleY - 25);
      ctx.fillText(line2, canvasWidth/2, titleY + 25);
    } else {
      ctx.fillText(truncatedTitle, canvasWidth/2, titleY);
    }
    
    ctx.restore();
  }

  truncateTitle(title, maxWords) {
    const words = title.split(' ');
    if (words.length <= maxWords) return title;
    
    return words.slice(0, maxWords).join(' ') + '...';
  }

  async optimizeImage(canvas, config) {
    let buffer = canvas.toBuffer('image/png');
    
    try {
      // Use Sharp for optimization
      let sharpImage = sharp(buffer);
      
      if (config.format === 'jpeg') {
        buffer = await sharpImage
          .jpeg({ quality: config.quality })
          .toBuffer();
      } else {
        buffer = await sharpImage
          .png({ quality: config.quality })
          .toBuffer();
      }
      
      // Check file size (max 512KB for most platforms)
      const maxSize = 512 * 1024; // 512KB
      if (buffer.length > maxSize && config.format === 'jpeg') {
        // Try lower quality
        buffer = await sharp(canvas.toBuffer('image/png'))
          .jpeg({ quality: Math.max(60, config.quality - 20) })
          .toBuffer();
      }
      
      return buffer;
    } catch (error) {
      console.warn('Image optimization failed, using canvas buffer:', error.message);
      return canvas.toBuffer(`image/${config.format}`);
    }
  }
}