#!/usr/bin/env node

/**
 * Leads Database Migration Script
 * Creates all tables needed for the Leads API functionality
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'junk_removal_db',
  multipleStatements: true
};

async function createLeadsTables() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    console.log('🏗️  Creating Leads tables...');

    // Create all leads-related tables
    const createTablesSQL = `
      -- 1. leads - Main table for storing lead information
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        mobile VARCHAR(20) NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip_code VARCHAR(10) NOT NULL,
        country VARCHAR(100) DEFAULT 'USA',
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        status ENUM('new', 'contacted', 'qualified', 'quoted', 'scheduled', 'lost', 'converted', 'deleted') DEFAULT 'new',
        source ENUM('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'direct_mail', 'trade_show', 'cold_call', 'social_media', 'other') DEFAULT 'other',
        estimated_value DECIMAL(10,2) NULL,
        service_type VARCHAR(255) NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        lead_score INT DEFAULT 0,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_contact_date TIMESTAMP NULL,
        next_follow_up_date DATE NULL,
        converted_at TIMESTAMP NULL,
        converted_to_customer_id VARCHAR(36) NULL,
        assigned_to VARCHAR(36) NULL,
        created_by VARCHAR(36) NULL,
        
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_status (status),
        INDEX idx_source (source),
        INDEX idx_priority (priority),
        INDEX idx_lead_score (lead_score),
        INDEX idx_city_state (city, state),
        INDEX idx_zip_code (zip_code),
        INDEX idx_created_at (created_at),
        INDEX idx_last_contact_date (last_contact_date),
        INDEX idx_next_follow_up_date (next_follow_up_date),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_converted_to_customer_id (converted_to_customer_id),
        INDEX idx_coordinates (latitude, longitude)
      );

      -- 2. lead_contacts - Additional contact persons for leads
      CREATE TABLE IF NOT EXISTS lead_contacts (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        contact_type ENUM('primary', 'secondary', 'decision_maker', 'influencer', 'other') DEFAULT 'primary',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        title VARCHAR(100) NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(20) NULL,
        mobile VARCHAR(20) NULL,
        relationship VARCHAR(100) NULL,
        is_primary_contact BOOLEAN DEFAULT FALSE,
        can_make_decisions BOOLEAN DEFAULT FALSE,
        preferred_contact_method ENUM('phone', 'email', 'sms', 'mail') DEFAULT 'phone',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        INDEX idx_lead_id (lead_id),
        INDEX idx_contact_type (contact_type),
        INDEX idx_is_primary_contact (is_primary_contact),
        INDEX idx_email (email),
        INDEX idx_phone (phone)
      );

      -- 3. lead_activities - Track all activities and interactions with leads
      CREATE TABLE IF NOT EXISTS lead_activities (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        activity_type ENUM('phone_call', 'email', 'sms', 'meeting', 'site_visit', 'quote_sent', 'follow_up', 'initial_contact', 'other') NOT NULL,
        subject VARCHAR(255) NULL,
        description TEXT NOT NULL,
        activity_date TIMESTAMP NOT NULL,
        duration_minutes INT NULL,
        outcome ENUM('positive', 'negative', 'neutral', 'scheduled', 'rescheduled', 'cancelled') DEFAULT 'neutral',
        next_action VARCHAR(255) NULL,
        next_action_date DATE NULL,
        scheduled_follow_up TIMESTAMP NULL,
        employee_id VARCHAR(36) NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        INDEX idx_lead_id (lead_id),
        INDEX idx_activity_type (activity_type),
        INDEX idx_activity_date (activity_date),
        INDEX idx_outcome (outcome),
        INDEX idx_employee_id (employee_id),
        INDEX idx_next_action_date (next_action_date),
        INDEX idx_is_completed (is_completed)
      );

      -- 4. lead_notes - Internal notes and communication history for leads
      CREATE TABLE IF NOT EXISTS lead_notes (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        note_type ENUM('general', 'communication', 'qualification', 'objection', 'follow_up', 'internal') DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_by VARCHAR(36) NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        is_important BOOLEAN DEFAULT FALSE,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        due_date DATE NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        completed_by VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        INDEX idx_lead_id (lead_id),
        INDEX idx_note_type (note_type),
        INDEX idx_created_by (created_by),
        INDEX idx_is_internal (is_internal),
        INDEX idx_priority (priority),
        INDEX idx_due_date (due_date),
        INDEX idx_is_completed (is_completed)
      );

      -- 5. lead_qualifications - Track lead qualification criteria and scoring
      CREATE TABLE IF NOT EXISTS lead_qualifications (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        is_qualified BOOLEAN DEFAULT FALSE,
        qualification_score INT DEFAULT 0,
        qualification_notes TEXT NULL,
        qualification_criteria JSON NULL,
        qualified_date TIMESTAMP NULL,
        qualified_by VARCHAR(36) NULL,
        assessed_by VARCHAR(36) NULL,
        assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        INDEX idx_lead_id (lead_id),
        INDEX idx_is_qualified (is_qualified),
        INDEX idx_qualification_score (qualification_score),
        INDEX idx_qualified_by (qualified_by)
      );

      -- 6. lead_sources - Detailed tracking of lead sources and campaigns
      CREATE TABLE IF NOT EXISTS lead_sources (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        source_type ENUM('organic_search', 'paid_search', 'social_media', 'referral', 'direct', 'email', 'other') NOT NULL,
        source_name VARCHAR(255) NOT NULL,
        campaign_name VARCHAR(255) NULL,
        campaign_id VARCHAR(100) NULL,
        keyword VARCHAR(255) NULL,
        referrer_url TEXT NULL,
        utm_source VARCHAR(100) NULL,
        utm_medium VARCHAR(100) NULL,
        utm_campaign VARCHAR(100) NULL,
        utm_term VARCHAR(100) NULL,
        utm_content VARCHAR(100) NULL,
        cost_per_lead DECIMAL(8,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        INDEX idx_lead_id (lead_id),
        INDEX idx_source_type (source_type),
        INDEX idx_source_name (source_name),
        INDEX idx_campaign_name (campaign_name),
        INDEX idx_keyword (keyword)
      );

      -- 7. lead_quotes - Track quotes sent to leads
      CREATE TABLE IF NOT EXISTS lead_quotes (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        quote_number VARCHAR(50) NOT NULL,
        quote_amount DECIMAL(10,2) NOT NULL,
        quote_type ENUM('initial', 'revised', 'final') DEFAULT 'initial',
        status ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
        sent_at TIMESTAMP NULL,
        viewed_at TIMESTAMP NULL,
        responded_at TIMESTAMP NULL,
        response ENUM('accepted', 'rejected', 'counter_offer', 'requested_changes') NULL,
        counter_offer_amount DECIMAL(10,2) NULL,
        expiry_date DATE NULL,
        notes TEXT NULL,
        created_by VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        UNIQUE KEY unique_quote_number (quote_number),
        INDEX idx_lead_id (lead_id),
        INDEX idx_quote_number (quote_number),
        INDEX idx_status (status),
        INDEX idx_sent_at (sent_at),
        INDEX idx_expiry_date (expiry_date),
        INDEX idx_created_by (created_by)
      );

      -- 8. lead_follow_ups - Track follow-up tasks and reminders for leads
      CREATE TABLE IF NOT EXISTS lead_follow_ups (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        follow_up_type ENUM('call', 'email', 'meeting', 'site_visit', 'quote_follow_up', 'other') NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NULL,
        scheduled_date DATE NOT NULL,
        scheduled_time TIME NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        assigned_to VARCHAR(36) NULL,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue') DEFAULT 'pending',
        completed_at TIMESTAMP NULL,
        outcome TEXT NULL,
        next_follow_up_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        INDEX idx_lead_id (lead_id),
        INDEX idx_follow_up_type (follow_up_type),
        INDEX idx_scheduled_date (scheduled_date),
        INDEX idx_priority (priority),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_status (status),
        INDEX idx_next_follow_up_date (next_follow_up_date)
      );

      -- 9. lead_conversions - Track when leads are converted to customers
      CREATE TABLE IF NOT EXISTS lead_conversions (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        customer_id VARCHAR(36) NOT NULL,
        conversion_date TIMESTAMP NOT NULL,
        conversion_reason VARCHAR(255) NULL,
        conversion_value DECIMAL(10,2) NULL,
        conversion_channel ENUM('phone', 'email', 'website', 'in_person', 'other') NOT NULL,
        converted_by VARCHAR(36) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        UNIQUE KEY unique_lead_conversion (lead_id),
        INDEX idx_lead_id (lead_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_conversion_date (conversion_date),
        INDEX idx_converted_by (converted_by)
      );

      -- 10. lead_tags - Flexible tagging system for leads
      CREATE TABLE IF NOT EXISTS lead_tags (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        description TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_tag_name (name),
        INDEX idx_is_active (is_active)
      );

      -- 11. lead_tag_assignments - Many-to-many relationship between leads and tags
      CREATE TABLE IF NOT EXISTS lead_tag_assignments (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        tag_id VARCHAR(36) NOT NULL,
        assigned_by VARCHAR(36) NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES lead_tags(id) ON DELETE CASCADE,
        UNIQUE KEY unique_lead_tag (lead_id, tag_id),
        INDEX idx_lead_id (lead_id),
        INDEX idx_tag_id (tag_id)
      );

      -- 12. lead_workflows - Track lead progression through sales workflows
      CREATE TABLE IF NOT EXISTS lead_workflows (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        workflow_name VARCHAR(255) NOT NULL,
        current_stage VARCHAR(100) NOT NULL,
        stage_order INT NOT NULL,
        entered_stage_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        stage_duration_hours INT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        INDEX idx_lead_id (lead_id),
        INDEX idx_workflow_name (workflow_name),
        INDEX idx_current_stage (current_stage),
        INDEX idx_is_completed (is_completed)
      );
    `;

    await connection.execute(createTablesSQL);
    console.log('✅ All leads tables created successfully');

    // Insert sample lead tags
    console.log('🏷️  Inserting sample lead tags...');
    const insertTagsSQL = `
      INSERT IGNORE INTO lead_tags (id, name, color, description) VALUES
      (UUID(), 'Hot Lead', '#EF4444', 'High priority lead requiring immediate attention'),
      (UUID(), 'Cold Lead', '#6B7280', 'Low priority lead for follow-up'),
      (UUID(), 'Qualified', '#10B981', 'Lead that meets qualification criteria'),
      (UUID(), 'Budget Ready', '#F59E0B', 'Lead with confirmed budget'),
      (UUID(), 'Timeline Urgent', '#DC2626', 'Lead with urgent timeline'),
      (UUID(), 'Commercial', '#3B82F6', 'Commercial property lead'),
      (UUID(), 'Residential', '#8B5CF6', 'Residential property lead'),
      (UUID(), 'Referral', '#06B6D4', 'Lead from customer referral'),
      (UUID(), 'Website Lead', '#8B5CF6', 'Lead generated from website'),
      (UUID(), 'Social Media', '#EC4899', 'Lead from social media platforms');
    `;

    await connection.execute(insertTagsSQL);
    console.log('✅ Sample lead tags inserted successfully');

    // Insert sample lead sources
    console.log('📊 Inserting sample lead source types...');
    const insertSourceTypesSQL = `
      INSERT IGNORE INTO lead_sources (id, lead_id, source_type, source_name, campaign_name) VALUES
      (UUID(), (SELECT id FROM leads LIMIT 1), 'organic_search', 'Google', 'Organic SEO Campaign'),
      (UUID(), (SELECT id FROM leads LIMIT 1), 'paid_search', 'Google Ads', 'Spring Cleanup Campaign'),
      (UUID(), (SELECT id FROM leads LIMIT 1), 'social_media', 'Facebook', 'Facebook Lead Ads'),
      (UUID(), (SELECT id FROM leads LIMIT 1), 'referral', 'Customer Referral', 'Referral Program'),
      (UUID(), (SELECT id FROM leads LIMIT 1), 'direct', 'Website Contact Form', 'Website Leads');
    `;

    // Only insert if leads exist
    const leadsCount = await connection.execute('SELECT COUNT(*) as count FROM leads');
    if (leadsCount[0][0].count > 0) {
      await connection.execute(insertSourceTypesSQL);
      console.log('✅ Sample lead source types inserted successfully');
    } else {
      console.log('⚠️  No leads found, skipping source type insertion');
    }

    console.log('🎉 Leads database migration completed successfully!');
    console.log('\n📋 Tables created:');
    console.log('  • leads');
    console.log('  • lead_contacts');
    console.log('  • lead_activities');
    console.log('  • lead_notes');
    console.log('  • lead_qualifications');
    console.log('  • lead_sources');
    console.log('  • lead_quotes');
    console.log('  • lead_follow_ups');
    console.log('  • lead_conversions');
    console.log('  • lead_tags');
    console.log('  • lead_tag_assignments');
    console.log('  • lead_workflows');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  createLeadsTables()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createLeadsTables };
