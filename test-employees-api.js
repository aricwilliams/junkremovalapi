const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1/employees';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual token

// Test data
const testEmployee = {
  personal_info: {
    first_name: 'Test',
    last_name: 'Employee',
    email: 'test.employee@company.com',
    phone: '555-9999'
  },
  employment_info: {
    department: 'operations',
    position: 'helper',
    hire_date: '2024-01-15'
  },
  compensation: {
    current_salary: 35000,
    hourly_rate: 16.50
  },
  schedule: {
    work_schedule: 'monday_friday',
    start_time: '08:00',
    end_time: '17:00',
    break_duration: 60
  }
};

const testTraining = {
  course_name: 'Safety Training',
  type: 'safety',
  completion_date: '2024-01-15',
  duration_hours: 8,
  score: 95,
  certificate_number: 'SAF-2024-001'
};

const testClockAction = {
  action: 'clock_in',
  timestamp: new Date().toISOString(),
  location: 'Main Office',
  notes: 'Test clock in'
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, params = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) config.data = data;
    if (params) config.params = params;

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    console.log('   Response:', result.data.message);
  } else {
    console.log('❌ Health check failed');
    console.log('   Error:', result.error);
  }
}

async function testGetAllEmployees() {
  console.log('\n🔍 Testing Get All Employees...');
  const result = await makeRequest('GET', '/', null, { page: 1, limit: 5 });
  
  if (result.success) {
    console.log('✅ Get all employees passed');
    console.log(`   Found ${result.data.data.employees.length} employees`);
    console.log(`   Total employees: ${result.data.data.summary.total_employees}`);
  } else {
    console.log('❌ Get all employees failed');
    console.log('   Error:', result.error);
  }
}

async function testCreateEmployee() {
  console.log('\n🔍 Testing Create Employee...');
  const result = await makeRequest('POST', '/', testEmployee);
  
  if (result.success) {
    console.log('✅ Create employee passed');
    console.log(`   Employee ID: ${result.data.data.employee.employee_id}`);
    console.log(`   Name: ${result.data.data.employee.first_name} ${result.data.data.employee.last_name}`);
    return result.data.data.employee.employee_id;
  } else {
    console.log('❌ Create employee failed');
    console.log('   Error:', result.error);
    return null;
  }
}

async function testGetEmployeeById(employeeId) {
  if (!employeeId) return;
  
  console.log('\n🔍 Testing Get Employee by ID...');
  const result = await makeRequest('GET', `/${employeeId}`);
  
  if (result.success) {
    console.log('✅ Get employee by ID passed');
    console.log(`   Employee: ${result.data.data.employee.employee_name}`);
    console.log(`   Department: ${result.data.data.employee.employment_info.department}`);
    console.log(`   Position: ${result.data.data.employee.employment_info.position}`);
  } else {
    console.log('❌ Get employee by ID failed');
    console.log('   Error:', result.error);
  }
}

async function testUpdateEmployee(employeeId) {
  if (!employeeId) return;
  
  console.log('\n🔍 Testing Update Employee...');
  const updateData = {
    personal_info: {
      phone: '555-8888'
    },
    employment_info: {
      position: 'driver'
    }
  };
  
  const result = await makeRequest('PUT', `/${employeeId}`, updateData);
  
  if (result.success) {
    console.log('✅ Update employee passed');
    console.log(`   Updated fields: ${result.data.data.updated_fields.join(', ')}`);
  } else {
    console.log('❌ Update employee failed');
    console.log('   Error:', result.error);
  }
}

async function testEmployeeSchedule(employeeId) {
  if (!employeeId) return;
  
  console.log('\n🔍 Testing Employee Schedule...');
  const result = await makeRequest('GET', `/${employeeId}/schedule`, null, {
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (result.success) {
    console.log('✅ Get employee schedule passed');
    console.log(`   Schedule data retrieved for employee`);
  } else {
    console.log('❌ Get employee schedule failed');
    console.log('   Error:', result.error);
  }
}

async function testEmployeePayroll(employeeId) {
  if (!employeeId) return;
  
  console.log('\n🔍 Testing Employee Payroll...');
  const result = await makeRequest('GET', `/${employeeId}/payroll`, null, {
    pay_period: 'biweekly',
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (result.success) {
    console.log('✅ Get employee payroll passed');
    console.log(`   Payroll data retrieved for employee`);
    console.log(`   Pay period: ${result.data.data.current_pay_period.start_date} to ${result.data.data.current_pay_period.end_date}`);
  } else {
    console.log('❌ Get employee payroll failed');
    console.log('   Error:', result.error);
  }
}

async function testEmployeeTraining(employeeId) {
  if (!employeeId) return;
  
  console.log('\n🔍 Testing Employee Training...');
  
  // Get training records
  const getResult = await makeRequest('GET', `/${employeeId}/training`);
  
  if (getResult.success) {
    console.log('✅ Get employee training passed');
    console.log(`   Training records retrieved for employee`);
  } else {
    console.log('❌ Get employee training failed');
    console.log('   Error:', getResult.error);
  }
  
  // Add training record
  const addResult = await makeRequest('POST', `/${employeeId}/training`, testTraining);
  
  if (addResult.success) {
    console.log('✅ Add training record passed');
    console.log(`   Training record added: ${addResult.data.data.training_name}`);
  } else {
    console.log('❌ Add training record failed');
    console.log('   Error:', addResult.error);
  }
}

async function testEmployeeTimeTracking(employeeId) {
  if (!employeeId) return;
  
  console.log('\n🔍 Testing Employee Time Tracking...');
  
  // Clock in
  const clockInResult = await makeRequest('POST', `/${employeeId}/clock`, testClockAction);
  
  if (clockInResult.success) {
    console.log('✅ Clock in passed');
    console.log(`   Employee clocked in successfully`);
  } else {
    console.log('❌ Clock in failed');
    console.log('   Error:', clockInResult.error);
  }
  
  // Get time logs
  const timeLogsResult = await makeRequest('GET', `/${employeeId}/time-logs`, null, {
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (timeLogsResult.success) {
    console.log('✅ Get time logs passed');
    console.log(`   Time logs retrieved for employee`);
  } else {
    console.log('❌ Get time logs failed');
    console.log('   Error:', timeLogsResult.error);
  }
}

async function testPayrollSummary() {
  console.log('\n🔍 Testing Payroll Summary...');
  const result = await makeRequest('GET', '/payroll/summary', null, {
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (result.success) {
    console.log('✅ Get payroll summary passed');
    console.log(`   Payroll summary retrieved`);
    console.log(`   Total employees: ${result.data.data.summary.total_employees}`);
  } else {
    console.log('❌ Get payroll summary failed');
    console.log('   Error:', result.error);
  }
}

async function testPayrollReports() {
  console.log('\n🔍 Testing Payroll Reports...');
  const result = await makeRequest('GET', '/payroll/reports', null, {
    report_type: 'comprehensive',
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (result.success) {
    console.log('✅ Get payroll reports passed');
    console.log(`   Payroll report generated: ${result.data.data.report_type}`);
  } else {
    console.log('❌ Get payroll reports failed');
    console.log('   Error:', result.error);
  }
}

async function testTrainingAnalytics() {
  console.log('\n🔍 Testing Training Analytics...');
  const result = await makeRequest('GET', '/training/analytics', null, {
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (result.success) {
    console.log('✅ Get training analytics passed');
    console.log(`   Training analytics retrieved`);
    console.log(`   Total training: ${result.data.data.summary.total_training}`);
  } else {
    console.log('❌ Get training analytics failed');
    console.log('   Error:', result.error);
  }
}

async function testTimeTrackingAnalytics() {
  console.log('\n🔍 Testing Time Tracking Analytics...');
  const result = await makeRequest('GET', '/time-tracking/analytics', null, {
    report_type: 'comprehensive',
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (result.success) {
    console.log('✅ Get time tracking analytics passed');
    console.log(`   Time tracking analytics retrieved`);
    console.log(`   Report type: ${result.data.data.report_type}`);
  } else {
    console.log('❌ Get time tracking analytics failed');
    console.log('   Error:', result.error);
  }
}

async function testTeamTimeTracking() {
  console.log('\n🔍 Testing Team Time Tracking...');
  const result = await makeRequest('GET', '/time-tracking/team', null, {
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (result.success) {
    console.log('✅ Get team time tracking passed');
    console.log(`   Team time tracking retrieved`);
    console.log(`   Total employees: ${result.data.data.summary.total_employees}`);
  } else {
    console.log('❌ Get team time tracking failed');
    console.log('   Error:', result.error);
  }
}

async function testEmployeeReports() {
  console.log('\n🔍 Testing Employee Reports...');
  
  // Summary report
  const summaryResult = await makeRequest('GET', '/reports/summary', null, {
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (summaryResult.success) {
    console.log('✅ Get employee summary report passed');
    console.log(`   Summary report generated`);
  } else {
    console.log('❌ Get employee summary report failed');
    console.log('   Error:', summaryResult.error);
  }
  
  // Performance report
  const performanceResult = await makeRequest('GET', '/reports/performance', null, {
    date_from: '2024-01-01',
    date_to: '2024-01-31',
    performance_threshold: 3.0
  });
  
  if (performanceResult.success) {
    console.log('✅ Get employee performance report passed');
    console.log(`   Performance report generated`);
  } else {
    console.log('❌ Get employee performance report failed');
    console.log('   Error:', performanceResult.error);
  }
  
  // Turnover analysis
  const turnoverResult = await makeRequest('GET', '/reports/turnover', null, {
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  });
  
  if (turnoverResult.success) {
    console.log('✅ Get employee turnover analysis passed');
    console.log(`   Turnover analysis generated`);
  } else {
    console.log('❌ Get employee turnover analysis failed');
    console.log('   Error:', turnoverResult.error);
  }
}

async function testDeleteEmployee(employeeId) {
  if (!employeeId) return;
  
  console.log('\n🔍 Testing Delete Employee...');
  const result = await makeRequest('DELETE', `/${employeeId}`);
  
  if (result.success) {
    console.log('✅ Delete employee passed');
    console.log(`   Employee status: ${result.data.data.status}`);
  } else {
    console.log('❌ Delete employee failed');
    console.log('   Error:', result.error);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Employees API Tests...');
  console.log('=====================================');
  
  try {
    // Test basic functionality
    await testHealthCheck();
    await testGetAllEmployees();
    
    // Test employee CRUD operations
    const employeeId = await testCreateEmployee();
    await testGetEmployeeById(employeeId);
    await testUpdateEmployee(employeeId);
    
    // Test employee features
    await testEmployeeSchedule(employeeId);
    await testEmployeePayroll(employeeId);
    await testEmployeeTraining(employeeId);
    await testEmployeeTimeTracking(employeeId);
    
    // Test summary and analytics
    await testPayrollSummary();
    await testPayrollReports();
    await testTrainingAnalytics();
    await testTimeTrackingAnalytics();
    await testTeamTimeTracking();
    
    // Test reports
    await testEmployeeReports();
    
    // Clean up
    await testDeleteEmployee(employeeId);
    
    console.log('\n🎉 All tests completed!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Check if AUTH_TOKEN is set
  if (AUTH_TOKEN === 'your-jwt-token-here') {
    console.error('❌ Please set a valid AUTH_TOKEN in the test script');
    console.error('   Replace "your-jwt-token-here" with an actual JWT token');
    process.exit(1);
  }
  
  runTests();
}

module.exports = {
  runTests,
  testEmployee,
  testTraining,
  testClockAction
};
