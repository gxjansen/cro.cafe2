# Unmapped URLs Summary

This document lists all URLs from the old subdomains that need manual mapping.

## Summary

- **Total unmapped URLs**: ~200+
- **German (DE)**: 64 URLs
- **Dutch (NL)**: 56 URLs  
- **Spanish (ES)**: 60 URLs
- **English (EN)**: 20+ URLs

## Categories of Unmapped URLs

### 1. Guest Profile Pages
All individual guest pages need to be mapped. Examples:
- `https://de.cro.cafe/guest/andre-morys` → Should map to specific guest page or `/all/guests/`
- `https://nl.cro.cafe/guest/sander-volbeda` → Should map to specific guest page or `/all/guests/`

**Action needed**: Determine if these guests have profile pages on the new site or redirect all to `/all/guests/`

### 2. Episode URLs with Changed Slugs
Episodes where the slug has changed between old and new site:
- `https://de.cro.cafe/podcast/hinter-den-kulissen-von-meta` → Needs mapping to new slug
- `https://de.cro.cafe/podcast/willkommen-bei-cro-cafe-auf-deutsch` → Maps to `/de/episodes/cro-cafe-jetzt-auch-auf-deutsch/`

**Action needed**: Create mappings in `scripts/generate-old-slug-redirects.js`

### 3. Special Pages
Pages that existed on old site but may not have equivalents:
- `/croppuccino-succes` (success page)
- `/podcast` (main podcast page) → Should redirect to `/{lang}/episodes/`
- `/collaborate/*` pages
- `/event/*` specific event pages

**Action needed**: Decide on appropriate destinations

### 4. Platform-Specific Redirects
Old platform links that need updating:
- `/platform/*` URLs
- RSS feed URLs
- External platform links

## Recommended Actions

1. **For Guest Pages**: 
   - Option A: Redirect all to `/all/guests/`
   - Option B: Create individual redirects for guests that have profile pages

2. **For Episode Slugs**:
   - Add mappings to `scripts/generate-old-slug-redirects.js`
   - Run the script to regenerate redirects
   - Update `public/_redirects`

3. **For Special Pages**:
   - `/podcast` → `/{lang}/episodes/`
   - Success pages → Homepage or relevant section
   - Event pages → `/about/` or specific event if it exists

## Files to Update

1. `scripts/generate-old-slug-redirects.js` - Add episode slug mappings
2. `public/_redirects` - Add generated redirects
3. Consider creating a server-side redirect handler for dynamic mapping

## Full Unmapped URLs List

The complete list is in `docs/unmapped-urls.md` organized by language.