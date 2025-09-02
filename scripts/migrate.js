const mysql = require('mysql2/promise');
require('dotenv').config();

const createTables = async () => {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'junk_removal_db'
    });

    console.log('✅ Connected to database');

    // Create jobs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip_code VARCHAR(10) NOT NULL,
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        scheduled_date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        estimated_hours DECIMAL(4,2) NOT NULL,
        status ENUM('scheduled', 'in-progress', 'completed', 'cancelled') DEFAULT 'scheduled',
        crew_id VARCHAR(36) NULL,
        truck_id VARCHAR(36) NULL,
        total_estimate DECIMAL(10,2) NOT NULL,
        actual_total DECIMAL(10,2) NULL,
        notes TEXT NULL,
        estimate_id VARCHAR(36) NULL,
        property_manager_id VARCHAR(36) NULL,
        estimated_weight DECIMAL(8,2) NULL,
        estimated_yardage DECIMAL(6,2) NULL,
        actual_weight DECIMAL(8,2) NULL,
        actual_yardage DECIMAL(6,2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_customer_id (customer_id),
        INDEX idx_status (status),
        INDEX idx_scheduled_date (scheduled_date),
        INDEX idx_crew_id (crew_id),
        INDEX idx_truck_id (truck_id),
        INDEX idx_estimate_id (estimate_id),
        INDEX idx_property_manager_id (property_manager_id),
        INDEX idx_location (city, state),
        INDEX idx_coordinates (latitude, longitude)
      )
    `);
    console.log('✅ Created jobs table');

    // Create job_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS job_items (
        id VARCHAR(36) PRIMARY KEY,
        job_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        base_price DECIMAL(8,2) NOT NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        estimated_time DECIMAL(4,2) NOT NULL,
        actual_time DECIMAL(4,2) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        INDEX idx_job_id (job_id),
        INDEX idx_category (category)
      )
    `);
    console.log('✅ Created job_items table');

    // Create job_photos table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS job_photos (
        id VARCHAR(36) PRIMARY KEY,
        job_id VARCHAR(36) NOT NULL,
        photo_type ENUM('before', 'after') NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        uploaded_by VARCHAR(36) NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        INDEX idx_job_id (job_id),
        INDEX idx_photo_type (photo_type)
      )
    `);
    console.log('✅ Created job_photos table');

    // Create job_status_history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS job_status_history (
        id VARCHAR(36) PRIMARY KEY,
        job_id VARCHAR(36) NOT NULL,
        status ENUM('scheduled', 'in-progress', 'completed', 'cancelled') NOT NULL,
        changed_by VARCHAR(36) NULL,
        notes TEXT NULL,
        location_latitude DECIMAL(10, 8) NULL,
        location_longitude DECIMAL(11, 8) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        INDEX idx_job_id (job_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Created job_status_history table');

    // Create job_notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS job_notifications (
        id VARCHAR(36) PRIMARY KEY,
        job_id VARCHAR(36) NOT NULL,
        notification_type ENUM('on-way', 'started', 'completed', 'custom') NOT NULL,
        message TEXT NOT NULL,
        sent_to VARCHAR(255) NOT NULL,
        delivery_method ENUM('sms', 'email', 'push') NOT NULL,
        status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
        sent_by VARCHAR(36) NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP NULL,
        
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        INDEX idx_job_id (job_id),
        INDEX idx_notification_type (notification_type),
        INDEX idx_status (status),
        INDEX idx_sent_at (sent_at)
      )
    `);
    console.log('✅ Created job_notifications table');

    // Create job_time_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS job_time_logs (
        id VARCHAR(36) PRIMARY KEY,
        job_id VARCHAR(36) NOT NULL,
        employee_id VARCHAR(36) NOT NULL,
        activity_type ENUM('travel', 'setup', 'work', 'cleanup', 'travel_return') NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NULL,
        duration_minutes INT NULL,
        notes TEXT NULL,
        location_latitude DECIMAL(10, 8) NULL,
        location_longitude DECIMAL(11, 8) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        INDEX idx_job_id (job_id),
        INDEX idx_employee_id (employee_id),
        INDEX idx_activity_type (activity_type),
        INDEX idx_start_time (start_time)
      )
    `);
    console.log('✅ Created job_time_logs table');

    // Create crews table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS crews (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        capacity INT NOT NULL DEFAULT 2,
        is_available BOOLEAN DEFAULT TRUE,
        current_job_id VARCHAR(36) NULL,
        assigned_truck_id VARCHAR(36) NULL,
        supervisor_id VARCHAR(36) NULL,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        completed_jobs INT DEFAULT 0,
        on_time_rate DECIMAL(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_current_job_id (current_job_id),
        INDEX idx_assigned_truck_id (assigned_truck_id),
        INDEX idx_supervisor_id (supervisor_id),
        INDEX idx_is_available (is_available)
      )
    `);
    console.log('✅ Created crews table');

    // Create crew_members table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS crew_members (
        id VARCHAR(36) PRIMARY KEY,
        crew_id VARCHAR(36) NOT NULL,
        employee_id VARCHAR(36) NOT NULL,
        role ENUM('driver', 'helper', 'supervisor') DEFAULT 'helper',
        assigned_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE CASCADE,
        UNIQUE KEY unique_crew_employee (crew_id, employee_id),
        INDEX idx_crew_id (crew_id),
        INDEX idx_employee_id (employee_id)
      )
    `);
    console.log('✅ Created crew_members table');

    // Create trucks table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trucks (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        license_plate VARCHAR(20) NOT NULL UNIQUE,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INT NOT NULL,
        capacity_weight DECIMAL(8,2) NOT NULL,
        capacity_volume DECIMAL(6,2) NOT NULL,
        status ENUM('available', 'in-use', 'maintenance', 'out-of-service') DEFAULT 'available',
        current_latitude DECIMAL(10, 8) NULL,
        current_longitude DECIMAL(11, 8) NULL,
        assigned_crew_id VARCHAR(36) NULL,
        assigned_job_id VARCHAR(36) NULL,
        fuel_level DECIMAL(5,2) DEFAULT 100.00,
        mileage INT NOT NULL DEFAULT 0,
        last_service_date DATE NULL,
        next_service_date DATE NULL,
        insurance_policy_number VARCHAR(100) NULL,
        insurance_expiry_date DATE NULL,
        insurance_provider VARCHAR(255) NULL,
        registration_number VARCHAR(100) NULL,
        registration_expiry_date DATE NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_status (status),
        INDEX idx_assigned_crew_id (assigned_crew_id),
        INDEX idx_assigned_job_id (assigned_job_id),
        INDEX idx_location (current_latitude, current_longitude)
      )
    `);
    console.log('✅ Created trucks table');

    // Create time_slots table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id VARCHAR(36) PRIMARY KEY,
        time_slot VARCHAR(50) NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        crew_id VARCHAR(36) NULL,
        max_jobs_per_slot INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_time_slot (time_slot),
        INDEX idx_is_available (is_available),
        INDEX idx_crew_id (crew_id)
      )
    `);
    console.log('✅ Created time_slots table');

    // Create employees table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'dispatcher', 'crew_leader', 'crew_member') NOT NULL DEFAULT 'crew_member',
        phone VARCHAR(20) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active)
      )
    `);
    console.log('✅ Created employees table');

    // Create customers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip_code VARCHAR(10) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_location (city, state)
      )
    `);
    console.log('✅ Created customers table');

    console.log('\n🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run migration
createTables();
