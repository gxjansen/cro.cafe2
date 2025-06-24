import { optimizeEpisodeTitle, optimizeEpisodeDescription, generateMetaDescription } from '../src/utils/seo-optimization';
import type { Language } from '../src/types';

// Demo episodes for testing SEO optimization
const demoEpisodes = [
  {
    title: "Growth Minded Superheroes",
    description: "Next week, the Growth Marketing Summit event will take place in Frankfurt Germany, CRO.CAFE will be there with our own booth to record experts from the stage and audience.",
    language: 'en' as Language,
    guests: ['André Morys', 'Julia Rumpf']
  },
  {
    title: "How to Start with CRO",
    description: "Learn the fundamentals of conversion rate optimization and how to get started with your first experiments.",
    language: 'en' as Language,
    guests: ['Manuel da Costa']
  },
  {
    title: "Personalisierung: Kurzfristiger Hype oder echtes Potenzial",
    description: "Eine Diskussion über die Zukunft der Personalisierung im E-Commerce und deren Auswirkungen auf die Conversion Rate.",
    language: 'de' as Language,
    guests: ['Thomas Gruhle']
  },
  {
    title: "Conversie Optimalisatie bij Transavia",
    description: "Helene Hallebeek deelt haar ervaringen met het opzetten van een succesvol CRO-programma bij Transavia.",
    language: 'nl' as Language,
    guests: ['Helene Hallebeek']
  }
];

console.log('🚀 SEO Optimization Demo\n');
console.log('Demonstrating how episode titles and descriptions are optimized for search engines:\n');

demoEpisodes.forEach((demo, index) => {
  const mockEpisode = {
    data: {
      title: demo.title,
      description: demo.description,
      language: demo.language,
      summary: null
    }
  } as any;
  
  const seoTitle = optimizeEpisodeTitle(mockEpisode, demo.guests);
  const seoDescription = optimizeEpisodeDescription(mockEpisode, demo.guests);
  const metaDescription = generateMetaDescription(mockEpisode, demo.guests);
  
  console.log(`📝 Episode ${index + 1} (${demo.language.toUpperCase()})`);
  console.log(`   Original Title: "${demo.title}"`);
  console.log(`   SEO Title:      "${seoTitle}"`);
  console.log(`   Length:         ${seoTitle.length} chars (max 60)\n`);
  
  console.log(`   Original Desc:  "${demo.description.substring(0, 80)}..."`);
  console.log(`   Meta Desc:      "${metaDescription}"`);
  console.log(`   Length:         ${metaDescription.length} chars (max 160)\n`);
  console.log('---\n');
});

console.log('✅ SEO Optimization Benefits:');
console.log('   - Includes relevant keywords (CRO, conversion, optimization)');
console.log('   - Adds guest names for better searchability');
console.log('   - Provides clear value propositions');
console.log('   - Stays within character limits for search results');
console.log('   - Language-specific optimization');