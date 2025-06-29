#!/usr/bin/env tsx

/**
 * Debug script to check why duplicates are still appearing
 */

import { config } from 'dotenv'
config()

import { NocoDBWorkingClient } from '../src/lib/services/nocodb-working-client.js'

async function debugDuplicates() {
  const client = new NocoDBWorkingClient({
    baseUrl: process.env.NOCODB_BASE_URL!,
    apiKey: process.env.NOCODB_API_KEY!,
    baseId: process.env.NOCODB_BASE_ID!
  })

  console.log('🔍 Debugging duplicate hosts/guests issue...\n')

  try {
    // Test connection
    const connected = await client.testConnection()
    if (!connected) {
      throw new Error('Failed to connect to NocoDB')
    }

    // Get a sample episode
    const episodes = await client.getEpisodes({ limit: 1 })

    if (episodes.length > 0) {
      const episode = episodes[0]
      console.log('📋 Episode title:', episode.title)
      console.log('\n🔍 Raw data structure:')

      // Check hosts data
      console.log('\n👥 Hosts data:')
      console.log('episode.host:', JSON.stringify(episode.host, null, 2))
      console.log('episode._nc_m2m_Episodes_Hosts:', JSON.stringify(episode._nc_m2m_Episodes_Hosts, null, 2))

      // Check guests data
      console.log('\n👤 Guests data:')
      console.log('episode.guest:', JSON.stringify(episode.guest, null, 2))
      console.log('episode._nc_m2m_Episodes_Guests:', JSON.stringify(episode._nc_m2m_Episodes_Guests, null, 2))

      // Test deduplication logic
      console.log('\n🧪 Testing deduplication logic:')

      // Hosts deduplication
      const hostsSet = new Set<string>()
      if (episode.host && Array.isArray(episode.host)) {
        episode.host.forEach((h: any) => {
          const hostValue = h.slug || h.name
          console.log(`  Adding host from episode.host: ${hostValue}`)
          if (hostValue) {hostsSet.add(hostValue)}
        })
      }
      if (episode._nc_m2m_Episodes_Hosts && Array.isArray(episode._nc_m2m_Episodes_Hosts)) {
        episode._nc_m2m_Episodes_Hosts.forEach((rel: any) => {
          const hostValue = rel.Hosts?.slug || rel.Hosts?.name
          console.log(`  Adding host from _nc_m2m_Episodes_Hosts: ${hostValue}`)
          if (hostValue) {hostsSet.add(hostValue)}
        })
      }
      const hosts = Array.from(hostsSet)
      console.log('\n✅ Final hosts array:', hosts)

      // Guests deduplication
      const guestsSet = new Set<string>()
      if (episode.guest && Array.isArray(episode.guest)) {
        episode.guest.forEach((g: any) => {
          const guestValue = g.slug || g.name
          console.log(`  Adding guest from episode.guest: ${guestValue}`)
          if (guestValue) {guestsSet.add(guestValue)}
        })
      }
      if (episode._nc_m2m_Episodes_Guests && Array.isArray(episode._nc_m2m_Episodes_Guests)) {
        episode._nc_m2m_Episodes_Guests.forEach((rel: any) => {
          const guestValue = rel.Guests?.slug || rel.Guests?.name
          console.log(`  Adding guest from _nc_m2m_Episodes_Guests: ${guestValue}`)
          if (guestValue) {guestsSet.add(guestValue)}
        })
      }
      const guests = Array.from(guestsSet)
      console.log('\n✅ Final guests array:', guests)

    } else {
      console.log('❌ No episodes found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugDuplicates()