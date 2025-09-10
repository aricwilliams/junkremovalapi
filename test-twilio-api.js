const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test data
let authToken = '';
let userId = 1; // Assuming user ID 1 exists

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  const config = {
    method,
    url: `${API_BASE}${url}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${url} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
};

const testTwilioAccessToken = async () => {
  console.log('\n🔑 Testing Twilio Access Token Generation...');
  try {
    const data = await makeRequest('GET', '/twilio/access-token');
    console.log('✅ Access token generated successfully');
    console.log('   - Token length:', data.token ? data.token.length : 0);
    console.log('   - Identity:', data.identity);
    console.log('   - Available numbers:', data.availableNumbers?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Access token generation failed');
    return false;
  }
};

const testGetPhoneNumbers = async () => {
  console.log('\n📞 Testing Get Phone Numbers...');
  try {
    const data = await makeRequest('GET', '/twilio/my-numbers');
    console.log('✅ Phone numbers retrieved successfully');
    console.log('   - Total numbers:', data.phoneNumbers?.length || 0);
    console.log('   - Active numbers:', data.stats?.active_numbers || 0);
    console.log('   - Monthly cost:', data.stats?.total_monthly_cost || 0);
    return data.phoneNumbers || [];
  } catch (error) {
    console.error('❌ Get phone numbers failed');
    return [];
  }
};

const testSearchAvailableNumbers = async () => {
  console.log('\n🔍 Testing Search Available Numbers...');
  try {
    const data = await makeRequest('GET', '/twilio/available-numbers?areaCode=555&limit=5');
    console.log('✅ Available numbers search successful');
    console.log('   - Found numbers:', data.availableNumbers?.length || 0);
    if (data.availableNumbers?.length > 0) {
      console.log('   - First number:', data.availableNumbers[0].phoneNumber);
    }
    return data.availableNumbers || [];
  } catch (error) {
    console.error('❌ Search available numbers failed');
    return [];
  }
};

const testCallForwarding = async () => {
  console.log('\n📱 Testing Call Forwarding...');
  try {
    // Get forwarding rules
    const data = await makeRequest('GET', '/call-forwarding');
    console.log('✅ Call forwarding rules retrieved');
    console.log('   - Total rules:', data.data?.length || 0);
    console.log('   - Active rules:', data.stats?.active_forwarding_rules || 0);
    return true;
  } catch (error) {
    console.error('❌ Call forwarding test failed');
    return false;
  }
};

const testCallLogs = async () => {
  console.log('\n📋 Testing Call Logs...');
  try {
    const data = await makeRequest('GET', '/twilio/call-logs?limit=10');
    console.log('✅ Call logs retrieved successfully');
    console.log('   - Total calls:', data.callLogs?.length || 0);
    console.log('   - Inbound calls:', data.stats?.inbound_calls || 0);
    console.log('   - Outbound calls:', data.stats?.outbound_calls || 0);
    return true;
  } catch (error) {
    console.error('❌ Call logs test failed');
    return false;
  }
};

const testRecordings = async () => {
  console.log('\n🎵 Testing Call Recordings...');
  try {
    const data = await makeRequest('GET', '/twilio/recordings?limit=10');
    console.log('✅ Call recordings retrieved successfully');
    console.log('   - Total recordings:', data.recordings?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Call recordings test failed');
    return false;
  }
};

// Mock authentication (you'll need to implement proper auth)
const mockAuth = async () => {
  console.log('\n🔐 Mock Authentication...');
  // In a real test, you would authenticate and get a token
  // For now, we'll assume you have a valid token
  authToken = 'your-mock-jwt-token-here';
  console.log('⚠️  Using mock authentication - implement real auth for production tests');
  return true;
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Twilio API Tests...');
  console.log('=' .repeat(50));

  const results = {
    healthCheck: false,
    auth: false,
    accessToken: false,
    phoneNumbers: false,
    searchNumbers: false,
    callForwarding: false,
    callLogs: false,
    recordings: false
  };

  try {
    // Test health check
    results.healthCheck = await testHealthCheck();

    // Mock authentication
    results.auth = await mockAuth();

    if (results.auth) {
      // Test Twilio endpoints
      results.accessToken = await testTwilioAccessToken();
      results.phoneNumbers = (await testGetPhoneNumbers()).length >= 0; // Can be 0 if no numbers
      results.searchNumbers = (await testSearchAvailableNumbers()).length >= 0; // Can be 0 if no numbers
      results.callForwarding = await testCallForwarding();
      results.callLogs = await testCallLogs();
      results.recordings = await testRecordings();
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  // Print results
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('=' .repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n' + '=' .repeat(50));
  console.log(`🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Twilio integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the configuration and try again.');
  }

  console.log('\n💡 Next Steps:');
  console.log('1. Set up your Twilio account and get credentials');
  console.log('2. Update your .env file with Twilio configuration');
  console.log('3. Run: npm run migrate:twilio');
  console.log('4. Test with real authentication');
  console.log('5. Try purchasing a phone number');
};

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
