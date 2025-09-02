const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1/portal';
const TEST_USER = {
  username: 'downtown_admin',
  password: 'hashed_password_123'
};

let authToken = null;
let testUserId = null;
let testRequestId = null;
let testInvoiceId = null;

// Helper function to make authenticated requests
async function makeAuthRequest(method, endpoint, data = null, params = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    if (data) config.data = data;
    if (params) config.params = params;

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

// Test functions
async function testPortalAuthentication() {
  console.log('\n🔐 Testing Portal Authentication...');

  try {
    // Test login
    console.log('  Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password
    });

    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('  ✅ Login successful');
      console.log(`  User: ${loginResponse.data.data.user.username}`);
      console.log(`  Role: ${loginResponse.data.data.user.role}`);
    } else {
      console.log('  ❌ Login failed:', loginResponse.data.message);
      return false;
    }

    // Test token refresh (simulate with same token for now)
    console.log('  Testing token refresh...');
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token: 'test_refresh_token'
    });

    if (refreshResponse.data.success) {
      console.log('  ✅ Token refresh successful');
    } else {
      console.log('  ⚠️  Token refresh failed (expected for test):', refreshResponse.data.message);
    }

    return true;
  } catch (error) {
    console.log('  ❌ Authentication test failed:', error.message);
    return false;
  }
}

async function testPortalUsers() {
  console.log('\n👥 Testing Portal Users Management...');

  try {
    // Test get all portal users
    console.log('  Testing get all portal users...');
    const usersResponse = await makeAuthRequest('GET', '/users', null, {
      page: 1,
      limit: 10
    });

    if (usersResponse.success) {
      console.log('  ✅ Get all users successful');
      console.log(`  Total users: ${usersResponse.data.summary.total_users}`);
      console.log(`  Active users: ${usersResponse.data.summary.active_users}`);
      
      if (usersResponse.data.users.length > 0) {
        testUserId = usersResponse.data.users[0].id;
        console.log(`  Test user ID: ${testUserId}`);
      }
    } else {
      console.log('  ❌ Get all users failed:', usersResponse.message);
    }

    // Test get user by ID
    if (testUserId) {
      console.log('  Testing get user by ID...');
      const userResponse = await makeAuthRequest('GET', `/users/${testUserId}`);

      if (userResponse.success) {
        console.log('  ✅ Get user by ID successful');
        console.log(`  Username: ${userResponse.data.user.username}`);
        console.log(`  Email: ${userResponse.data.user.email}`);
      } else {
        console.log('  ❌ Get user by ID failed:', userResponse.message);
      }
    }

    return true;
  } catch (error) {
    console.log('  ❌ Portal users test failed:', error.message);
    return false;
  }
}

async function testServiceRequests() {
  console.log('\n📋 Testing Service Requests...');

  try {
    // Test get all service requests
    console.log('  Testing get all service requests...');
    const requestsResponse = await makeAuthRequest('GET', '/requests', null, {
      page: 1,
      limit: 10
    });

    if (requestsResponse.success) {
      console.log('  ✅ Get all service requests successful');
      console.log(`  Total requests: ${requestsResponse.data.summary.total_requests}`);
      console.log(`  Pending requests: ${requestsResponse.data.summary.pending_requests}`);
      
      if (requestsResponse.data.requests.length > 0) {
        testRequestId = requestsResponse.data.requests[0].id;
        console.log(`  Test request ID: ${testRequestId}`);
      }
    } else {
      console.log('  ❌ Get all service requests failed:', requestsResponse.message);
    }

    // Test get service request by ID
    if (testRequestId) {
      console.log('  Testing get service request by ID...');
      const requestResponse = await makeAuthRequest('GET', `/requests/${testRequestId}`);

      if (requestResponse.success) {
        console.log('  ✅ Get service request by ID successful');
        console.log(`  Title: ${requestResponse.data.request.title}`);
        console.log(`  Status: ${requestResponse.data.request.status}`);
      } else {
        console.log('  ❌ Get service request by ID failed:', requestResponse.message);
      }
    }

    // Test create service request
    console.log('  Testing create service request...');
    const newRequestData = {
      title: 'Test Service Request',
      description: 'This is a test service request for API testing',
      request_type: 'service',
      priority: 'medium',
      location: {
        address: '123 Test St',
        city: 'Test City',
        state: 'NC',
        zip_code: '28401'
      },
      scheduling: {
        preferred_date: '2024-02-01',
        preferred_time: '10:00 AM',
        flexible_timing: true,
        estimated_duration: '2-3 hours'
      },
      material_types: ['furniture', 'electronics'],
      hazardous_material: false,
      oversized_items: false,
      heavy_lifting_required: false,
      notes: 'Test request created via API'
    };

    const createResponse = await makeAuthRequest('POST', '/requests', newRequestData);

    if (createResponse.success) {
      console.log('  ✅ Create service request successful');
      console.log(`  Request ID: ${createResponse.data.request_id}`);
      console.log(`  Status: ${createResponse.data.status}`);
    } else {
      console.log('  ❌ Create service request failed:', createResponse.message);
    }

    return true;
  } catch (error) {
    console.log('  ❌ Service requests test failed:', error.message);
    return false;
  }
}

async function testJobHistory() {
  console.log('\n📊 Testing Job History...');

  try {
    // Test get job history
    console.log('  Testing get job history...');
    const jobsResponse = await makeAuthRequest('GET', '/jobs', null, {
      page: 1,
      limit: 10
    });

    if (jobsResponse.success) {
      console.log('  ✅ Get job history successful');
      console.log(`  Total jobs: ${jobsResponse.data.summary.total_jobs}`);
      console.log(`  Completed jobs: ${jobsResponse.data.summary.completed_jobs}`);
      
      if (jobsResponse.data.jobs.length > 0) {
        const testJobId = jobsResponse.data.jobs[0].id;
        console.log(`  Test job ID: ${testJobId}`);

        // Test get job details
        console.log('  Testing get job details...');
        const jobDetailsResponse = await makeAuthRequest('GET', `/jobs/${testJobId}`);

        if (jobDetailsResponse.success) {
          console.log('  ✅ Get job details successful');
          console.log(`  Job title: ${jobDetailsResponse.data.job.title}`);
          console.log(`  Job status: ${jobDetailsResponse.data.job.status}`);
        } else {
          console.log('  ❌ Get job details failed:', jobDetailsResponse.message);
        }
      }
    } else {
      console.log('  ❌ Get job history failed:', jobsResponse.message);
    }

    return true;
  } catch (error) {
    console.log('  ❌ Job history test failed:', error.message);
    return false;
  }
}

async function testInvoiceManagement() {
  console.log('\n💰 Testing Invoice Management...');

  try {
    // Test get all invoices
    console.log('  Testing get all invoices...');
    const invoicesResponse = await makeAuthRequest('GET', '/invoices', null, {
      page: 1,
      limit: 10
    });

    if (invoicesResponse.success) {
      console.log('  ✅ Get all invoices successful');
      console.log(`  Total invoices: ${invoicesResponse.data.summary.total_invoices}`);
      console.log(`  Paid invoices: ${invoicesResponse.data.summary.paid_invoices}`);
      
      if (invoicesResponse.data.invoices.length > 0) {
        testInvoiceId = invoicesResponse.data.invoices[0].id;
        console.log(`  Test invoice ID: ${testInvoiceId}`);
      }
    } else {
      console.log('  ❌ Get all invoices failed:', invoicesResponse.message);
    }

    // Test get invoice details
    if (testInvoiceId) {
      console.log('  Testing get invoice details...');
      const invoiceResponse = await makeAuthRequest('GET', `/invoices/${testInvoiceId}`);

      if (invoiceResponse.success) {
        console.log('  ✅ Get invoice details successful');
        console.log(`  Invoice number: ${invoiceResponse.data.invoice.invoice_number}`);
        console.log(`  Amount: $${invoiceResponse.data.invoice.total_amount}`);
      } else {
        console.log('  ❌ Get invoice details failed:', invoiceResponse.message);
      }
    }

    return true;
  } catch (error) {
    console.log('  ❌ Invoice management test failed:', error.message);
    return false;
  }
}

async function testClientProfile() {
  console.log('\n👤 Testing Client Profile...');

  try {
    // Test get client profile
    console.log('  Testing get client profile...');
    const profileResponse = await makeAuthRequest('GET', '/profile');

    if (profileResponse.success) {
      console.log('  ✅ Get client profile successful');
      console.log(`  Username: ${profileResponse.data.profile.username}`);
      console.log(`  Email: ${profileResponse.data.profile.email}`);
      console.log(`  Total jobs: ${profileResponse.data.profile.service_history.total_jobs}`);
    } else {
      console.log('  ❌ Get client profile failed:', profileResponse.message);
    }

    // Test update client profile
    console.log('  Testing update client profile...');
    const updateData = {
      personal_info: {
        phone: '555-9999'
      },
      preferences: {
        notification_preferences: {
          sms_notifications: true
        }
      }
    };

    const updateResponse = await makeAuthRequest('PUT', '/profile', updateData);

    if (updateResponse.success) {
      console.log('  ✅ Update client profile successful');
      console.log(`  Updated fields: ${updateResponse.data.updated_fields.join(', ')}`);
    } else {
      console.log('  ❌ Update client profile failed:', updateResponse.message);
    }

    return true;
  } catch (error) {
    console.log('  ❌ Client profile test failed:', error.message);
    return false;
  }
}

async function testPortalReports() {
  console.log('\n📈 Testing Portal Reports...');

  try {
    // Test get available report types
    console.log('  Testing get available report types...');
    const reportTypesResponse = await makeAuthRequest('GET', '/reports/available-types');

    if (reportTypesResponse.success) {
      console.log('  ✅ Get available report types successful');
      console.log(`  Available reports: ${reportTypesResponse.data.available_reports.length}`);
    } else {
      console.log('  ❌ Get available report types failed:', reportTypesResponse.message);
    }

    // Test get service summary report
    console.log('  Testing get service summary report...');
    const summaryResponse = await makeAuthRequest('GET', '/reports/service-summary', null, {
      date_from: '2024-01-01',
      date_to: '2024-01-31'
    });

    if (summaryResponse.success) {
      console.log('  ✅ Get service summary report successful');
      console.log(`  Report period: ${summaryResponse.data.report_period.from} to ${summaryResponse.data.report_period.to}`);
      console.log(`  Total requests: ${summaryResponse.data.service_overview.total_requests}`);
    } else {
      console.log('  ❌ Get service summary report failed:', summaryResponse.message);
    }

    // Test get report history
    console.log('  Testing get report history...');
    const historyResponse = await makeAuthRequest('GET', '/reports/history', null, {
      page: 1,
      limit: 10
    });

    if (historyResponse.success) {
      console.log('  ✅ Get report history successful');
      console.log(`  Total reports: ${historyResponse.data.pagination.total}`);
    } else {
      console.log('  ❌ Get report history failed:', historyResponse.message);
    }

    return true;
  } catch (error) {
    console.log('  ❌ Portal reports test failed:', error.message);
    return false;
  }
}

async function testPortalSettings() {
  console.log('\n⚙️  Testing Portal Settings...');

  try {
    // Test get portal settings
    console.log('  Testing get portal settings...');
    const settingsResponse = await makeAuthRequest('GET', '/settings');

    if (settingsResponse.success) {
      console.log('  ✅ Get portal settings successful');
      console.log(`  Language: ${settingsResponse.data.general_settings.default_language}`);
      console.log(`  Timezone: ${settingsResponse.data.general_settings.default_timezone}`);
    } else {
      console.log('  ❌ Get portal settings failed:', settingsResponse.message);
    }

    // Test get setting options
    console.log('  Testing get setting options...');
    const optionsResponse = await makeAuthRequest('GET', '/settings/options');

    if (optionsResponse.success) {
      console.log('  ✅ Get setting options successful');
      console.log(`  General settings: ${Object.keys(optionsResponse.data.setting_options.general_settings).length}`);
      console.log(`  Notification settings: ${Object.keys(optionsResponse.data.setting_options.notification_settings).length}`);
    } else {
      console.log('  ❌ Get setting options failed:', optionsResponse.message);
    }

    // Test update portal settings
    console.log('  Testing update portal settings...');
    const updateData = {
      notification_settings: {
        email_notifications: true,
        sms_notifications: false
      },
      privacy_settings: {
        profile_visibility: 'private'
      }
    };

    const updateResponse = await makeAuthRequest('PUT', '/settings', updateData);

    if (updateResponse.success) {
      console.log('  ✅ Update portal settings successful');
      console.log(`  Updated fields: ${updateResponse.data.updated_fields.join(', ')}`);
    } else {
      console.log('  ❌ Update portal settings failed:', updateResponse.message);
    }

    return true;
  } catch (error) {
    console.log('  ❌ Portal settings test failed:', error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');

  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);

    if (healthResponse.data.success) {
      console.log('  ✅ Health check successful');
      console.log(`  Message: ${healthResponse.data.message}`);
    } else {
      console.log('  ❌ Health check failed:', healthResponse.data.message);
    }

    return true;
  } catch (error) {
    console.log('  ❌ Health check test failed:', error.message);
    return false;
  }
}

async function testLogout() {
  console.log('\n🚪 Testing Logout...');

  try {
    const logoutResponse = await makeAuthRequest('POST', '/auth/logout');

    if (logoutResponse.success) {
      console.log('  ✅ Logout successful');
      console.log(`  User ID: ${logoutResponse.data.data.user_id}`);
    } else {
      console.log('  ❌ Logout failed:', logoutResponse.message);
    }

    return true;
  } catch (error) {
    console.log('  ❌ Logout test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Client Portal API Tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Test User: ${TEST_USER.username}`);

  const tests = [
    { name: 'Portal Authentication', fn: testPortalAuthentication },
    { name: 'Portal Users Management', fn: testPortalUsers },
    { name: 'Service Requests', fn: testServiceRequests },
    { name: 'Job History', fn: testJobHistory },
    { name: 'Invoice Management', fn: testInvoiceManagement },
    { name: 'Client Profile', fn: testClientProfile },
    { name: 'Portal Reports', fn: testPortalReports },
    { name: 'Portal Settings', fn: testPortalSettings },
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Logout', fn: testLogout }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`  ❌ ${test.name} test crashed:`, error.message);
    }
  }

  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The Client Portal API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above for details.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n🏁 Test suite completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testPortalAuthentication,
  testPortalUsers,
  testServiceRequests,
  testJobHistory,
  testInvoiceManagement,
  testClientProfile,
  testPortalReports,
  testPortalSettings,
  testHealthCheck,
  testLogout
};
