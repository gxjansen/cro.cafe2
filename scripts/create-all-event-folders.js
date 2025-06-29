#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Complete list of all events from https://www.cro.cafe/event
const ALL_EVENTS = [
  'conversion-hotel-2021',
  'e-show-barcelona',
  'emerce-conversion-2021',
  'outperform-conference',
  'emerce-conversion-2020',
  'conversion-hotel-2020',
  'digital-elite-day',
  'experimentation-culture-awards',
  'the-bad-conference',
  'uxinsight-2020',
  'virtual-champagne-breakfast',
  'digital-elite-live',
  'google-analytics-user-conference-2021',
  'google-analytics-user-conference',
  'marketing-insights-event',
  'emerce-engage-reach-touch-retain',
  'conversion-hotel',
  'digital-analytics-congres',
  'cro-cafe-unconference-2',
  'dutch-cro-awards',
  'cro-cafe-unconference',
  'masterclass-conversie-optimalisatie',
  'measurebowling',
  'measurecamp',
  'emerce-conversion',
  'uxinsight',
  'cro-workshop-a-b-testen-weet-je-het-zeker'
];

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'events');

// Create all event folders
console.log('Creating folders for all CRO.CAFE events...\n');

ALL_EVENTS.forEach(event => {
  const eventDir = path.join(OUTPUT_DIR, event);
  if (!fs.existsSync(eventDir)) {
    fs.mkdirSync(eventDir, { recursive: true });
    console.log(`✓ Created folder: ${event}`);
  } else {
    console.log(`- Folder exists: ${event}`);
  }
});

console.log(`\nTotal events: ${ALL_EVENTS.length}`);
EOF < /dev/null