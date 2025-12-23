#!/usr/bin/env node

/**
 * Quick Debug Script for Menu API Issue
 * Run this to quickly test the entire chain
 */

const API_BASE_URL = 'http://localhost:3001/api';
const TENANT_SLUG = 'vkusnaya-pizza';

console.log('🔍 Quick Debug - Menu API Issue');
console.log('================================\n');

async function quickDebug() {
  // Step 1: Test backend health
  console.log('1️⃣ Testing Backend Health...');
  try {
    const healthResponse = await fetch('http://localhost:3001/health');
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status);
      return;
    }
  } catch (error) {
    console.log('❌ Backend is not running or not accessible');
    console.log('   💡 Start backend: cd apps/backend && npm run dev');
    return;
  }

  // Step 2: Test API endpoint
  console.log('\n2️⃣ Testing API Endpoint...');
  try {
    const apiResponse = await fetch(`${API_BASE_URL}/public/menu/${TENANT_SLUG}`);
    const data = await apiResponse.json();
    
    if (apiResponse.ok) {
      console.log('✅ API endpoint accessible');
      console.log(`   📊 Found ${data.length} menus`);
      
      let totalItems = 0;
      data.forEach(menu => {
        totalItems += menu.items?.length || 0;
      });
      console.log(`   🍽️ Total items: ${totalItems}`);
      
      if (totalItems === 0) {
        console.log('⚠️  No menu items found - database might be empty');
        console.log('   💡 Run: cd apps/backend && npm run seed:test');
      }
    } else {
      console.log('❌ API endpoint failed:', apiResponse.status);
      console.log('   📄 Response:', data);
      
      if (apiResponse.status === 404) {
        console.log('   💡 Tenant not found - check if tenant exists in database');
      }
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   💡 Connection refused - backend might not be running');
    }
  }

  // Step 3: Test categories endpoint
  console.log('\n3️⃣ Testing Categories Endpoint...');
  try {
    const categoriesResponse = await fetch(`${API_BASE_URL}/public/menu/${TENANT_SLUG}/categories`);
    const categories = await categoriesResponse.json();
    
    if (categoriesResponse.ok) {
      console.log('✅ Categories endpoint accessible');
      console.log(`   📂 Found ${categories.length} categories`);
      categories.forEach(cat => {
        console.log(`      - ${cat.name} (${cat.itemCount} items)`);
      });
    } else {
      console.log('❌ Categories endpoint failed:', categoriesResponse.status);
    }
  } catch (error) {
    console.log('❌ Categories request failed:', error.message);
  }

  console.log('\n🏁 Quick Debug Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. If backend is not running: cd apps/backend && npm run dev');
  console.log('2. If database is empty: cd apps/backend && npm run seed:test');
  console.log('3. If API works but frontend fails: check browser console');
  console.log('4. Start frontend: cd apps/frontend && npm run dev');
}

quickDebug().catch(console.error);