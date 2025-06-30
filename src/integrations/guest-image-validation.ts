import type { AstroIntegration } from 'astro'
import { validateGuestImages } from '../../scripts/validate-guest-images.ts'

export function guestImageValidation(): AstroIntegration {
  return {
    name: 'guest-image-validation',
    hooks: {
      'astro:build:start': async () => {
        console.log('🔍 Validating guest images...')
        try {
          await validateGuestImages()
          console.log('✅ Guest image validation completed successfully')
        } catch (error) {
          console.error('❌ Guest image validation failed:', error)
          throw error // Stop build on validation failure
        }
      }
    }
  }
}