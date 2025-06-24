#!/usr/bin/env node

// Test script for NocoDB CRUD operations
import axios from 'axios';

const NOCODB_URL = 'https://nocodb-nkhcx-u31496.vm.elestio.app';
const NOCODB_API_TOKEN = 'yuZFyDmrCr7rN9O7IEvsz7vNcTwh63EVFIGvnoWT';
const BASE_ID = 'p5mcqm7lvi5ty8i';

const api = axios.create({
  baseURL: `${NOCODB_URL}/api/v2`,
  headers: {
    'xc-token': NOCODB_API_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Test data for Guests
const testGuest = {
  name: "Test Guest QA",
  bio: "This is a test guest created for automated QA testing. Please ignore.",
  ai_bio: "AI-enhanced bio: This is a test guest created for automated QA testing.",
  company: "Test Company Inc",
  role: "QA Test Engineer",
  slug: "test-guest-qa",
  LinkedIn: "https://linkedin.com/in/testguestqa",
  image_url: "https://test.example.com/images/test-guest.jpg",
  language: "en"
};

// Test data for Hosts
const testHost = {
  name: "Test Host QA",
  bio: "This is a test host created for automated QA testing. Please ignore.",
  company: "Test Host Company",
  title: "QA Test Host",
  role: "Test Host",
  slug: "test-host-qa",
  website: "https://testhost.example.com",
  twitter: "@testhostqa",
  linkedin: "https://linkedin.com/in/testhostqa"
};

// Test data for Platforms
const testPlatform = {
  Name: "TEST Platform - Automated Testing", // Try with capital N as seen in logs
  name: "TEST Platform - Automated Testing", // Also include lowercase
  slug: "test-platform-automated",
  url: "https://test.example.com/test-platform",
  url_en: "https://test.example.com/test-platform/en",
  url_nl: "https://test.example.com/test-platform/nl", 
  url_de: "https://test.example.com/test-platform/de",
  url_es: "https://test.example.com/test-platform/es",
  icon: "https://test.example.com/icons/test-platform.png",
  logo_url: "https://test.example.com/icons/test-platform.png",
  website: "https://test.example.com",
  is_active: true, // Set to active so it shows up
  display_order: 999,
  displayOrder: 999 // Try both field name formats
};

// Test data for Episodes
const testEpisode = {
  title: "TEST Episode 999 - Automated Testing",
  description: "This is a test episode created for QA testing purposes. Please ignore.",
  season: 99,
  episode_number: 999,
  slug: "test-episode-999-automated-testing",
  language: "en",
  duration: 1800, // 30 minutes in seconds
  published_at: new Date().toISOString(),
  media_url: "https://test.example.com/audio/test-episode-999.mp3",
  image_url: "https://test.example.com/images/test-episode-999.jpg",
  transistor_id: "test-999",
  share_url: "https://test.example.com/episodes/test-999",
  featured: false,
  episode_type: "full",
  keywords: "test,automated,qa",
  summary: "Test episode summary for QA validation",
  formatted_description: "<p>This is a test episode created for QA testing purposes. Please ignore.</p>",
  formatted_summary: "<p>Test episode summary for QA validation</p>"
};

// Get table ID by name
async function getTableId(tableName) {
  try {
    const response = await api.get(`/meta/bases/${BASE_ID}/tables`);
    const table = response.data.list.find(t => t.title === tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }
    return table.id;
  } catch (error) {
    console.error('Error getting table ID:', error.message);
    throw error;
  }
}

// Create a record
async function createRecord(tableName, data) {
  try {
    const tableId = await getTableId(tableName);
    const response = await api.post(`/tables/${tableId}/records`, data);
    console.log(`✅ Created ${tableName} record:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error creating ${tableName} record:`, error.response?.data || error.message);
    throw error;
  }
}

// Update a record
async function updateRecord(tableName, recordId, updates) {
  try {
    const tableId = await getTableId(tableName);
    const response = await api.patch(`/tables/${tableId}/records`, [
      { Id: recordId, ...updates }
    ]);
    console.log(`✅ Updated ${tableName} record:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating ${tableName} record:`, error.response?.data || error.message);
    throw error;
  }
}

// Delete a record
async function deleteRecord(tableName, recordId) {
  try {
    const tableId = await getTableId(tableName);
    const response = await api.delete(`/tables/${tableId}/records`, {
      data: [{ Id: recordId }]
    });
    console.log(`✅ Deleted ${tableName} record with ID:`, recordId);
    return response.data;
  } catch (error) {
    console.error(`Error deleting ${tableName} record:`, error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runTest(action, tableName, recordId) {
  console.log(`\n🧪 Running ${action} test for ${tableName}...`);
  
  switch (action) {
    case 'create':
      if (tableName === 'Episodes') {
        return await createRecord(tableName, testEpisode);
      } else if (tableName === 'Guests') {
        return await createRecord(tableName, testGuest);
      } else if (tableName === 'Hosts') {
        return await createRecord(tableName, testHost);
      } else if (tableName === 'Platforms') {
        return await createRecord(tableName, testPlatform);
      }
      break;
      
    case 'update':
      if (tableName === 'Episodes' && recordId) {
        const updates = {
          title: "TEST Episode 999 - Updated Title",
          description: "Updated description for testing purposes",
          formatted_description: "<p>Updated description for testing purposes</p>",
          duration: 2700 // 45 minutes in seconds
        };
        return await updateRecord(tableName, recordId, updates);
      } else if (tableName === 'Guests' && recordId) {
        const updates = {
          name: "Test Guest QA Updated",
          company: "Updated Test Company",
          role: "Senior QA Test Engineer"
        };
        return await updateRecord(tableName, recordId, updates);
      } else if (tableName === 'Hosts' && recordId) {
        const updates = {
          name: "Test Host QA Updated",
          company: "Updated Host Company",
          bio: "Updated bio for testing purposes"
        };
        return await updateRecord(tableName, recordId, updates);
      } else if (tableName === 'Platforms' && recordId) {
        const updates = {
          name: "Test Platform QA Updated",
          url: "https://updated-testplatform.example.com",
          icon: "updated-test-icon"
        };
        return await updateRecord(tableName, recordId, updates);
      }
      break;
      
    case 'delete':
      if (recordId) {
        return await deleteRecord(tableName, recordId);
      }
      break;
      
    default:
      console.error('Invalid action. Use: create, update, or delete');
  }
}

// Parse command line arguments
const [,, action, tableName, recordId] = process.argv;

if (!action || !tableName) {
  console.log('Usage: node test-nocodb-crud.js <action> <tableName> [recordId]');
  console.log('Actions: create, update, delete');
  console.log('Tables: Episodes, Guests, Hosts, Platforms');
  console.log('\nExample:');
  console.log('  node test-nocodb-crud.js create Episodes');
  console.log('  node test-nocodb-crud.js update Episodes 123');
  console.log('  node test-nocodb-crud.js delete Episodes 123');
  process.exit(1);
}

// Run the test
runTest(action, tableName, recordId)
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });