#!/usr/bin/env node

/**
 * Estimates Database Migration Script
 * Creates all tables needed for the Estimates API functionality
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

async function createEstimatesTables() {
  let connection;

  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    console.log('🏗️  Creating Estimates tables...');

    // Create all estimates-related tables
    const createTablesSQL = `
      -- 1. client_requests - Main table for storing client portal requests
      CREATE TABLE IF NOT EXISTS client_requests (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NULL,
        customer_name VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        type ENUM('pickup', 'service', 'emergency', 'maintenance') DEFAULT 'service',
        priority ENUM('urgent', 'high', 'medium', 'low', 'standard') DEFAULT 'medium',
        status ENUM('pending', 'reviewing', 'quoted', 'scheduled', 'completed', 'cancelled') DEFAULT 'pending',
        subject VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        requested_date DATE NOT NULL,
        preferred_date DATE NULL,
        preferred_time VARCHAR(50) NULL,
        service_address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip_code VARCHAR(10) NOT NULL,
        country VARCHAR(100) DEFAULT 'USA',
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        location_on_property VARCHAR(255) NULL,
        approximate_volume VARCHAR(100) NULL,
        approximate_item_count VARCHAR(100) NULL,
        gate_code VARCHAR(50) NULL,
        apartment_number VARCHAR(50) NULL,
        access_considerations TEXT NULL,
        material_types JSON NULL,
        hazardous_material BOOLEAN DEFAULT FALSE,
        hazardous_description TEXT NULL,
        has_mold BOOLEAN DEFAULT FALSE,
        has_pests BOOLEAN DEFAULT FALSE,
        has_sharp_objects BOOLEAN DEFAULT FALSE,
        heavy_lifting_required BOOLEAN DEFAULT FALSE,
        disassembly_required BOOLEAN DEFAULT FALSE,
        disassembly_description TEXT NULL,
        filled_with_water BOOLEAN DEFAULT FALSE,
        filled_with_oil BOOLEAN DEFAULT FALSE,
        items_in_bags BOOLEAN DEFAULT FALSE,
        bag_contents TEXT NULL,
        oversized_items BOOLEAN DEFAULT FALSE,
        oversized_description TEXT NULL,
        request_donation_pickup BOOLEAN DEFAULT FALSE,
        request_demolition BOOLEAN DEFAULT FALSE,
        demolition_description TEXT NULL,
        text_opt_in BOOLEAN DEFAULT FALSE,
        how_did_you_hear VARCHAR(255) NULL,
        additional_notes TEXT NULL,
        attachments JSON NULL,
        notes TEXT NULL,
        can_create_estimate BOOLEAN DEFAULT TRUE,
        estimate_status ENUM('pending', 'created', 'sent', 'accepted', 'rejected') DEFAULT 'pending',
        estimate_id VARCHAR(36) NULL,
        volume_weight DECIMAL(10, 2) NULL,
        volume_yardage DECIMAL(8, 2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_customer_id (customer_id),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_estimate_status (estimate_status),
        INDEX idx_preferred_date (preferred_date),
        INDEX idx_created_at (created_at),
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_city_state (city, state),
        INDEX idx_type (type)
      );

      -- 2. estimates - Main table for storing estimates created from client requests
      CREATE TABLE IF NOT EXISTS estimates (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip_code VARCHAR(10) NOT NULL,
        country VARCHAR(100) DEFAULT 'USA',
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        labor_hours DECIMAL(4, 2) NOT NULL DEFAULT 0,
        labor_rate DECIMAL(8, 2) NOT NULL DEFAULT 0,
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted') DEFAULT 'draft',
        sent_date TIMESTAMP NULL,
        expiry_date DATE NOT NULL,
        accepted_date TIMESTAMP NULL,
        rejected_date TIMESTAMP NULL,
        rejection_reason TEXT NULL,
        notes TEXT NULL,
        terms_conditions TEXT NULL,
        payment_terms VARCHAR(255) NULL,
        volume_weight DECIMAL(10, 2) NULL,
        volume_yardage DECIMAL(8, 2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_customer_id (customer_id),
        INDEX idx_status (status),
        INDEX idx_expiry_date (expiry_date),
        INDEX idx_created_at (created_at),
        INDEX idx_customer_email (customer_email),
        INDEX idx_city_state (city, state)
      );

      -- 3. estimate_items - Individual items within each estimate with pricing and specifications
      CREATE TABLE IF NOT EXISTS estimate_items (
        id VARCHAR(36) PRIMARY KEY,
        estimate_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity DECIMAL(8, 2) NOT NULL DEFAULT 1,
        base_price DECIMAL(8, 2) NOT NULL DEFAULT 0,
        price_per_unit DECIMAL(8, 2) NULL,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        estimated_time DECIMAL(4, 2) NULL,
        volume_weight DECIMAL(8, 2) NULL,
        volume_yardage DECIMAL(6, 2) NULL,
        description TEXT NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
        INDEX idx_estimate_id (estimate_id),
        INDEX idx_category (category),
        INDEX idx_difficulty (difficulty)
      );

      -- 4. estimate_additional_fees - Additional fees applied to estimates
      CREATE TABLE IF NOT EXISTS estimate_additional_fees (
        id VARCHAR(36) PRIMARY KEY,
        estimate_id VARCHAR(36) NOT NULL,
        fee_type ENUM('disposal', 'travel', 'difficulty', 'hazardous', 'after_hours', 'weekend', 'holiday', 'rush', 'custom') NOT NULL,
        description VARCHAR(255) NULL,
        amount DECIMAL(8, 2) NOT NULL DEFAULT 0,
        is_percentage BOOLEAN DEFAULT FALSE,
        percentage_rate DECIMAL(5, 2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
        INDEX idx_estimate_id (estimate_id),
        INDEX idx_fee_type (fee_type)
      );

      -- 5. pricing_items - Master catalog of pricing items that can be used in estimates
      CREATE TABLE IF NOT EXISTS pricing_items (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        base_price DECIMAL(8, 2) NOT NULL DEFAULT 0,
        price_per_unit DECIMAL(8, 2) NULL,
        unit_type VARCHAR(50) NULL,
        estimated_time DECIMAL(4, 2) NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        description TEXT NULL,
        volume_weight DECIMAL(8, 2) NULL,
        volume_yardage DECIMAL(6, 2) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_category (category),
        INDEX idx_is_active (is_active),
        INDEX idx_sort_order (sort_order),
        INDEX idx_difficulty (difficulty)
      );

      -- 6. pricing_categories - Categories for organizing pricing items
      CREATE TABLE IF NOT EXISTS pricing_categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        color VARCHAR(7) NULL,
        icon VARCHAR(50) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_is_active (is_active),
        INDEX idx_sort_order (sort_order)
      );

      -- 7. estimate_templates - Reusable estimate templates for common service types
      CREATE TABLE IF NOT EXISTS estimate_templates (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        category VARCHAR(100) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_category (category),
        INDEX idx_is_active (is_active)
      );

      -- 8. estimate_template_items - Items within estimate templates
      CREATE TABLE IF NOT EXISTS estimate_template_items (
        id VARCHAR(36) PRIMARY KEY,
        template_id VARCHAR(36) NOT NULL,
        pricing_item_id VARCHAR(36) NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity DECIMAL(8, 2) NOT NULL DEFAULT 1,
        base_price DECIMAL(8, 2) NOT NULL DEFAULT 0,
        price_per_unit DECIMAL(8, 2) NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        estimated_time DECIMAL(4, 2) NULL,
        volume_weight DECIMAL(8, 2) NULL,
        volume_yardage DECIMAL(6, 2) NULL,
        description TEXT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (template_id) REFERENCES estimate_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (pricing_item_id) REFERENCES pricing_items(id) ON DELETE SET NULL,
        INDEX idx_template_id (template_id),
        INDEX idx_sort_order (sort_order)
      );

      -- 9. estimate_attachments - Files and documents attached to estimates
      CREATE TABLE IF NOT EXISTS estimate_attachments (
        id VARCHAR(36) PRIMARY KEY,
        estimate_id VARCHAR(36) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NULL,
        file_type VARCHAR(100) NULL,
        description VARCHAR(255) NULL,
        is_public BOOLEAN DEFAULT FALSE,
        uploaded_by VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
        INDEX idx_estimate_id (estimate_id),
        INDEX idx_file_type (file_type)
      );

      -- 10. estimate_history - Audit trail of all changes made to estimates
      CREATE TABLE IF NOT EXISTS estimate_history (
        id VARCHAR(36) PRIMARY KEY,
        estimate_id VARCHAR(36) NOT NULL,
        action ENUM('created', 'updated', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted') NOT NULL,
        user_id VARCHAR(36) NULL,
        user_name VARCHAR(255) NULL,
        old_values JSON NULL,
        new_values JSON NULL,
        notes TEXT NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
        INDEX idx_estimate_id (estimate_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at),
        INDEX idx_user_id (user_id)
      );

      -- 11. estimate_settings - Configuration settings for estimates
      CREATE TABLE IF NOT EXISTS estimate_settings (
        id VARCHAR(36) PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NULL,
        setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        description TEXT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_setting_key (setting_key)
      );
    `;

    await connection.execute(createTablesSQL);
    console.log('✅ All estimates tables created successfully');

    // Insert sample pricing categories
    console.log('🏷️  Inserting sample pricing categories...');
    const insertCategoriesSQL = `
      INSERT IGNORE INTO pricing_categories (id, name, description, color, icon, sort_order) VALUES
      (UUID(), 'General Waste', 'Household and office waste materials', '#3B82F6', 'trash', 1),
      (UUID(), 'Furniture', 'Furniture removal and disposal', '#10B981', 'sofa', 2),
      (UUID(), 'Appliances', 'Large appliance removal', '#F59E0B', 'tv', 3),
      (UUID(), 'Construction', 'Construction and renovation debris', '#EF4444', 'hammer', 4),
      (UUID(), 'Electronics', 'Electronic waste and devices', '#8B5CF6', 'smartphone', 5),
      (UUID(), 'Hazardous', 'Hazardous materials and chemicals', '#DC2626', 'alert-triangle', 6);
    `;

    await connection.execute(insertCategoriesSQL);
    console.log('✅ Sample pricing categories inserted successfully');

    // Insert sample pricing items
    console.log('💰 Inserting sample pricing items...');
    const insertPricingItemsSQL = `
      INSERT IGNORE INTO pricing_items (id, name, category, base_price, price_per_unit, unit_type, estimated_time, difficulty, description, volume_weight, volume_yardage) VALUES
      (UUID(), 'General Waste', 'General Waste', 150.00, 25.00, 'bag', 2.0, 'easy', 'General household and office waste', 800.00, 12.00),
      (UUID(), 'Furniture', 'Furniture', 75.00, 50.00, 'piece', 1.5, 'medium', 'Furniture removal and disposal', 200.00, 4.00),
      (UUID(), 'Appliances', 'Appliances', 100.00, 75.00, 'piece', 2.0, 'hard', 'Large appliance removal', 300.00, 6.00),
      (UUID(), 'Construction Debris', 'Construction', 200.00, 100.00, 'yard', 3.0, 'hard', 'Construction and renovation debris', 1000.00, 15.00),
      (UUID(), 'Electronics', 'Electronics', 50.00, 25.00, 'piece', 1.0, 'medium', 'Electronic waste disposal', 50.00, 1.00),
      (UUID(), 'Hazardous Materials', 'Hazardous', 300.00, 150.00, 'container', 4.0, 'hard', 'Hazardous materials handling', 500.00, 8.00);
    `;

    await connection.execute(insertPricingItemsSQL);
    console.log('✅ Sample pricing items inserted successfully');

    // Insert sample estimate settings
    console.log('⚙️  Inserting sample estimate settings...');
    const insertSettingsSQL = `
      INSERT IGNORE INTO estimate_settings (id, setting_key, setting_value, setting_type, description) VALUES
      (UUID(), 'default_labor_rate', '50.00', 'number', 'Default hourly labor rate for estimates'),
      (UUID(), 'estimate_expiry_days', '30', 'number', 'Number of days estimates are valid'),
      (UUID(), 'default_terms', 'Payment due upon completion. 30-day warranty on work performed.', 'string', 'Default terms and conditions'),
      (UUID(), 'require_customer_signature', 'true', 'boolean', 'Whether customer signature is required'),
      (UUID(), 'auto_send_followup', 'true', 'boolean', 'Automatically send follow-up emails'),
      (UUID(), 'default_payment_terms', 'Net 30', 'string', 'Default payment terms'),
      (UUID(), 'estimate_number_prefix', 'EST-', 'string', 'Prefix for estimate numbers'),
      (UUID(), 'include_photos', 'true', 'boolean', 'Include photos in estimates by default');
    `;

    await connection.execute(insertSettingsSQL);
    console.log('✅ Sample estimate settings inserted successfully');

    // Insert sample estimate templates
    console.log('📋 Inserting sample estimate templates...');
    const insertTemplatesSQL = `
      INSERT IGNORE INTO estimate_templates (id, name, description, category, is_active) VALUES
      (UUID(), 'Standard Residential Cleanout', 'Template for typical residential cleanout projects', 'residential', true),
      (UUID(), 'Office Cleanout', 'Template for office space cleanout projects', 'commercial', true),
      (UUID(), 'Construction Debris Removal', 'Template for construction and renovation debris', 'construction', true);
    `;

    await connection.execute(insertTemplatesSQL);
    console.log('✅ Sample estimate templates inserted successfully');

    console.log('🎉 Estimates database migration completed successfully!');
    console.log('\n📋 Tables created:');
    console.log('  • client_requests');
    console.log('  • estimates');
    console.log('  • estimate_items');
    console.log('  • estimate_additional_fees');
    console.log('  • pricing_items');
    console.log('  • pricing_categories');
    console.log('  • estimate_templates');
    console.log('  • estimate_template_items');
    console.log('  • estimate_attachments');
    console.log('  • estimate_history');
    console.log('  • estimate_settings');

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
  createEstimatesTables()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createEstimatesTables };
