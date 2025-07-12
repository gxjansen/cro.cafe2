# Statistics Implementation Analysis

## Issue 1: Language Page Guest Counts (Line 392 in [lang]/index.astro)
- Display: `{totalGuests}+` 
- totalGuests = guests.length (line 55)
- guests = await getGuestsByLanguage(language) (line 31)
- Function correctly filters by language in content.ts lines 30-44
- Issue: Works correctly - the problem might be data-related

## Issue 2: Host Statistics (Lines 166 & 174 in hosts/[slug].astro)
- Display: {hostStats.totalEpisodes} and {hostStats.totalGuests}
- hostStats = await getHostStatistics(hostSlug) (line 37)
- Function in content.ts lines 638-711
- Problem found: Line 663 checks host.data.episodes.includes(episode.data.transistorId)
- This requires exact match between host episode IDs and episode transistorIds

## Issue 3: Guest Filter Initial Display (Lines 16-18 in GuestFilterBar.astro)
- Filters out guests with zero episodes on initial load
- guestsWithEpisodes = guests.filter(guest => guest.data.episodes && guest.data.episodes.length > 0)
- This removes guests before they can be displayed

## Test Approach
1. Test getGuestsByLanguage with mock data
2. Test getHostStatistics with mismatched IDs
3. Test GuestFilterBar with guests having empty episodes arrays