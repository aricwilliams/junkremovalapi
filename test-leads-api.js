#!/usr/bin/env node

/**
 * Test Script for Leads API
 * This script tests all the major endpoints of the Leads API
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1/leads';
const TEST_TOKEN = 'test-jwt-token'; // Replace with actual test token

// Test data
const testLead = {
  name: 'Test Office Building',
  company: 'Test Properties LLC',
  email: 'test@testproperties.com',
  phone: '555-9999',
  address: '999 Test St',
  city: 'Test City',
  state: 'NC',
  zip_code: '28401',
  estimated_value: 5000.00,
  service_type: 'Office Cleanout',
  priority: 'high',
  source: 'website'
};

const testContact = {
  first_name: 'John',
  last_name: 'Test',
  title: 'Property Manager',
  email: 'john@testproperties.com',
  phone: '555-8888',
  contact_type: 'primary',
  is_primary_contact: true,
  can_make_decisions: true
};

const testActivity = {
  type: 'phone_call',
  subject: 'Initial Contact',
  description: 'Called to discuss office cleanout needs',
  activity_date: new Date().toISOString(),
  outcome: 'positive',
  next_action: 'Schedule site visit',
  next_action_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
};

const testNote = {
  title: 'Customer Requirements',
  content: 'Customer needs full office cleanout including furniture removal',
  type: 'qualification',
  is_important: true,
  priority: 'high'
};

const testFollowUp = {
  type: 'site_visit',
  subject: 'Schedule Site Visit',
  description: 'Visit property to assess cleanout requirements',
  scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  scheduled_time: '14:00',
  priority: 'high'
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, params = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
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
  console.log('🏥 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    console.log('   Response:', result.data);
  } else {
    console.log('❌ Health check failed');
    console.log('   Error:', result.error);
  }
  console.log('');
}

async function testCreateLead() {
  console.log('📝 Testing Create Lead...');
  const result = await makeRequest('POST', '', testLead);
  
  if (result.success) {
    console.log('✅ Lead created successfully');
    console.log('   Lead ID:', result.data.data.lead.id);
    return result.data.data.lead.id;
  } else {
    console.log('❌ Lead creation failed');
    console.log('   Error:', result.error);
    return null;
  }
}

async function testGetLeads() {
  console.log('📋 Testing Get All Leads...');
  const result = await makeRequest('GET', '');
  
  if (result.success) {
    console.log('✅ Leads retrieved successfully');
    console.log(`   Total leads: ${result.data.data.summary.total_leads}`);
    console.log(`   New leads: ${result.data.data.summary.new_leads}`);
    console.log(`   Qualified leads: ${result.data.data.summary.qualified_leads}`);
  } else {
    console.log('❌ Get leads failed');
    console.log('   Error:', result.error);
  }
  console.log('');
}

async function testGetLeadById(leadId) {
  if (!leadId) return;
  
  console.log('🔍 Testing Get Lead by ID...');
  const result = await makeRequest('GET', `/${leadId}`);
  
  if (result.success) {
    console.log('✅ Lead retrieved successfully');
    console.log('   Lead name:', result.data.data.lead.name);
    console.log('   Status:', result.data.data.lead.status);
  } else {
    console.log('❌ Get lead by ID failed');
    console.log('   Error:', result.error);
  }
  console.log('');
}

async function testUpdateLead(leadId) {
  if (!leadId) return;
  
  console.log('✏️  Testing Update Lead...');
  const updateData = {
    status: 'contacted',
    priority: 'urgent',
    estimated_value: 6000.00
  };
  
  const result = await makeRequest('PUT', `/${leadId}`, updateData);
  
  if (result.success) {
    console.log('✅ Lead updated successfully');
    console.log('   New status:', updateData.status);
    console.log('   New priority:', updateData.priority);
  } else {
    console.log('❌ Lead update failed');
    console.log('   Error:', result.error);
  }
  console.log('');
}

async function testAddContact(leadId) {
  if (!leadId) return;
  
  console.log('👥 Testing Add Contact...');
  const result = await makeRequest('POST', `/${leadId}/contacts`, testContact);
  
  if (result.success) {
    console.log('✅ Contact added successfully');
    console.log('   Contact ID:', result.data.data.contact.id);
    return result.data.data.contact.id;
  } else {
    console.log('❌ Contact addition failed');
    console.log('   Error:', result.error);
    return null;
  }
}

async function testAddActivity(leadId) {
  if (!leadId) return;
  
  console.log('📞 Testing Add Activity...');
  const result = await makeRequest('POST', `/${leadId}/activities`, testActivity);
  
  if (result.success) {
    console.log('✅ Activity added successfully');
    console.log('   Activity ID:', result.data.data.activity.id);
    return result.data.data.activity.id;
  } else {
    console.log('❌ Activity addition failed');
    console.log('   Error:', result.error);
    return null;
  }
}

async function testAddNote(leadId) {
  if (!leadId) return;
  
  console.log('📝 Testing Add Note...');
  const result = await makeRequest('POST', `/${leadId}/notes`, testNote);
  
  if (result.success) {
    console.log('✅ Note added successfully');
    console.log('   Note ID:', result.data.data.note.id);
    return result.data.data.note.id;
  } else {
    console.log('❌ Note addition failed');
    console.log('   Error:', result.error);
    return null;
  }
}

async function testScheduleFollowUp(leadId) {
  if (!leadId) return;
  
  console.log('📅 Testing Schedule Follow-up...');
  const result = await makeRequest('POST', `/${leadId}/follow-ups`, testFollowUp);
  
  if (result.success) {
    console.log('✅ Follow-up scheduled successfully');
    console.log('   Follow-up ID:', result.data.data.follow_up.id);
    return result.data.data.follow_up.id;
  } else {
    console.log('❌ Follow-up scheduling failed');
    console.log('   Error:', result.error);
    return null;
  }
}

async function testGetTags() {
  console.log('🏷️  Testing Get All Tags...');
  const result = await makeRequest('GET', '/tags');
  
  if (result.success) {
    console.log('✅ Tags retrieved successfully');
    console.log(`   Total tags: ${result.data.data.tags.length}`);
    if (result.data.data.tags.length > 0) {
      console.log('   Sample tags:', result.data.data.tags.slice(0, 3).map(t => t.name).join(', '));
    }
  } else {
    console.log('❌ Get tags failed');
    console.log('   Error:', result.error);
  }
  console.log('');
}

async function testSearchLeads() {
  console.log('🔍 Testing Search Leads...');
  const searchParams = {
    q: 'office',
    search_fields: 'name,company,service_type'
  };
  
  const result = await makeRequest('GET', '/search', null, searchParams);
  
  if (result.success) {
    console.log('✅ Lead search successful');
    console.log(`   Search results: ${result.data.data.leads.length} leads found`);
  } else {
    console.log('❌ Lead search failed');
    console.log('   Error:', result.error);
  }
  console.log('');
}

async function testGetReports() {
  console.log('📊 Testing Get Reports...');
  
  // Test summary report
  const summaryResult = await makeRequest('GET', '/reports/summary');
  if (summaryResult.success) {
    console.log('✅ Summary report generated successfully');
  } else {
    console.log('❌ Summary report failed');
    console.log('   Error:', summaryResult.error);
  }
  
  // Test insights
  const insightsResult = await makeRequest('GET', '/reports/insights');
  if (insightsResult.success) {
    console.log('✅ Insights report generated successfully');
  } else {
    console.log('❌ Insights report failed');
    console.log('   Error:', insightsResult.error);
  }
  
  console.log('');
}

async function testLeadConversion(leadId) {
  if (!leadId) return;
  
  console.log('🔄 Testing Lead Conversion...');
  const conversionData = {
    customer_name: 'Test Properties LLC',
    customer_type: 'commercial',
    first_job_details: {
      service_type: 'Office Cleanout',
      estimated_value: 6000.00,
      preferred_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Converted from test lead'
    },
    billing_info: {
      billing_address: '999 Test St, Test City, NC 28401',
      payment_terms: 'Net 30'
    }
  };
  
  const result = await makeRequest('POST', `/${leadId}/convert`, conversionData);
  
  if (result.success) {
    console.log('✅ Lead converted successfully');
    console.log('   Customer ID:', result.data.data.customer.id);
    console.log('   Job ID:', result.data.data.job.id);
  } else {
    console.log('❌ Lead conversion failed');
    console.log('   Error:', result.error);
  }
  console.log('');
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Leads API Tests...\n');
  
  try {
    // Test health check first
    await testHealthCheck();
    
    // Test core lead operations
    await testGetLeads();
    const leadId = await testCreateLead();
    await testGetLeadById(leadId);
    await testUpdateLead(leadId);
    
    // Test related entities
    const contactId = await testAddContact(leadId);
    const activityId = await testAddActivity(leadId);
    const noteId = await testAddNote(leadId);
    const followUpId = await testScheduleFollowUp(leadId);
    
    // Test other features
    await testGetTags();
    await testSearchLeads();
    await testGetReports();
    
    // Test lead conversion
    await testLeadConversion(leadId);
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  makeRequest,
  testLead,
  testContact,
  testActivity,
  testNote,
  testFollowUp
};
