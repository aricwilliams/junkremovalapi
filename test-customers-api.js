#!/usr/bin/env node

/**
 * Simple test script for the Customers API
 * Run with: node test-customers-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api/v1/customers';
const TEST_TOKEN = 'test_token'; // Replace with actual JWT token

// Test configuration
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health',
    auth: false,
    expectedStatus: 200
  },
  {
    name: 'API Documentation',
    method: 'GET',
    path: '/docs',
    auth: false,
    expectedStatus: 200
  },
  {
    name: 'Get All Customers (Unauthorized)',
    method: 'GET',
    path: '/',
    auth: false,
    expectedStatus: 401
  },
  {
    name: 'Get All Customers (Authorized)',
    method: 'GET',
    path: '/',
    auth: true,
    expectedStatus: 200
  },
  {
    name: 'Search Customers (Unauthorized)',
    method: 'GET',
    path: '/search?q=test',
    auth: false,
    expectedStatus: 401
  },
  {
    name: 'Search Customers (Authorized)',
    method: 'GET',
    path: '/search?q=test',
    auth: true,
    expectedStatus: 200
  }
];

// Helper function to make HTTP requests
function makeRequest(method, path, auth = false, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (auth) {
      options.headers['Authorization'] = `Bearer ${TEST_TOKEN}`;
    }

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Customers API...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const response = await makeRequest(
        test.method, 
        test.path, 
        test.auth
      );

      if (response.status === test.expectedStatus) {
        console.log(`✅ PASS - Status: ${response.status}`);
        passed++;
      } else {
        console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${response.status}`);
        if (response.data && response.data.message) {
          console.log(`   Message: ${response.data.message}`);
        }
        failed++;
      }

      // Add a small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
      failed++;
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! The Customers API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the server logs for more details.');
  }
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await makeRequest('GET', '/health', false);
    if (response.status === 200) {
      console.log('✅ Server is running and healthy');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('   Make sure to start the server with: npm run dev');
    return false;
  }
  return false;
}

// Main execution
async function main() {
  console.log('🚀 Customers API Test Suite\n');
  
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  console.log('');
  await runTests();
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, makeRequest };
