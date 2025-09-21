const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SEO_ENDPOINT = `${BASE_URL}/api/seo`;

// Test API key management functionality
async function testApiKeyManagement() {
  console.log('🧪 Testing SEO API Key Management...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Checking server status...');
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');
    
    // Test 2: Get usage stats
    console.log('2️⃣ Getting current usage stats...');
    try {
      const statsResponse = await axios.get(`${SEO_ENDPOINT}/usage-stats`);
      console.log('✅ Usage stats retrieved:');
      console.table(statsResponse.data.stats);
    } catch (error) {
      console.log('⚠️  Usage stats not available (table may not exist yet)');
    }
    console.log();
    
    // Test 3: Add a test API key
    console.log('3️⃣ Testing add API key functionality...');
    try {
      const addKeyResponse = await axios.post(`${SEO_ENDPOINT}/add-key`, {
        api_key: 'test_key_12345'
      });
      console.log('✅ Add key test:', addKeyResponse.data);
    } catch (error) {
      console.log('⚠️  Add key test failed:', error.response?.data || error.message);
    }
    console.log();
    
    // Test 4: Test SEO analysis (this will use API key rotation)
    console.log('4️⃣ Testing SEO analysis with API key rotation...');
    try {
      const analysisResponse = await axios.post(`${SEO_ENDPOINT}/analyze`, {
        business_address: '618 South 7th Street, Wilmington, NC 28401',
        keyword: 'junk removal',
        target_business_name: 'Hancock Hauling',
        grid_size: '0.7x0.7'
      });
      
      console.log('✅ SEO analysis completed');
      console.log(`Query: ${analysisResponse.data.query}`);
      console.log(`Center: ${JSON.stringify(analysisResponse.data.center)}`);
      console.log(`Total points: ${analysisResponse.data.points.length}`);
      console.log(`Points with rankings: ${analysisResponse.data.points.filter(p => p.rank !== null).length}`);
      
    } catch (error) {
      console.log('❌ SEO analysis test failed:', error.response?.data || error.message);
    }
    console.log();
    
    // Test 5: Check updated usage stats
    console.log('5️⃣ Checking updated usage stats...');
    try {
      const updatedStatsResponse = await axios.get(`${SEO_ENDPOINT}/usage-stats`);
      console.log('✅ Updated usage stats:');
      console.table(updatedStatsResponse.data.stats);
    } catch (error) {
      console.log('⚠️  Updated stats not available');
    }
    
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    console.log('Make sure the server is running: npm start');
  }
}

// Run tests
if (require.main === module) {
  testApiKeyManagement();
}

module.exports = { testApiKeyManagement };
