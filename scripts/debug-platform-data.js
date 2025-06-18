#!/usr/bin/env node

/**
 * Debug script to inspect platform data creation and retrieval
 */

import axios from 'axios';

// Configuration
const BASE_URL = 'https://nocodb-nkhcx-u31496.vm.elestio.app';
const API_KEY = 'DUiJ6F-HHLqLOSFnP0PxGQp2v-KCG4JOtrlmLKgJ';
const BASE_ID = 'p5mcqm7lvi5ty8i';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v2`,
  headers: {
    'xc-token': API_KEY,
    'Content-Type': 'application/json'
  }
});

// Test platform data with all possible fields
const testPlatform = {
  Name: "DEBUG Test Platform",
  name: "DEBUG Test Platform", 
  slug: "debug-test-platform",
  url: "https://debug.example.com/main",
  url_en: "https://debug.example.com/en",
  url_nl: "https://debug.example.com/nl",
  url_de: "https://debug.example.com/de",
  url_es: "https://debug.example.com/es",
  icon: "https://debug.example.com/icon.png",
  logo_url: "https://debug.example.com/logo.png",
  website: "https://debug.example.com",
  is_active: true,
  display_order: 888,
  displayOrder: 888
};

async function getTableId(tableName) {
  const response = await api.get(`/meta/bases/${BASE_ID}/tables`);
  const table = response.data.list.find(t => t.title === tableName);
  if (!table) throw new Error(`Table ${tableName} not found`);
  return table.id;
}

async function debugPlatformCreation() {
  try {
    console.log('🔍 DEBUG: Platform Data Creation Test\n');
    
    // Step 1: Get table structure
    console.log('1️⃣ Getting Platforms table structure...');
    const tableId = await getTableId('Platforms');
    const tableInfo = await api.get(`/api/v2/meta/tables/${tableId}`);
    
    console.log('\n📋 Platform table columns:');
    tableInfo.data.columns.forEach(col => {
      if (!col.system) {
        console.log(`  - ${col.title} (${col.column_name}) - ${col.uidt}`);
      }
    });
    
    // Step 2: Create test platform
    console.log('\n2️⃣ Creating test platform with data:');
    console.log(JSON.stringify(testPlatform, null, 2));
    
    const createResponse = await api.post(`/tables/${tableId}/records`, testPlatform);
    const createdId = createResponse.data.Id;
    console.log(`\n✅ Created platform with ID: ${createdId}`);
    
    // Step 3: Retrieve and inspect created platform
    console.log('\n3️⃣ Retrieving created platform...');
    const getResponse = await api.get(`/tables/${tableId}/records/${createdId}`);
    
    console.log('\n📊 Retrieved platform data:');
    console.log(JSON.stringify(getResponse.data, null, 2));
    
    // Step 4: Compare sent vs received
    console.log('\n4️⃣ Field comparison:');
    Object.keys(testPlatform).forEach(key => {
      const sent = testPlatform[key];
      const received = getResponse.data[key];
      if (sent !== received) {
        console.log(`  ❌ ${key}: sent "${sent}" but got "${received}"`);
      } else {
        console.log(`  ✅ ${key}: "${sent}"`);
      }
    });
    
    // Step 5: Check for unexpected fields
    console.log('\n5️⃣ Additional fields in response:');
    Object.keys(getResponse.data).forEach(key => {
      if (!testPlatform.hasOwnProperty(key) && !['Id', 'CreatedAt', 'UpdatedAt'].includes(key)) {
        console.log(`  - ${key}: "${getResponse.data[key]}"`);
      }
    });
    
    // Step 6: Clean up
    console.log('\n6️⃣ Cleaning up test data...');
    await api.delete(`/tables/${tableId}/records`, {
      data: [{ Id: createdId }]
    });
    console.log('✅ Test platform deleted');
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the debug script
debugPlatformCreation().catch(console.error);