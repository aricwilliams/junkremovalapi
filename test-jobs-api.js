const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testJobsAPI() {
  try {
    console.log('🧪 Testing Jobs API...\n');

    // First, let's try to login to get a valid token
    console.log('1. Attempting to login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser', // You'll need to use a real username from your database
      password: 'testpass'  // You'll need to use a real password from your database
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      console.log('💡 You need to create a business account first or use existing credentials');
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful! Token received.\n');

    // Test jobs endpoint
    console.log('2. Testing GET /jobs endpoint...');
    const jobsResponse = await axios.get(`${BASE_URL}/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Jobs endpoint response:');
    console.log(JSON.stringify(jobsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error testing Jobs API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testJobsAPI();
