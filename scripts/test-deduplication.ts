#!/usr/bin/env tsx

/**
 * Test the improved deduplication logic
 */

// Test data that mimics the structure from NocoDB
const testEpisode = {
  title: "Test Episode",
  host: [
    {
      Id: 1,
      name: "Guido X Jansen"
    }
  ],
  _nc_m2m_Episodes_Hosts: [
    {
      Hosts_id: 1,
      Episodes_id: 1646,
      Hosts: {
        Id: 1,
        name: "Guido X Jansen",
        slug: "gxjansen"
      }
    }
  ],
  guest: [
    {
      Id: 608,
      slug: "mischa-coster"
    }
  ],
  _nc_m2m_Episodes_Guests: [
    {
      Guests_id: 608,
      Episodes_id: 1646,
      Guests: {
        Id: 608,
        slug: "mischa-coster",
        name: "Mischa Coster"
      }
    }
  ]
}

// Improved deduplication logic
function deduplicateHosts(episode: any): string[] {
  const hostData: Array<{slug?: string, name?: string}> = []
  
  if (episode.host && Array.isArray(episode.host)) {
    episode.host.forEach((h: any) => {
      hostData.push({ slug: h.slug, name: h.name })
    })
  }
  
  if (episode._nc_m2m_Episodes_Hosts && Array.isArray(episode._nc_m2m_Episodes_Hosts)) {
    episode._nc_m2m_Episodes_Hosts.forEach((rel: any) => {
      if (rel.Hosts) {
        hostData.push({ slug: rel.Hosts.slug, name: rel.Hosts.name })
      }
    })
  }
  
  const nameToSlugMap = new Map<string, string>()
  const finalHostsSet = new Set<string>()
  
  // First pass: collect all name->slug mappings
  hostData.forEach(h => {
    if (h.slug && h.name) {
      nameToSlugMap.set(h.name, h.slug)
    }
  })
  
  // Second pass: add hosts, preferring slugs
  hostData.forEach(h => {
    if (h.slug) {
      finalHostsSet.add(h.slug)
    } else if (h.name) {
      const slug = nameToSlugMap.get(h.name)
      finalHostsSet.add(slug || h.name)
    }
  })
  
  return Array.from(finalHostsSet)
}

function deduplicateGuests(episode: any): string[] {
  const guestsMap = new Map<string, string>()
  
  if (episode.guest && Array.isArray(episode.guest)) {
    episode.guest.forEach((g: any) => {
      if (g.slug) {
        guestsMap.set(g.slug, g.name || g.slug)
      } else if (g.name) {
        guestsMap.set(g.name, g.name)
      }
    })
  }
  
  if (episode._nc_m2m_Episodes_Guests && Array.isArray(episode._nc_m2m_Episodes_Guests)) {
    episode._nc_m2m_Episodes_Guests.forEach((rel: any) => {
      if (rel.Guests?.slug) {
        guestsMap.set(rel.Guests.slug, rel.Guests.name || rel.Guests.slug)
      } else if (rel.Guests?.name) {
        guestsMap.set(rel.Guests.name, rel.Guests.name)
      }
    })
  }
  
  return Array.from(guestsMap.keys())
}

console.log('🧪 Testing improved deduplication logic\n')

console.log('Original hosts data:')
console.log('- episode.host:', testEpisode.host.map(h => h.name || h.slug))
console.log('- _nc_m2m_Episodes_Hosts:', testEpisode._nc_m2m_Episodes_Hosts.map(rel => rel.Hosts.slug || rel.Hosts.name))

const deduplicatedHosts = deduplicateHosts(testEpisode)
console.log('\n✅ Deduplicated hosts:', deduplicatedHosts)
console.log('   Expected: ["gxjansen"] (using slug when available)')

console.log('\n---\n')

console.log('Original guests data:')
console.log('- episode.guest:', testEpisode.guest.map(g => g.slug || g.name))
console.log('- _nc_m2m_Episodes_Guests:', testEpisode._nc_m2m_Episodes_Guests.map(rel => rel.Guests.slug || rel.Guests.name))

const deduplicatedGuests = deduplicateGuests(testEpisode)
console.log('\n✅ Deduplicated guests:', deduplicatedGuests)
console.log('   Expected: ["mischa-coster"] (properly deduplicated)')