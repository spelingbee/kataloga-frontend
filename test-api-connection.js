#!/usr/bin/env node

/**
 * Quick API Connection Test Script
 * Tests the connection between frontend and backend
 */

const API_BASE_URL = 'http://localhost:3001/api';
const TENANT_SLUG = 'vkusnaya-pizza';

async function testConnection() {
  console.log('🧪 Testing API Connection...\n');
  
  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.text();
    console.log(`✅ Health Check: ${response.status} - ${data}`);
  } catch (error) {
    console.log(`❌ Health Check Failed: ${error.message}`);
    console.log('   💡 Make sure backend is running: npm run dev (in apps/backend)');
    return;
  }
  
  // Test 2: API Base URL
  console.log('\n2️⃣ Testing API Base URL...');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log(`✅ API Base URL accessible: ${API_BASE_URL}`);
    } else {
      console.log(`❌ API Base URL returned: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ API Base URL Failed: ${error.message}`);
  }
  
  // Test 3: Public Menu Categories
  console.log('\n3️⃣ Testing Public Menu Categories...');
  try {
    const url = `${API_BASE_URL}/public/menu/${TENANT_SLUG}/categories`;
    console.log(`   🌐 URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Categories: ${response.status}`);
      console.log(`   📊 Found ${data.length} categories`);
      data.forEach(cat => console.log(`      - ${cat.name} (${cat.itemCount} items)`));
    } else {
      console.log(`❌ Categories Failed: ${response.status}`);
      console.log(`   📄 Response:`, data);
    }
  } catch (error) {
    console.log(`❌ Categories Error: ${error.message}`);
  }
  
  // Test 4: Public Menu Items
  console.log('\n4️⃣ Testing Public Menu Items...');
  try {
    const url = `${API_BASE_URL}/public/menu/${TENANT_SLUG}`;
    console.log(`   🌐 URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Menu Items: ${response.status}`);
      console.log(`   📊 Found ${data.length} menus`);
      
      let totalItems = 0;
      data.forEach(menu => {
        console.log(`      📋 Menu: ${menu.name} (${menu.items?.length || 0} items)`);
        totalItems += menu.items?.length || 0;
      });
      console.log(`   🍽️ Total items: ${totalItems}`);
    } else {
      console.log(`❌ Menu Items Failed: ${response.status}`);
      console.log(`   📄 Response:`, data);
    }
  } catch (error) {
    console.log(`❌ Menu Items Error: ${error.message}`);
  }
  
  // Test 5: CORS Headers
  console.log('\n5️⃣ Testing CORS Headers...');
  try {
    const response = await fetch(`${API_BASE_URL}/public/menu/${TENANT_SLUG}/categories`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    };
    
    console.log(`✅ CORS Preflight: ${response.status}`);
    console.log(`   🌐 CORS Headers:`, corsHeaders);
  } catch (error) {
    console.log(`❌ CORS Test Error: ${error.message}`);
  }
  
  console.log('\n🏁 Test Complete!');
  console.log('\n💡 If tests fail:');
  console.log('   1. Make sure backend is running: cd apps/backend && npm run dev');
  console.log('   2. Make sure database is seeded: npm run seed:test');
  console.log('   3. Check backend logs for errors');
  console.log('   4. Verify tenant exists in database');
}

// Run the test
testConnection().catch(console.error);