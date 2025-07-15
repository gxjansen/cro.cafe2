const fs = require('fs');
const path = require('path');

module.exports = {
  onPreBuild: async ({ utils, constants }) => {
    const cacheDirectories = [
      '.astro',
      'node_modules/.vite',
      'node_modules/.cache',
      'dist/_astro'
    ];

    console.log('🚀 Astro Cache Plugin - Restoring cache...');
    
    for (const dir of cacheDirectories) {
      const fullPath = path.join(constants.PUBLISH_DIR || '.', '..', dir);
      
      if (await utils.cache.has(dir)) {
        console.log(`✓ Restoring cache for ${dir}`);
        await utils.cache.restore(dir);
      } else {
        console.log(`✗ No cache found for ${dir}`);
      }
    }
  },

  onBuild: async ({ utils }) => {
    const cacheDirectories = [
      '.astro',
      'node_modules/.vite',
      'node_modules/.cache',
      'dist/_astro'
    ];

    console.log('💾 Astro Cache Plugin - Saving cache...');
    
    for (const dir of cacheDirectories) {
      if (fs.existsSync(dir)) {
        console.log(`✓ Caching ${dir}`);
        await utils.cache.save(dir);
      } else {
        console.log(`✗ Directory ${dir} not found, skipping cache`);
      }
    }
  },

  onSuccess: async ({ utils }) => {
    const buildInfo = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      astroVersion: process.env.npm_package_dependencies_astro || 'unknown'
    };

    console.log('✅ Build successful!');
    console.log(`📊 Build info:`, buildInfo);
    
    // Save build metadata for future reference
    await utils.cache.save(buildInfo, 'build-metadata');
  },

  onError: async ({ utils }) => {
    console.error('❌ Build failed - clearing potentially corrupted cache');
    
    // Clear cache on failed builds to prevent persistent issues
    const cacheDirectories = [
      '.astro',
      'node_modules/.vite',
      'node_modules/.cache'
    ];
    
    for (const dir of cacheDirectories) {
      if (await utils.cache.has(dir)) {
        console.log(`🗑️ Removing cache for ${dir}`);
        await utils.cache.remove(dir);
      }
    }
  }
};