const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/auth';

// Test data for signup
const testBusiness = {
  business_name: "Test Junk Removal LLC",
  business_phone: "+1234567890",
  business_address: "123 Main St",
  business_city: "Test City",
  business_state: "CA",
  business_zip_code: "12345",
  owner_first_name: "John",
  owner_last_name: "Doe",
  owner_email: "john.doe@testjunkremoval.com",
  owner_phone: "+1234567890",
  username: "testjunkremoval",
  password: "TestPass123!",
  license_number: "LIC123456",
  insurance_number: "INS123456",
  service_radius: 25,
  number_of_trucks: 2,
  years_in_business: 5
};

async function testSignup() {
  try {
    console.log('🧪 Testing Business Signup...');
    const response = await axios.post(`${BASE_URL}/signup`, testBusiness);
    
    console.log('✅ Signup successful!');
    console.log('Response:', {
      success: response.data.success,
      message: response.data.message,
      hasToken: !!response.data.data.token,
      businessId: response.data.data.business.id
    });
    
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Signup failed:', error.response?.data || error.message);
    return null;
  }
}

async function testLogin() {
  try {
    console.log('\n🧪 Testing Business Login...');
    const loginData = {
      username: testBusiness.username,
      password: testBusiness.password
    };
    
    const response = await axios.post(`${BASE_URL}/login`, loginData);
    
    console.log('✅ Login successful!');
    console.log('Response:', {
      success: response.data.success,
      message: response.data.message,
      hasToken: !!response.data.data.token,
      businessId: response.data.data.business.id
    });
    
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testProfile(token) {
  try {
    console.log('\n🧪 Testing Get Profile...');
    const response = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Get profile successful!');
    console.log('Response:', {
      success: response.data.success,
      businessName: response.data.data.business.business_name,
      ownerName: `${response.data.data.business.owner_first_name} ${response.data.data.business.owner_last_name}`
    });
    
    return true;
  } catch (error) {
    console.error('❌ Get profile failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateProfile(token) {
  try {
    console.log('\n🧪 Testing Update Profile...');
    const updateData = {
      business_name: "Updated Test Junk Removal LLC",
      service_radius: 30,
      number_of_trucks: 3
    };
    
    const response = await axios.put(`${BASE_URL}/profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Update profile successful!');
    console.log('Response:', {
      success: response.data.success,
      message: response.data.message,
      updatedBusinessName: response.data.data.business.business_name,
      updatedServiceRadius: response.data.data.business.service_radius
    });
    
    return true;
  } catch (error) {
    console.error('❌ Update profile failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Authentication API Tests...\n');
  
  // Test signup
  const signupToken = await testSignup();
  
  // Test login
  const loginToken = await testLogin();
  
  // Use login token for profile tests
  const token = loginToken || signupToken;
  
  if (token) {
    // Test get profile
    await testProfile(token);
    
    // Test update profile
    await testUpdateProfile(token);
  }
  
  console.log('\n🏁 Authentication API Tests Complete!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testSignup,
  testLogin,
  testProfile,
  testUpdateProfile,
  runTests
};
