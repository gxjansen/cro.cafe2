import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Profile Image Fallback', () => {
  const testImagePath = path.join(__dirname, '../../public/images/guests/test-guest.jpg');
  const ainaraImagePath = path.join(__dirname, '../../public/images/guests/ainara-simon.jpg');

  beforeEach(async () => {
    // Ensure test images don't exist
    try {
      await fs.unlink(testImagePath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
    try {
      await fs.unlink(ainaraImagePath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  });

  afterEach(async () => {
    // Cleanup test images
    try {
      await fs.unlink(testImagePath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  });

  describe('GuestProfilePictureOptimized Component', () => {
    it('should have fallback mechanism when image is missing', async () => {
      // Read the component file
      const componentPath = path.join(__dirname, '../../src/components/GuestProfilePictureOptimized.astro');
      const componentContent = await fs.readFile(componentPath, 'utf-8');

      // Check if component has fallback implementation
      const hasFallbackInitials = componentContent.includes('getInitials');
      const hasErrorHandler = componentContent.includes('onerror');
      const hasFallbackDiv = componentContent.includes('fallback') || componentContent.includes('placeholder');

      expect(hasFallbackInitials || hasErrorHandler || hasFallbackDiv, 
        'GuestProfilePictureOptimized should have at least one fallback mechanism').toBe(true);
    });

    it('should handle missing image gracefully with initials', async () => {
      const componentPath = path.join(__dirname, '../../src/components/GuestProfilePictureOptimized.astro');
      const componentContent = await fs.readFile(componentPath, 'utf-8');

      // Check for initials generation function
      expect(componentContent).toContain('getInitials');
      
      // Check for fallback rendering
      expect(componentContent.includes('fallback') || componentContent.includes('initials')).toBe(true);
    });
  });

  describe('GuestProfilePicture Component', () => {
    it('should have complete fallback implementation', async () => {
      const componentPath = path.join(__dirname, '../../src/components/GuestProfilePicture.astro');
      const componentContent = await fs.readFile(componentPath, 'utf-8');

      // Verify all fallback mechanisms are present
      expect(componentContent).toContain('getInitials');
      expect(componentContent).toContain('onerror');
      expect(componentContent).toContain('placeholder');
      expect(componentContent).toContain('fallbackGradient');
    });
  });

  describe('HostImage Component', () => {
    it('should have fallback mechanism when image is missing', async () => {
      const componentPath = path.join(__dirname, '../../src/components/HostImage.astro');
      const componentContent = await fs.readFile(componentPath, 'utf-8');

      // Check if component has fallback implementation
      const hasFallbackIcon = componentContent.includes('svg') || componentContent.includes('icon');
      const hasErrorHandler = componentContent.includes('onerror');
      const hasFallbackDiv = componentContent.includes('fallback') || componentContent.includes('placeholder');

      expect(hasFallbackIcon || hasErrorHandler || hasFallbackDiv, 
        'HostImage should have at least one fallback mechanism').toBe(true);
    });
  });

  describe('Guest Overview Page Integration', () => {
    it('should use a component with proper fallback on guest cards', async () => {
      // Check GuestCardVertical which is used on overview pages
      const cardPath = path.join(__dirname, '../../src/components/GuestCardVertical.astro');
      const cardContent = await fs.readFile(cardPath, 'utf-8');

      // Verify it uses a profile picture component
      expect(cardContent).toMatch(/GuestProfilePicture(Optimized)?/);

      // If it uses the optimized version, that component should have fallback
      if (cardContent.includes('GuestProfilePictureOptimized')) {
        const optimizedPath = path.join(__dirname, '../../src/components/GuestProfilePictureOptimized.astro');
        const optimizedContent = await fs.readFile(optimizedPath, 'utf-8');
        
        // This should fail initially as the optimized version doesn't have fallback
        const hasFallback = optimizedContent.includes('getInitials') || 
                           optimizedContent.includes('onerror') || 
                           optimizedContent.includes('fallback');
        
        expect(hasFallback, 
          'GuestProfilePictureOptimized used in overview pages should have fallback mechanism').toBe(true);
      }
    });
  });

  describe('Real Guest Case - Ainara Simon', () => {
    it('should handle Ainara Simon profile without image file', async () => {
      // Verify the image doesn't exist
      let imageExists = false;
      try {
        await fs.access(ainaraImagePath);
        imageExists = true;
      } catch (e) {
        imageExists = false;
      }

      // The test expects the image to not exist to test fallback
      expect(imageExists).toBe(false);

      // Check that components would handle this case
      const optimizedPath = path.join(__dirname, '../../src/components/GuestProfilePictureOptimized.astro');
      const optimizedContent = await fs.readFile(optimizedPath, 'utf-8');
      
      // This should have error handling or fallback for missing images
      const canHandleMissingImage = optimizedContent.includes('onerror') || 
                                   optimizedContent.includes('fallback') ||
                                   optimizedContent.includes('initials');
      
      expect(canHandleMissingImage, 
        'Component should be able to handle missing images like Ainara Simon').toBe(true);
    });
  });
});