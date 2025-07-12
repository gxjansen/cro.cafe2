# Statistics Display Issues Summary

## Three Critical Issues:
1. **Language Pages**: Showing "0+" for guest counts despite having guests (EN: 121, NL: 126, DE: 50, ES: 34)
2. **Host Detail Pages**: Displaying "0" for both episode count and guest count
3. **Guest Listing Pages**: Showing no guests on initial page load for language-specific routes

## Root Causes:
1. Language page: Possible build-time vs runtime data loading issue in getGuestsByLanguage()
2. Host statistics: Mismatch between host.data.episodes and episode.data.transistorId in getHostStatistics()
3. Guest filtering: GuestFilterBar filters out guests with zero episodes on initial load

## Key Files to Fix:
- src/utils/content.ts (utility functions)
- src/pages/[lang]/index.astro (language page)
- src/pages/hosts/[slug].astro (host detail page)
- src/pages/[lang]/guests/index.astro (guest listing)
- src/components/GuestFilterBar.astro (filter component)