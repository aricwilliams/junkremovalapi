const { connectDB, query } = require('../config/database');

const createCustomersTables = async () => {
  try {
    console.log('🚀 Starting customers database migration...');

    // 1. Create customers table
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip_code VARCHAR(10) NOT NULL,
        country VARCHAR(100) DEFAULT 'USA',
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        status ENUM('new', 'quoted', 'scheduled', 'completed', 'inactive', 'blacklisted') DEFAULT 'new',
        customer_type ENUM('residential', 'commercial', 'industrial', 'government') DEFAULT 'residential',
        property_type ENUM('house', 'apartment', 'condo', 'office', 'warehouse', 'retail', 'other') NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_contact_date TIMESTAMP NULL,
        total_jobs INT DEFAULT 0,
        total_spent DECIMAL(12,2) DEFAULT 0.00,
        average_job_value DECIMAL(10,2) DEFAULT 0.00,
        notes TEXT NULL,
        source ENUM('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'other') DEFAULT 'other',
        marketing_consent BOOLEAN DEFAULT FALSE,
        sms_consent BOOLEAN DEFAULT FALSE,
        email_consent BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('✅ customers table created');

    // 2. Create customer_contacts table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_contacts (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        contact_type ENUM('primary', 'secondary', 'emergency', 'billing', 'property_manager') DEFAULT 'secondary',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
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
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ customer_contacts table created');

    // 3. Create customer_addresses table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        address_type ENUM('billing', 'service', 'mailing', 'other') DEFAULT 'service',
        address_line_1 VARCHAR(255) NOT NULL,
        address_line_2 VARCHAR(255) NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip_code VARCHAR(10) NOT NULL,
        country VARCHAR(100) DEFAULT 'USA',
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        access_notes TEXT NULL,
        service_area_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ customer_addresses table created');

    // 4. Create customer_tags table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_tags (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        description TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ customer_tags table created');

    // 5. Create customer_tag_assignments table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_tag_assignments (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        tag_id VARCHAR(36) NOT NULL,
        assigned_by VARCHAR(36) NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES customer_tags(id) ON DELETE CASCADE,
        UNIQUE KEY unique_customer_tag (customer_id, tag_id)
      )
    `);
    console.log('✅ customer_tag_assignments table created');

    // 6. Create customer_notes table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_notes (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        note_type ENUM('general', 'communication', 'issue', 'follow_up', 'internal') DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_by VARCHAR(36) NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        due_date DATE NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        completed_by VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ customer_notes table created');

    // 7. Create customer_communications table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_communications (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        communication_type ENUM('phone_call', 'email', 'sms', 'in_person', 'portal_message') NOT NULL,
        direction ENUM('inbound', 'outbound') NOT NULL,
        subject VARCHAR(255) NULL,
        content TEXT NULL,
        duration_seconds INT NULL,
        contact_person_id VARCHAR(36) NULL,
        employee_id VARCHAR(36) NULL,
        status ENUM('initiated', 'in_progress', 'completed', 'failed', 'scheduled') DEFAULT 'completed',
        scheduled_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_date DATE NULL,
        follow_up_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ customer_communications table created');

    // 8. Create customer_preferences table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_preferences (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        preference_key VARCHAR(100) NOT NULL,
        preference_value TEXT NULL,
        preference_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_customer_preference (customer_id, preference_key)
      )
    `);
    console.log('✅ customer_preferences table created');

    // 9. Create customer_documents table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_documents (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        document_type ENUM('contract', 'invoice', 'estimate', 'photo', 'id_document', 'other') NOT NULL,
        title VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        description TEXT NULL,
        uploaded_by VARCHAR(36) NULL,
        is_public BOOLEAN DEFAULT FALSE,
        expires_at DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ customer_documents table created');

    // 10. Create customer_relationships table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_relationships (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        related_customer_id VARCHAR(36) NOT NULL,
        relationship_type ENUM('referral', 'family_member', 'business_partner', 'neighbor', 'other') NOT NULL,
        relationship_description TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (related_customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_customer_relationship (customer_id, related_customer_id)
      )
    `);
    console.log('✅ customer_relationships table created');

    // 11. Create customer_service_history table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_service_history (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        service_date DATE NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        service_description TEXT NULL,
        service_value DECIMAL(10,2) NULL,
        employee_id VARCHAR(36) NULL,
        customer_satisfaction INT NULL,
        feedback TEXT NULL,
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ customer_service_history table created');

    // 12. Create customer_marketing table
    await query(`
      CREATE TABLE IF NOT EXISTS customer_marketing (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        campaign_name VARCHAR(255) NOT NULL,
        campaign_type ENUM('email', 'sms', 'direct_mail', 'social_media', 'other') NOT NULL,
        sent_at TIMESTAMP NULL,
        opened_at TIMESTAMP NULL,
        clicked_at TIMESTAMP NULL,
        responded_at TIMESTAMP NULL,
        response_type ENUM('positive', 'negative', 'neutral', 'unsubscribe') NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ customer_marketing table created');

    // Create indexes for performance
    console.log('🔧 Creating indexes...');

    // Customers table indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_city_state ON customers(city, state)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_zip_code ON customers(zip_code)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_last_contact_date ON customers(last_contact_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source)');
    await query('CREATE INDEX IF NOT EXISTS idx_customers_coordinates ON customers(latitude, longitude)');

    // Customer contacts indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_contacts_contact_type ON customer_contacts(contact_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_contacts_is_primary_contact ON customer_contacts(is_primary_contact)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_contacts_email ON customer_contacts(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_contacts_phone ON customer_contacts(phone)');

    // Customer addresses indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_addresses_address_type ON customer_addresses(address_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_primary ON customer_addresses(is_primary)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_addresses_city_state ON customer_addresses(city, state)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_addresses_zip_code ON customer_addresses(zip_code)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_addresses_coordinates ON customer_addresses(latitude, longitude)');

    // Customer tags indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_tags_is_active ON customer_tags(is_active)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_customer_id ON customer_tag_assignments(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_tag_id ON customer_tag_assignments(tag_id)');

    // Customer notes indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_notes_note_type ON customer_notes(note_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_notes_created_by ON customer_notes(created_by)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_notes_is_internal ON customer_notes(is_internal)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_notes_priority ON customer_notes(priority)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_notes_due_date ON customer_notes(due_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_notes_is_completed ON customer_notes(is_completed)');

    // Customer communications indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_communications_communication_type ON customer_communications(communication_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_communications_direction ON customer_communications(direction)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_communications_employee_id ON customer_communications(employee_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_communications_status ON customer_communications(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_communications_scheduled_at ON customer_communications(scheduled_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_communications_follow_up_required ON customer_communications(follow_up_required)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_communications_follow_up_date ON customer_communications(follow_up_date)');

    // Customer preferences indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON customer_preferences(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_preferences_preference_key ON customer_preferences(preference_key)');

    // Customer documents indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_documents_customer_id ON customer_documents(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_documents_document_type ON customer_documents(document_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_documents_uploaded_by ON customer_documents(uploaded_by)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_documents_is_public ON customer_documents(is_public)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_documents_expires_at ON customer_documents(expires_at)');

    // Customer relationships indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_relationships_customer_id ON customer_relationships(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_relationships_related_customer_id ON customer_relationships(related_customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_relationships_relationship_type ON customer_relationships(relationship_type)');

    // Customer service history indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_service_history_customer_id ON customer_service_history(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_service_history_service_date ON customer_service_history(service_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_service_history_service_type ON customer_service_history(service_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_service_history_employee_id ON customer_service_history(employee_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_service_history_customer_satisfaction ON customer_service_history(customer_satisfaction)');

    // Customer marketing indexes
    await query('CREATE INDEX IF NOT EXISTS idx_customer_marketing_customer_id ON customer_marketing(customer_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_marketing_campaign_name ON customer_marketing(campaign_name)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_marketing_campaign_type ON customer_marketing(campaign_type)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_marketing_sent_at ON customer_marketing(sent_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_customer_marketing_response_type ON customer_marketing(response_type)');

    console.log('✅ All indexes created successfully');

    // Insert sample customer tags
    console.log('📝 Inserting sample customer tags...');
    await query(`
      INSERT IGNORE INTO customer_tags (id, name, color, description) VALUES
      (UUID(), 'VIP', '#FFD700', 'Very Important Customer'),
      (UUID(), 'Commercial', '#10B981', 'Commercial property customer'),
      (UUID(), 'Referral', '#8B5CF6', 'Customer referred by another customer'),
      (UUID(), 'High Value', '#F59E0B', 'High value customer'),
      (UUID(), 'New Customer', '#3B82F6', 'Recently acquired customer'),
      (UUID(), 'Repeat Customer', '#EF4444', 'Returning customer'),
      (UUID(), 'Property Manager', '#06B6D4', 'Property management company'),
      (UUID(), 'Contractor', '#84CC16', 'Construction or contractor customer')
    `);
    console.log('✅ Sample customer tags inserted');

    console.log('🎉 Customers database migration completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - customers');
    console.log('   - customer_contacts');
    console.log('   - customer_addresses');
    console.log('   - customer_tags');
    console.log('   - customer_tag_assignments');
    console.log('   - customer_notes');
    console.log('   - customer_communications');
    console.log('   - customer_preferences');
    console.log('   - customer_documents');
    console.log('   - customer_relationships');
    console.log('   - customer_service_history');
    console.log('   - customer_marketing');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  createCustomersTables()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createCustomersTables };
