import { getCollection } from 'astro:content';

async function debugEpisodes() {
  console.log('🔍 Debugging Episode Collection\n');
  
  try {
    const episodes = await getCollection('episodes');
    console.log(`Total episodes found: ${episodes.length}\n`);
    
    // Group by language
    const byLanguage = {
      en: episodes.filter(ep => ep.data.language === 'en'),
      nl: episodes.filter(ep => ep.data.language === 'nl'),
      de: episodes.filter(ep => ep.data.language === 'de'),
      es: episodes.filter(ep => ep.data.language === 'es'),
      undefined: episodes.filter(ep => !ep.data.language)
    };
    
    console.log('Episodes by language:');
    Object.entries(byLanguage).forEach(([lang, eps]) => {
      if (eps.length > 0) {
        console.log(`  ${lang}: ${eps.length} episodes`);
      }
    });
    
    // Check English episodes specifically
    console.log('\nEnglish episodes sample:');
    byLanguage.en.slice(0, 5).forEach(ep => {
      console.log(`  - ${ep.data.title}`);
      console.log(`    slug: ${ep.data.slug || ep.slug}`);
      console.log(`    status: ${ep.data.status}`);
      console.log(`    file: ${ep.id}`);
    });
    
    // Check for missing required fields
    console.log('\nChecking for missing fields:');
    const missingSlug = episodes.filter(ep => !ep.data.slug && !ep.slug);
    const missingLanguage = episodes.filter(ep => !ep.data.language);
    const missingStatus = episodes.filter(ep => !ep.data.status);
    
    if (missingSlug.length > 0) {
      console.log(`  ⚠️  ${missingSlug.length} episodes missing slug`);
    }
    if (missingLanguage.length > 0) {
      console.log(`  ⚠️  ${missingLanguage.length} episodes missing language`);
    }
    if (missingStatus.length > 0) {
      console.log(`  ⚠️  ${missingStatus.length} episodes missing status`);
    }
    
  } catch (error) {
    console.error('Error loading episodes:', error);
  }
}

debugEpisodes();