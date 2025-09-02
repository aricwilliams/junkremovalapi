#!/usr/bin/env node

/**
 * Fleet Management API Test Script
 * Tests all major endpoints of the Fleet Management API
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1/fleet';
const AUTH_TOKEN = 'test_jwt_token'; // Replace with actual test token

// Test data
const testVehicle = {
  name: 'Test Junk Hauler',
  license_plate: 'TEST-123',
  make: 'Ford',
  model: 'F-650',
  year: 2023,
  vehicle_type: 'truck',
  capacity_weight: 10000,
  capacity_volume: 20,
  fuel_type: 'diesel',
  fuel_capacity: 50
};

const testMaintenance = {
  maintenance_type: 'routine',
  priority: 'medium',
  title: 'Oil Change and Inspection',
  description: 'Regular oil change and safety inspection',
  scheduled_date: '2024-02-01',
  estimated_cost: 150.00
};

const testLocation = {
  address: '123 Test Street, Test City, NC 12345',
  coordinates: {
    latitude: 35.7796,
    longitude: -78.6382
  },
  tracking_data: {
    speed: 45,
    fuel_level: 75,
    engine_status: 'running'
  }
};

const testAssignment = {
  crew_id: 'crew-123',
  assignment_type: 'crew',
  start_date: '2024-01-15',
  notes: 'Test assignment for demo purposes'
};

const testFuelLog = {
  fuel_date: '2024-01-15',
  fuel_type: 'diesel',
  fuel_quantity: 25.5,
  fuel_cost_per_unit: 3.50,
  total_fuel_cost: 89.25,
  odometer_reading: 50000,
  fuel_station: 'Test Gas Station'
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
      status: error.response?.status || 500 
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.data.message}`);
  } else {
    console.log('❌ Health check failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.error.message || result.error}`);
  }
}

async function testVehicles() {
  console.log('\n🚛 Testing Vehicles Endpoints...');
  
  // Test create vehicle
  console.log('   Creating test vehicle...');
  const createResult = await makeRequest('POST', '/vehicles', testVehicle);
  
  if (createResult.success) {
    console.log('   ✅ Vehicle created successfully');
    const vehicleId = createResult.data.data.vehicle_id;
    
    // Test get all vehicles
    console.log('   Getting all vehicles...');
    const getAllResult = await makeRequest('GET', '/vehicles');
    
    if (getAllResult.success) {
      console.log('   ✅ Retrieved all vehicles');
      console.log(`      Total vehicles: ${getAllResult.data.data.pagination.total}`);
    } else {
      console.log('   ❌ Failed to get all vehicles');
    }
    
    // Test get vehicle by ID
    console.log('   Getting vehicle by ID...');
    const getByIdResult = await makeRequest('GET', `/vehicles/${vehicleId}`);
    
    if (getByIdResult.success) {
      console.log('   ✅ Retrieved vehicle by ID');
      console.log(`      Vehicle name: ${getByIdResult.data.data.vehicle.vehicle_name}`);
    } else {
      console.log('   ❌ Failed to get vehicle by ID');
    }
    
    // Test update vehicle
    console.log('   Updating vehicle...');
    const updateResult = await makeRequest('PUT', `/vehicles/${vehicleId}`, {
      notes: 'Updated test vehicle'
    });
    
    if (updateResult.success) {
      console.log('   ✅ Vehicle updated successfully');
    } else {
      console.log('   ❌ Failed to update vehicle');
    }
    
    // Test delete vehicle
    console.log('   Deleting vehicle...');
    const deleteResult = await makeRequest('DELETE', `/vehicles/${vehicleId}`);
    
    if (deleteResult.success) {
      console.log('   ✅ Vehicle deleted successfully');
    } else {
      console.log('   ❌ Failed to delete vehicle');
    }
    
    return vehicleId;
  } else {
    console.log('   ❌ Failed to create vehicle');
    console.log(`      Error: ${createResult.error.message || createResult.error}`);
    return null;
  }
}

async function testMaintenance(vehicleId) {
  if (!vehicleId) {
    console.log('   ⏭️  Skipping maintenance tests (no vehicle ID)');
    return;
  }
  
  console.log('\n🔧 Testing Maintenance Endpoints...');
  
  // Test create maintenance record
  console.log('   Creating maintenance record...');
  const createResult = await makeRequest('POST', `/vehicles/${vehicleId}/maintenance`, testMaintenance);
  
  if (createResult.success) {
    console.log('   ✅ Maintenance record created successfully');
    const maintenanceId = createResult.data.data.maintenance_id;
    
    // Test get maintenance records
    console.log('   Getting maintenance records...');
    const getAllResult = await makeRequest('GET', `/vehicles/${vehicleId}/maintenance`);
    
    if (getAllResult.success) {
      console.log('   ✅ Retrieved maintenance records');
      console.log(`      Total records: ${getAllResult.data.data.summary.total_records}`);
    } else {
      console.log('   ❌ Failed to get maintenance records');
    }
    
    // Test update maintenance record
    console.log('   Updating maintenance record...');
    const updateResult = await makeRequest('PUT', `/vehicles/${vehicleId}/maintenance/${maintenanceId}`, {
      status: 'completed',
      actual_cost: 145.00
    });
    
    if (updateResult.success) {
      console.log('   ✅ Maintenance record updated successfully');
    } else {
      console.log('   ❌ Failed to update maintenance record');
    }
    
    // Test delete maintenance record
    console.log('   Deleting maintenance record...');
    const deleteResult = await makeRequest('DELETE', `/vehicles/${vehicleId}/maintenance/${maintenanceId}`);
    
    if (deleteResult.success) {
      console.log('   ✅ Maintenance record deleted successfully');
    } else {
      console.log('   ❌ Failed to delete maintenance record');
    }
  } else {
    console.log('   ❌ Failed to create maintenance record');
    console.log(`      Error: ${createResult.error.message || createResult.error}`);
  }
}

async function testTracking(vehicleId) {
  if (!vehicleId) {
    console.log('   ⏭️  Skipping tracking tests (no vehicle ID)');
    return;
  }
  
  console.log('\n📍 Testing Tracking Endpoints...');
  
  // Test update vehicle location
  console.log('   Updating vehicle location...');
  const updateLocationResult = await makeRequest('POST', `/vehicles/${vehicleId}/location`, testLocation);
  
  if (updateLocationResult.success) {
    console.log('   ✅ Vehicle location updated successfully');
    
    // Test get vehicle location
    console.log('   Getting vehicle location...');
    const getLocationResult = await makeRequest('GET', `/vehicles/${vehicleId}/location`);
    
    if (getLocationResult.success) {
      console.log('   ✅ Retrieved vehicle location');
      console.log(`      Address: ${getLocationResult.data.data.current_location.address}`);
    } else {
      console.log('   ❌ Failed to get vehicle location');
    }
  } else {
    console.log('   ❌ Failed to update vehicle location');
    console.log(`      Error: ${updateLocationResult.error.message || updateLocationResult.error}`);
  }
}

async function testAssignments(vehicleId) {
  if (!vehicleId) {
    console.log('   ⏭️  Skipping assignment tests (no vehicle ID)');
    return;
  }
  
  console.log('\n👥 Testing Assignment Endpoints...');
  
  // Test assign vehicle
  console.log('   Assigning vehicle...');
  const assignResult = await makeRequest('POST', `/vehicles/${vehicleId}/assign`, testAssignment);
  
  if (assignResult.success) {
    console.log('   ✅ Vehicle assigned successfully');
    const assignmentId = assignResult.data.data.assignment_id;
    
    // Test get vehicle assignments
    console.log('   Getting vehicle assignments...');
    const getAllResult = await makeRequest('GET', `/vehicles/${vehicleId}/assignments`);
    
    if (getAllResult.success) {
      console.log('   ✅ Retrieved vehicle assignments');
      console.log(`      Total assignments: ${getAllResult.data.data.summary.total_assignments}`);
    } else {
      console.log('   ❌ Failed to get vehicle assignments');
    }
    
    // Test update assignment
    console.log('   Updating assignment...');
    const updateResult = await makeRequest('PUT', `/vehicles/${vehicleId}/assignments/${assignmentId}`, {
      status: 'completed',
      end_date: '2024-01-16'
    });
    
    if (updateResult.success) {
      console.log('   ✅ Assignment updated successfully');
    } else {
      console.log('   ❌ Failed to update assignment');
    }
    
    // Test delete assignment
    console.log('   Deleting assignment...');
    const deleteResult = await makeRequest('DELETE', `/vehicles/${vehicleId}/assignments/${assignmentId}`);
    
    if (deleteResult.success) {
      console.log('   ✅ Assignment deleted successfully');
    } else {
      console.log('   ❌ Failed to delete assignment');
    }
  } else {
    console.log('   ❌ Failed to assign vehicle');
    console.log(`      Error: ${assignResult.error.message || assignResult.error}`);
  }
}

async function testFuelLogs(vehicleId) {
  if (!vehicleId) {
    console.log('   ⏭️  Skipping fuel log tests (no vehicle ID)');
    return;
  }
  
  console.log('\n⛽ Testing Fuel Log Endpoints...');
  
  // Test add fuel log
  console.log('   Adding fuel log...');
  const addResult = await makeRequest('POST', `/vehicles/${vehicleId}/fuel-logs`, testFuelLog);
  
  if (addResult.success) {
    console.log('   ✅ Fuel log added successfully');
    const fuelLogId = addResult.data.data.fuel_log_id;
    
    // Test get fuel logs
    console.log('   Getting fuel logs...');
    const getAllResult = await makeRequest('GET', `/vehicles/${vehicleId}/fuel-logs`);
    
    if (getAllResult.success) {
      console.log('   ✅ Retrieved fuel logs');
      console.log(`      Total logs: ${getAllResult.data.data.summary.total_logs}`);
    } else {
      console.log('   ❌ Failed to get fuel logs');
    }
    
    // Test update fuel log
    console.log('   Updating fuel log...');
    const updateResult = await makeRequest('PUT', `/vehicles/${vehicleId}/fuel-logs/${fuelLogId}`, {
      notes: 'Updated fuel log entry'
    });
    
    if (updateResult.success) {
      console.log('   ✅ Fuel log updated successfully');
    } else {
      console.log('   ❌ Failed to update fuel log');
    }
    
    // Test delete fuel log
    console.log('   Deleting fuel log...');
    const deleteResult = await makeRequest('DELETE', `/vehicles/${vehicleId}/fuel-logs/${fuelLogId}`);
    
    if (deleteResult.success) {
      console.log('   ✅ Fuel log deleted successfully');
    } else {
      console.log('   ❌ Failed to delete fuel log');
    }
  } else {
    console.log('   ❌ Failed to add fuel log');
    console.log(`      Error: ${addResult.error.message || addResult.error}`);
  }
}

async function testReports() {
  console.log('\n📊 Testing Reports Endpoints...');
  
  const dateParams = {
    date_from: '2024-01-01',
    date_to: '2024-01-31'
  };
  
  // Test fleet summary report
  console.log('   Getting fleet summary report...');
  const summaryResult = await makeRequest('GET', '/reports/summary', null, dateParams);
  
  if (summaryResult.success) {
    console.log('   ✅ Fleet summary report generated successfully');
    console.log(`      Total vehicles: ${summaryResult.data.data.fleet_overview.total_vehicles}`);
  } else {
    console.log('   ❌ Failed to get fleet summary report');
    console.log(`      Error: ${summaryResult.error.message || summaryResult.error}`);
  }
  
  // Test fleet performance report
  console.log('   Getting fleet performance report...');
  const performanceResult = await makeRequest('GET', '/reports/performance', null, dateParams);
  
  if (performanceResult.success) {
    console.log('   ✅ Fleet performance report generated successfully');
    console.log(`      Vehicle performance records: ${performanceResult.data.data.vehicle_performance.length}`);
  } else {
    console.log('   ❌ Failed to get fleet performance report');
    console.log(`      Error: ${performanceResult.error.message || performanceResult.error}`);
  }
  
  // Test fleet insights
  console.log('   Getting fleet insights...');
  const insightsResult = await makeRequest('GET', '/reports/insights', null, dateParams);
  
  if (insightsResult.success) {
    console.log('   ✅ Fleet insights generated successfully');
    console.log(`      Total recommendations: ${insightsResult.data.data.summary.total_recommendations}`);
  } else {
    console.log('   ❌ Failed to get fleet insights');
    console.log(`      Error: ${insightsResult.error.message || insightsResult.error}`);
  }
}

async function testSettings() {
  console.log('\n⚙️  Testing Settings Endpoints...');
  
  // Test get fleet settings
  console.log('   Getting fleet settings...');
  const getSettingsResult = await makeRequest('GET', '/settings');
  
  if (getSettingsResult.success) {
    console.log('   ✅ Retrieved fleet settings');
    console.log(`      Total settings: ${getSettingsResult.data.data.total_settings}`);
  } else {
    console.log('   ❌ Failed to get fleet settings');
    console.log(`      Error: ${getSettingsResult.error.message || getSettingsResult.error}`);
  }
  
  // Test update fleet settings
  console.log('   Updating fleet settings...');
  const updateSettingsResult = await makeRequest('PUT', '/settings', {
    maintenance_settings: {
      maintenance_reminder_days: 5
    },
    fuel_settings: {
      low_fuel_threshold: 25
    }
  });
  
  if (updateSettingsResult.success) {
    console.log('   ✅ Fleet settings updated successfully');
    console.log(`      Updated settings: ${updateSettingsResult.data.data.total_updated}`);
  } else {
    console.log('   ❌ Failed to update fleet settings');
    console.log(`      Error: ${updateSettingsResult.error.message || updateSettingsResult.error}`);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Fleet Management API Tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Auth Token: ${AUTH_TOKEN ? 'Present' : 'Missing'}`);
  
  try {
    // Run all tests
    await testHealthCheck();
    
    const vehicleId = await testVehicles();
    
    await testMaintenance(vehicleId);
    await testTracking(vehicleId);
    await testAssignments(vehicleId);
    await testFuelLogs(vehicleId);
    
    await testReports();
    await testSettings();
    
    console.log('\n🎉 All Fleet Management API tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
