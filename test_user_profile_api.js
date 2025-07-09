// Test script to verify user profile API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/user';

async function testUserProfileEndpoints() {
    console.log('Testing User Profile API Endpoints...\n');

    try {
        // Test 1: Get user profile
        console.log('1. Testing GET /api/user/profile/:userId');
        try {
            const profileResponse = await axios.get(`${BASE_URL}/profile/1`);
            console.log('✅ Profile endpoint working');
            console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Profile endpoint error:', error.response?.data || error.message);
        }

        console.log('\n---\n');

        // Test 2: Get user stats
        console.log('2. Testing GET /api/user/stats/:userId');
        try {
            const statsResponse = await axios.get(`${BASE_URL}/stats/1`);
            console.log('✅ Stats endpoint working');
            console.log('Stats data:', JSON.stringify(statsResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Stats endpoint error:', error.response?.data || error.message);
        }

        console.log('\n---\n');

        // Test 3: Get user addresses
        console.log('3. Testing GET /api/user/addresses/:userId');
        try {
            const addressesResponse = await axios.get(`${BASE_URL}/addresses/1`);
            console.log('✅ Addresses endpoint working');
            console.log('Addresses data:', JSON.stringify(addressesResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Addresses endpoint error:', error.response?.data || error.message);
        }

        console.log('\n---\n');

        // Test 4: Get regions
        console.log('4. Testing GET /api/user/regions');
        try {
            const regionsResponse = await axios.get(`${BASE_URL}/regions`);
            console.log('✅ Regions endpoint working');
            console.log('Regions count:', regionsResponse.data.length);
        } catch (error) {
            console.log('❌ Regions endpoint error:', error.response?.data || error.message);
        }

    } catch (error) {
        console.log('❌ General error:', error.message);
    }
}

// Run the tests
testUserProfileEndpoints();
