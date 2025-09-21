const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SEO_ENDPOINT = `${BASE_URL}/api/seo`;

// Test data - API keys are now in environment variables
const TEST_DATA = {
  address: '618 South 7th Street, Wilmington, NC 28401',
  gridSize: '0.7x0.7',
  keyword: 'junk removal',
  targetBusinessName: 'Hancock Hauling'
};

// Removed individual endpoint tests - only testing the main analyze endpoint

/**
 * Test the grid sizes endpoint
 */
async function testGridSizes() {
  console.log('\n🧪 Testing Grid Sizes Endpoint...');
  
  try {
    const response = await axios.get(`${SEO_ENDPOINT}/grid-sizes`);
    
    console.log('✅ Grid sizes test passed');
    console.log('Available grid sizes:');
    response.data.grid_sizes.forEach(size => {
      console.log(`  - ${size.size}: ${size.description}`);
    });
    return response.data;
    
  } catch (error) {
    console.log('❌ Grid sizes test failed');
    if (error.response) {
      console.log('Error response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

/**
 * Test the main SEO analysis endpoint (ONLY endpoint needed)
 */
async function testSEOAnalysis() {
  console.log('\n🧪 Testing SEO Analysis Endpoint...');
  
  try {
    const response = await axios.post(`${SEO_ENDPOINT}/analyze`, {
      business_address: TEST_DATA.address,
      keyword: TEST_DATA.keyword,
      target_business_name: TEST_DATA.targetBusinessName,
      grid_size: TEST_DATA.gridSize
    });
    
    console.log('✅ SEO analysis test passed');
    console.log('Query:', response.data.query);
    console.log('Center:', response.data.center);
    console.log(`Total points: ${response.data.points.length}`);
    console.log(`Points with rankings: ${response.data.points.filter(p => p.rank !== null).length}`);
    console.log('First few points:', response.data.points.slice(0, 3));
    return response.data;
    
  } catch (error) {
    console.log('❌ SEO analysis test failed');
    if (error.response) {
      console.log('Error response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

/**
 * Test validation errors
 */
async function testValidationErrors() {
  console.log('\n🧪 Testing Validation Errors...');
  
  try {
    // Test missing business address
    await axios.post(`${SEO_ENDPOINT}/analyze`, {
      keyword: TEST_DATA.keyword,
      target_business_name: TEST_DATA.targetBusinessName,
      grid_size: TEST_DATA.gridSize
    });
    console.log('❌ Should have failed with missing business address');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Validation error test passed - missing business address');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
  
  try {
    // Test invalid grid size
    await axios.post(`${SEO_ENDPOINT}/analyze`, {
      business_address: TEST_DATA.address,
      keyword: TEST_DATA.keyword,
      target_business_name: TEST_DATA.targetBusinessName,
      grid_size: 'invalid-size'
    });
    console.log('❌ Should have failed with invalid grid size');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Validation error test passed - invalid grid size');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting SEO Rankings API Tests');
  console.log('=====================================');
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running');
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first.');
    console.log('Run: npm start or node server.js');
    return;
  }
  
  // Run tests
  await testGridSizes();
  await testValidationErrors();
  
  // Test the main SEO analysis endpoint
  await testSEOAnalysis();
  
  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGridSizes,
  testSEOAnalysis,
  testValidationErrors,
  runTests
};
