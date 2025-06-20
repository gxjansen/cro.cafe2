import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

// Read the main sitemap
const mainSitemapPath = path.join(distPath, 'sitemap-0.xml');
const mainSitemapContent = fs.readFileSync(mainSitemapPath, 'utf-8');

// Parse URLs from the sitemap
const urlRegex = /<loc>(.*?)<\/loc>/g;
const urls = [...mainSitemapContent.matchAll(urlRegex)].map(match => match[1]);

// Language patterns
const languages = ['en', 'nl', 'de', 'es'];
const languageUrls: Record<string, string[]> = {
  en: [],
  nl: [],
  de: [],
  es: [],
  global: [] // URLs without language prefix
};

// Categorize URLs by language
urls.forEach(url => {
  let categorized = false;
  
  // Check for language-specific URLs
  for (const lang of languages) {
    // Match patterns like /en/, /nl/, etc.
    if (url.includes(`/${lang}/`) || url.endsWith(`/${lang}/`)) {
      languageUrls[lang].push(url);
      categorized = true;
      break;
    }
  }
  
  // URLs without language prefix (global pages)
  if (!categorized) {
    languageUrls.global.push(url);
  }
});

// Generate XML for a sitemap
function generateSitemapXML(urls: string[], lastmod: string = new Date().toISOString().split('T')[0]): string {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urlEntries}
</urlset>`;
}

// Generate language-specific sitemaps
for (const [lang, urls] of Object.entries(languageUrls)) {
  if (lang === 'global') continue; // Skip global for individual language sitemaps
  
  // Combine language-specific URLs with global URLs
  const combinedUrls = [...urls, ...languageUrls.global];
  
  if (combinedUrls.length > 0) {
    const sitemapContent = generateSitemapXML(combinedUrls);
    const sitemapPath = path.join(distPath, `sitemap-${lang}.xml`);
    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log(`Generated ${sitemapPath} with ${combinedUrls.length} URLs`);
  }
}

// Generate a new sitemap index
const sitemapIndexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://cro.cafe/sitemap-0.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  ${languages.map(lang => `<sitemap>
    <loc>https://cro.cafe/sitemap-${lang}.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`).join('\n  ')}
</sitemapindex>`;

fs.writeFileSync(path.join(distPath, 'sitemap-index.xml'), sitemapIndexContent);
console.log('Updated sitemap-index.xml with language-specific sitemaps');

// Update robots.txt to reference language sitemaps
const robotsPath = path.join(distPath, '..', 'public', 'robots.txt');
const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
const updatedRobotsContent = robotsContent.replace(
  'Sitemap: https://cro.cafe/sitemap-index.xml',
  `Sitemap: https://cro.cafe/sitemap-index.xml
Sitemap: https://cro.cafe/sitemap-en.xml
Sitemap: https://cro.cafe/sitemap-nl.xml
Sitemap: https://cro.cafe/sitemap-de.xml
Sitemap: https://cro.cafe/sitemap-es.xml`
);

if (robotsContent !== updatedRobotsContent) {
  fs.writeFileSync(robotsPath, updatedRobotsContent);
  console.log('Updated robots.txt with language-specific sitemap references');
}