const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'junkremovalapi'
};

async function createClientPortalTables() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // 1. Create portal_users table
    console.log('Creating portal_users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_users (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        password_salt VARCHAR(255) NULL,
        role ENUM('owner', 'manager', 'employee', 'viewer') DEFAULT 'viewer',
        permissions JSON NULL,
        last_login TIMESTAMP NULL,
        login_attempts INT DEFAULT 0,
        is_locked BOOLEAN DEFAULT FALSE,
        lock_expiry TIMESTAMP NULL,
        password_reset_token VARCHAR(255) NULL,
        password_reset_expiry TIMESTAMP NULL,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        two_factor_secret VARCHAR(255) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        INDEX idx_customer_id (customer_id),
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active)
      )
    `);

    // 2. Create portal_requests table
    console.log('Creating portal_requests table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_requests (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        type ENUM('pickup', 'service', 'emergency', 'maintenance', 'consultation') DEFAULT 'service',
        priority ENUM('urgent', 'high', 'medium', 'low', 'standard') DEFAULT 'standard',
        status ENUM('pending', 'reviewing', 'quoted', 'scheduled', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        requested_date DATE NOT NULL,
        preferred_date DATE NULL,
        preferred_time VARCHAR(50) NULL,
        location_address TEXT NOT NULL,
        location_city VARCHAR(100) NOT NULL,
        location_state VARCHAR(2) NOT NULL,
        location_zip_code VARCHAR(10) NOT NULL,
        location_latitude DECIMAL(10, 8) NULL,
        location_longitude DECIMAL(11, 8) NULL,
        gate_code VARCHAR(50) NULL,
        apartment_number VARCHAR(50) NULL,
        location_on_property VARCHAR(100) NULL,
        access_considerations TEXT NULL,
        approximate_volume VARCHAR(100) NULL,
        approximate_item_count VARCHAR(100) NULL,
        material_types JSON NULL,
        filled_with_water BOOLEAN DEFAULT FALSE,
        filled_with_oil BOOLEAN DEFAULT FALSE,
        hazardous_material BOOLEAN DEFAULT FALSE,
        hazardous_description TEXT NULL,
        items_in_bags BOOLEAN DEFAULT FALSE,
        bag_contents TEXT NULL,
        oversized_items BOOLEAN DEFAULT FALSE,
        oversized_description TEXT NULL,
        has_mold BOOLEAN DEFAULT FALSE,
        has_pests BOOLEAN DEFAULT FALSE,
        has_sharp_objects BOOLEAN DEFAULT FALSE,
        heavy_lifting_required BOOLEAN DEFAULT FALSE,
        disassembly_required BOOLEAN DEFAULT FALSE,
        disassembly_description TEXT NULL,
        request_donation_pickup BOOLEAN DEFAULT FALSE,
        request_demolition BOOLEAN DEFAULT FALSE,
        demolition_description TEXT NULL,
        how_did_you_hear VARCHAR(100) NULL,
        understand_pricing BOOLEAN DEFAULT FALSE,
        text_opt_in BOOLEAN DEFAULT FALSE,
        estimated_weight DECIMAL(8, 2) NULL,
        estimated_yardage DECIMAL(6, 2) NULL,
        notes TEXT NULL,
        created_by VARCHAR(36) NULL,
        assigned_to VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES portal_users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL,
        INDEX idx_customer_id (customer_id),
        INDEX idx_type (type),
        INDEX idx_priority (priority),
        INDEX idx_status (status),
        INDEX idx_requested_date (requested_date),
        INDEX idx_preferred_date (preferred_date),
        INDEX idx_created_at (created_at)
      )
    `);

    // 3. Create portal_request_attachments table
    console.log('Creating portal_request_attachments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_request_attachments (
        id VARCHAR(36) PRIMARY KEY,
        request_id VARCHAR(36) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        media_type ENUM('photo', 'video', 'document', 'other') DEFAULT 'photo',
        description TEXT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(36) NULL,
        FOREIGN KEY (request_id) REFERENCES portal_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES portal_users(id) ON DELETE SET NULL,
        INDEX idx_request_id (request_id),
        INDEX idx_media_type (media_type),
        INDEX idx_is_primary (is_primary),
        INDEX idx_upload_date (upload_date)
      )
    `);

    // 4. Create portal_request_status_history table
    console.log('Creating portal_request_status_history table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_request_status_history (
        id VARCHAR(36) PRIMARY KEY,
        request_id VARCHAR(36) NOT NULL,
        old_status VARCHAR(50) NULL,
        new_status VARCHAR(50) NOT NULL,
        change_reason TEXT NULL,
        changed_by VARCHAR(36) NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT NULL,
        FOREIGN KEY (request_id) REFERENCES portal_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES portal_users(id) ON DELETE SET NULL,
        INDEX idx_request_id (request_id),
        INDEX idx_new_status (new_status),
        INDEX idx_changed_at (changed_at)
      )
    `);

    // 5. Create portal_notifications table
    console.log('Creating portal_notifications table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        request_id VARCHAR(36) NULL,
        type ENUM('status_update', 'quote_ready', 'scheduling', 'reminder', 'general', 'urgent') DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
        scheduled_for TIMESTAMP NULL,
        sent_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES portal_users(id) ON DELETE CASCADE,
        FOREIGN KEY (request_id) REFERENCES portal_requests(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_request_id (request_id),
        INDEX idx_type (type),
        INDEX idx_is_read (is_read),
        INDEX idx_priority (priority),
        INDEX idx_scheduled_for (scheduled_for)
      )
    `);

    // 6. Create portal_reports table
    console.log('Creating portal_reports table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_reports (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        report_type ENUM('monthly', 'quarterly', 'annual', 'custom', 'job_summary', 'financial', 'volume') DEFAULT 'monthly',
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        report_data JSON NULL,
        file_path VARCHAR(500) NULL,
        file_size BIGINT NULL,
        download_count INT DEFAULT 0,
        last_downloaded TIMESTAMP NULL,
        is_scheduled BOOLEAN DEFAULT FALSE,
        schedule_frequency VARCHAR(50) NULL,
        next_generation_date DATE NULL,
        status ENUM('generating', 'ready', 'failed', 'expired') DEFAULT 'generating',
        generated_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES portal_users(id) ON DELETE CASCADE,
        INDEX idx_customer_id (customer_id),
        INDEX idx_user_id (user_id),
        INDEX idx_report_type (report_type),
        INDEX idx_period_start (period_start),
        INDEX idx_period_end (period_end),
        INDEX idx_status (status),
        INDEX idx_is_scheduled (is_scheduled)
      )
    `);

    // 7. Create portal_activity_logs table
    console.log('Creating portal_activity_logs table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_activity_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        customer_id VARCHAR(36) NOT NULL,
        activity_type ENUM('login', 'logout', 'create_request', 'edit_request', 'view_request', 'download_report', 'update_profile', 'change_password', 'upload_file', 'other') DEFAULT 'other',
        description TEXT NOT NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        request_id VARCHAR(36) NULL,
        report_id VARCHAR(36) NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES portal_users(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (request_id) REFERENCES portal_requests(id) ON DELETE SET NULL,
        FOREIGN KEY (report_id) REFERENCES portal_reports(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_activity_type (activity_type),
        INDEX idx_created_at (created_at)
      )
    `);

    // 8. Create portal_settings table
    console.log('Creating portal_settings table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_settings (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT NULL,
        setting_type ENUM('string', 'number', 'boolean', 'json', 'date') DEFAULT 'string',
        description TEXT NULL,
        is_editable BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_customer_setting (customer_id, setting_key),
        INDEX idx_customer_id (customer_id),
        INDEX idx_setting_key (setting_key)
      )
    `);

    // 9. Create portal_templates table
    console.log('Creating portal_templates table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_templates (
        id VARCHAR(36) PRIMARY KEY,
        template_name VARCHAR(100) NOT NULL UNIQUE,
        template_type ENUM('email', 'sms', 'notification', 'pdf') DEFAULT 'email',
        subject VARCHAR(255) NULL,
        html_content TEXT NULL,
        text_content TEXT NULL,
        variables JSON NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_template_name (template_name),
        INDEX idx_template_type (template_type),
        INDEX idx_is_active (is_active)
      )
    `);

    // 10. Create portal_scheduled_tasks table
    console.log('Creating portal_scheduled_tasks table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portal_scheduled_tasks (
        id VARCHAR(36) PRIMARY KEY,
        task_name VARCHAR(100) NOT NULL,
        task_type ENUM('report_generation', 'notification_send', 'data_cleanup', 'backup', 'maintenance') DEFAULT 'report_generation',
        cron_expression VARCHAR(100) NULL,
        schedule_type ENUM('daily', 'weekly', 'monthly', 'custom', 'one_time') DEFAULT 'daily',
        next_run TIMESTAMP NULL,
        last_run TIMESTAMP NULL,
        last_run_status ENUM('success', 'failed', 'running') DEFAULT 'success',
        last_run_message TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        max_retries INT DEFAULT 3,
        retry_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_task_name (task_name),
        INDEX idx_task_type (task_type),
        INDEX idx_next_run (next_run),
        INDEX idx_is_active (is_active)
      )
    `);

    console.log('All Client Portal tables created successfully!');

    // Insert sample data
    console.log('Inserting sample data...');

    // Sample portal users
    const portalUsers = [
      {
        id: 'pu-1',
        customer_id: 'cust-1',
        username: 'downtown_admin',
        email: 'admin@downtownoffice.com',
        password_hash: 'hashed_password_123',
        role: 'owner',
        permissions: JSON.stringify({
          dashboard: true,
          requests: true,
          reports: true,
          admin: true
        })
      },
      {
        id: 'pu-2',
        customer_id: 'cust-2',
        username: 'riverside_manager',
        email: 'manager@riversideapts.com',
        password_hash: 'hashed_password_456',
        role: 'manager',
        permissions: JSON.stringify({
          dashboard: true,
          requests: true,
          reports: true
        })
      },
      {
        id: 'pu-3',
        customer_id: 'cust-3',
        username: 'coastal_ops',
        email: 'operations@coastalretail.com',
        password_hash: 'hashed_password_789',
        role: 'employee',
        permissions: JSON.stringify({
          dashboard: true,
          requests: true
        })
      }
    ];

    for (const user of portalUsers) {
      await connection.execute(`
        INSERT IGNORE INTO portal_users (id, customer_id, username, email, password_hash, role, permissions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [user.id, user.customer_id, user.username, user.email, user.password_hash, user.role, user.permissions]);
    }

    // Sample portal requests
    const portalRequests = [
      {
        id: 'req-1',
        customer_id: 'cust-1',
        customer_name: 'Downtown Office Complex',
        type: 'pickup',
        priority: 'medium',
        status: 'completed',
        subject: 'Weekly Office Waste Pickup',
        description: 'Regular weekly pickup of office waste and recycling from all floors',
        requested_date: '2024-01-15',
        preferred_date: '2024-01-16',
        preferred_time: '09:00 AM',
        location_address: '321 Commerce St',
        location_city: 'Wilmington',
        location_state: 'NC',
        location_zip_code: '28401'
      },
      {
        id: 'req-2',
        customer_id: 'cust-1',
        customer_name: 'Downtown Office Complex',
        type: 'service',
        priority: 'high',
        status: 'in-progress',
        subject: 'Emergency Cleanup - Conference Room Renovation',
        description: 'Need immediate cleanup of construction debris from conference room renovation project',
        requested_date: '2024-01-20',
        preferred_date: '2024-01-21',
        preferred_time: 'ASAP',
        location_address: '321 Commerce St',
        location_city: 'Wilmington',
        location_state: 'NC',
        location_zip_code: '28401'
      }
    ];

    for (const request of portalRequests) {
      await connection.execute(`
        INSERT IGNORE INTO portal_requests (id, customer_id, customer_name, type, priority, status, subject, description, requested_date, preferred_date, preferred_time, location_address, location_city, location_state, location_zip_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [request.id, request.customer_id, request.customer_name, request.type, request.priority, request.status, request.subject, request.description, request.requested_date, request.preferred_date, request.preferred_time, request.location_address, request.location_city, request.location_state, request.location_zip_code]);
    }

    // Sample portal settings
    const portalSettings = [
      {
        id: 'ps-1',
        customer_id: 'cust-1',
        setting_key: 'notifications_enabled',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'Enable email notifications'
      },
      {
        id: 'ps-2',
        customer_id: 'cust-1',
        setting_key: 'default_timezone',
        setting_value: 'America/New_York',
        setting_type: 'string',
        description: 'Default timezone for the portal'
      },
      {
        id: 'ps-3',
        customer_id: 'cust-1',
        setting_key: 'auto_generate_reports',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'Automatically generate monthly reports'
      },
      {
        id: 'ps-4',
        customer_id: 'cust-1',
        setting_key: 'max_file_upload_size',
        setting_value: '10485760',
        setting_type: 'number',
        description: 'Maximum file upload size in bytes'
      }
    ];

    for (const setting of portalSettings) {
      await connection.execute(`
        INSERT IGNORE INTO portal_settings (id, customer_id, setting_key, setting_value, setting_type, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [setting.id, setting.customer_id, setting.setting_key, setting.setting_value, setting.setting_type, setting.description]);
    }

    // Sample portal templates
    const portalTemplates = [
      {
        id: 'pt-1',
        template_name: 'welcome_email',
        template_type: 'email',
        subject: 'Welcome to Our Client Portal',
        html_content: '<h1>Welcome!</h1><p>Thank you for joining our client portal.</p>',
        text_content: 'Welcome! Thank you for joining our client portal.',
        variables: JSON.stringify(['user_name', 'company_name'])
      },
      {
        id: 'pt-2',
        template_name: 'request_status_update',
        template_type: 'email',
        subject: 'Your Service Request Status Has Been Updated',
        html_content: '<h2>Status Update</h2><p>Your request {request_number} has been updated to {status}.</p>',
        text_content: 'Status Update: Your request {request_number} has been updated to {status}.',
        variables: JSON.stringify(['request_number', 'status', 'customer_name'])
      }
    ];

    for (const template of portalTemplates) {
      await connection.execute(`
        INSERT IGNORE INTO portal_templates (id, template_name, template_type, subject, html_content, text_content, variables)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [template.id, template.template_name, template.template_type, template.subject, template.html_content, template.text_content, template.variables]);
    }

    // Sample portal scheduled tasks
    const portalTasks = [
      {
        id: 'task-1',
        task_name: 'monthly_report_generation',
        task_type: 'report_generation',
        cron_expression: '0 0 1 * *',
        schedule_type: 'monthly',
        next_run: '2024-02-01 00:00:00'
      },
      {
        id: 'task-2',
        task_name: 'daily_notification_cleanup',
        task_type: 'data_cleanup',
        cron_expression: '0 2 * * *',
        schedule_type: 'daily',
        next_run: '2024-01-16 02:00:00'
      }
    ];

    for (const task of portalTasks) {
      await connection.execute(`
        INSERT IGNORE INTO portal_scheduled_tasks (id, task_name, task_type, cron_expression, schedule_type, next_run)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [task.id, task.task_name, task.task_type, task.cron_expression, task.schedule_type, task.next_run]);
    }

    console.log('Sample data inserted successfully!');
    console.log('Client Portal database setup completed successfully!');

  } catch (error) {
    console.error('Error setting up Client Portal database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  createClientPortalTables()
    .then(() => {
      console.log('Client Portal migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Client Portal migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createClientPortalTables };
