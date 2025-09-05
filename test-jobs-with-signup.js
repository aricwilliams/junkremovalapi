const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testJobsAPIWithSignup() {
  try {
    console.log('🧪 Testing Jobs API with Business Signup...\n');

    // First, let's try to login with existing credentials
    console.log('1. Attempting to login with existing business account...');
    const loginData = {
      username: 'testuser123',
      password: 'testpass123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    
    let token;
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      console.log('💡 Trying to create a new business account...');
      
      const signupData = {
        business_name: 'Test Junk Removal Co 2',
        business_phone: '15551234568',
        business_address: '124 Test St',
        business_city: 'Test City',
        business_state: 'NC',
        business_zip_code: '28401',
        owner_first_name: 'Jane',
        owner_last_name: 'Smith',
        owner_email: 'jane.smith@test.com',
        owner_phone: '15554567891',
        username: 'testuser456',
        password: 'testpass456'
      };

      const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, signupData);
      
      if (!signupResponse.data.success) {
        console.log('❌ Signup failed:', signupResponse.data.message);
        if (signupResponse.data.errors) {
          console.log('Validation errors:', signupResponse.data.errors);
        }
        return;
      }

      token = signupResponse.data.data.token;
      console.log('✅ Business signup successful! Token received.\n');
    } else {
      token = loginResponse.data.data.token;
      console.log('✅ Business login successful! Token received.\n');
    }

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

    // Test job stats endpoint
    console.log('\n3. Testing GET /jobs/stats endpoint...');
    const statsResponse = await axios.get(`${BASE_URL}/jobs/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Job stats response:');
    console.log(JSON.stringify(statsResponse.data, null, 2));

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

testJobsAPIWithSignup();
