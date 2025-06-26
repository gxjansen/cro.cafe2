import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

// Types for our image validation system
interface GuestImageInfo {
  hasImage: boolean;
  imageUrl: string | null;
  fallbackUrl: string;
  initials: string;
  name: string;
}

interface ImageInventory {
  [slug: string]: GuestImageInfo;
}

// Generate initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Generate SVG initials with consistent styling
function generateInitialsSVG(name: string, slug: string): string {
  const initials = getInitials(name);
  
  // Generate consistent color based on name hash
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const hue = Math.abs(hash) % 360;
  const color1 = `hsl(${hue}, 65%, 45%)`;
  const color2 = `hsl(${(hue + 30) % 360}, 65%, 35%)`;
  
  return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#grad-${slug})" />
  <text x="200" y="230" text-anchor="middle" fill="white" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="120" font-weight="600" font-style="normal">
    ${initials}
  </text>
</svg>`;
}

// Read guest data from markdown files
async function getGuestData() {
  const guestFiles = await glob('./src/content/guests/*.mdx');
  const guests = [];
  
  for (const file of guestFiles) {
    const slug = file.split('/').pop()?.replace('.mdx', '') || '';
    const content = readFileSync(file, 'utf8');
    
    // Extract name from frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const nameMatch = frontmatter.match(/name:\s*["']?([^"'\n]+)["']?/);
      const name = nameMatch?.[1] || slug;
      
      guests.push({ slug, data: { name } });
    }
  }
  
  return guests;
}

// Main validation function
export async function validateGuestImages(): Promise<ImageInventory> {
  const allGuests = await getGuestData();
  const guestDir = './public/images/guests/';
  const generatedDir = './public/images/guests/generated/';
  const inventory: ImageInventory = {};
  
  // Ensure generated directory exists
  if (!existsSync(generatedDir)) {
    mkdirSync(generatedDir, { recursive: true });
  }
  
  // Get list of existing image files
  const existingFiles = existsSync(guestDir) ? readdirSync(guestDir) : [];
  
  let missingCount = 0;
  let foundCount = 0;
  
  for (const guest of allGuests) {
    const slug = guest.slug;
    const name = guest.data.name;
    
    // Check for existing image files in priority order
    const possibleExtensions = ['webp', 'jpeg', 'jpg', 'png'];
    let foundImage: string | null = null;
    
    for (const ext of possibleExtensions) {
      const filename = `${slug}.${ext}`;
      if (existingFiles.includes(filename)) {
        foundImage = `/images/guests/${filename}`;
        break;
      }
    }
    
    const initials = getInitials(name);
    const fallbackFilename = `${slug}-initials.svg`;
    const fallbackPath = join(generatedDir, fallbackFilename);
    const fallbackUrl = `/images/guests/generated/${fallbackFilename}`;
    
    // Generate SVG initials if image doesn't exist
    if (!foundImage) {
      const svgContent = generateInitialsSVG(name, slug);
      writeFileSync(fallbackPath, svgContent, 'utf8');
      missingCount++;
    } else {
      foundCount++;
    }
    
    inventory[slug] = {
      hasImage: !!foundImage,
      imageUrl: foundImage,
      fallbackUrl,
      initials,
      name
    };
  }
  
  // Write inventory to JSON file for build-time access
  const inventoryPath = './src/data/guest-image-inventory.json';
  writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2), 'utf8');
  
  console.log(`✅ Guest image validation complete!`);
  console.log(`📸 Found images: ${foundCount}`);
  console.log(`🎨 Generated initials: ${missingCount}`);
  console.log(`📋 Inventory saved to: ${inventoryPath}`);
  
  return inventory;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  validateGuestImages().catch(console.error);
}