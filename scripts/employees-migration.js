const mysql = require('mysql2/promise');
const config = require('../config/database');

async function createEmployeesTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('Connected to database');

    // Create employees table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(36) PRIMARY KEY,
        employee_number VARCHAR(50) NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(2) NOT NULL,
        zip_code VARCHAR(10) NOT NULL,
        country VARCHAR(100) DEFAULT 'USA',
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        employee_type ENUM('regular', 'manager', '1099', 'intern', 'seasonal') DEFAULT 'regular',
        position ENUM('driver', 'helper', 'supervisor', 'manager', 'admin', 'dispatcher', 'mechanic', 'other') DEFAULT 'helper',
        status ENUM('active', 'inactive', 'on-leave', 'terminated', 'suspended', 'probation') DEFAULT 'active',
        hire_date DATE NOT NULL,
        termination_date DATE NULL,
        termination_reason TEXT NULL,
        assigned_truck_id VARCHAR(36) NULL,
        assigned_crew_id VARCHAR(36) NULL,
        supervisor_id VARCHAR(36) NULL,
        department VARCHAR(100) NULL,
        notes TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employees table created');

    // Create employee_portal_credentials table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_portal_credentials (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        password_salt VARCHAR(255) NULL,
        last_login TIMESTAMP NULL,
        login_attempts INT DEFAULT 0,
        is_locked BOOLEAN DEFAULT FALSE,
        lock_expiry TIMESTAMP NULL,
        password_reset_token VARCHAR(255) NULL,
        password_reset_expiry TIMESTAMP NULL,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        two_factor_secret VARCHAR(255) NULL,
        permissions JSON NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_portal_credentials table created');

    // Create employee_emergency_contacts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        contact_type ENUM('primary', 'secondary', 'emergency', 'beneficiary') DEFAULT 'primary',
        name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NULL,
        address TEXT NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(2) NULL,
        zip_code VARCHAR(10) NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_emergency_contacts table created');

    // Create employee_documents table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_documents (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        document_type ENUM('drivers_license', 'background_check', 'drug_test', 'i9_form', 'w4_form', 'contract', 'certification', 'training_record', 'performance_review', 'other') NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        document_number VARCHAR(100) NULL,
        issuing_authority VARCHAR(255) NULL,
        issue_date DATE NULL,
        expiry_date DATE NULL,
        status ENUM('pending', 'active', 'expired', 'revoked', 'failed') DEFAULT 'pending',
        file_path VARCHAR(500) NULL,
        file_size BIGINT NULL,
        file_type VARCHAR(100) NULL,
        is_required BOOLEAN DEFAULT FALSE,
        verification_date DATE NULL,
        verified_by VARCHAR(36) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_documents table created');

    // Create employee_certifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_certifications (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        issuing_authority VARCHAR(255) NOT NULL,
        certificate_number VARCHAR(100) NULL,
        issue_date DATE NOT NULL,
        expiry_date DATE NULL,
        status ENUM('active', 'expired', 'suspended', 'revoked') DEFAULT 'active',
        renewal_required BOOLEAN DEFAULT FALSE,
        renewal_frequency VARCHAR(50) NULL,
        continuing_education_hours DECIMAL(5, 2) NULL,
        ce_hours_required DECIMAL(5, 2) NULL,
        file_path VARCHAR(500) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_certifications table created');

    // Create employee_pay_rates table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_pay_rates (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        pay_type ENUM('hourly', 'salary', 'commission', 'piece_rate', '1099') DEFAULT 'hourly',
        base_rate DECIMAL(8, 2) NOT NULL,
        overtime_rate DECIMAL(8, 2) NULL,
        overtime_multiplier DECIMAL(3, 2) DEFAULT 1.5,
        holiday_rate DECIMAL(8, 2) NULL,
        holiday_multiplier DECIMAL(3, 2) DEFAULT 1.5,
        weekend_rate DECIMAL(8, 2) NULL,
        weekend_multiplier DECIMAL(3, 2) DEFAULT 1.25,
        night_differential DECIMAL(8, 2) NULL,
        per_diem_rate DECIMAL(8, 2) NULL,
        mileage_rate DECIMAL(6, 2) NULL,
        effective_date DATE NOT NULL,
        end_date DATE NULL,
        is_current BOOLEAN DEFAULT TRUE,
        approved_by VARCHAR(36) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_pay_rates table created');

    // Create employee_schedules table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_schedules (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        schedule_type ENUM('regular', 'overtime', 'on_call', 'training', 'maintenance') DEFAULT 'regular',
        day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        break_start TIME NULL,
        break_end TIME NULL,
        is_available BOOLEAN DEFAULT TRUE,
        is_required BOOLEAN DEFAULT TRUE,
        notes TEXT NULL,
        effective_date DATE NOT NULL,
        end_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_schedules table created');

    // Create employee_performance table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_performance (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        review_type ENUM('annual', 'quarterly', 'monthly', 'probation', 'promotion', 'termination') DEFAULT 'annual',
        review_date DATE NOT NULL,
        reviewer_id VARCHAR(36) NULL,
        overall_rating DECIMAL(2, 1) NOT NULL,
        next_review_date DATE NULL,
        status ENUM('draft', 'submitted', 'approved', 'completed') DEFAULT 'draft',
        comments TEXT NULL,
        goals TEXT NULL,
        achievements TEXT NULL,
        areas_for_improvement TEXT NULL,
        training_recommendations TEXT NULL,
        promotion_eligibility BOOLEAN DEFAULT FALSE,
        salary_recommendation TEXT NULL,
        employee_signature BOOLEAN DEFAULT FALSE,
        employee_signature_date DATE NULL,
        manager_signature BOOLEAN DEFAULT FALSE,
        manager_signature_date DATE NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_performance table created');

    // Create employee_performance_metrics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_performance_metrics (
        id VARCHAR(36) PRIMARY KEY,
        performance_id VARCHAR(36) NOT NULL,
        metric_name VARCHAR(255) NOT NULL,
        metric_category VARCHAR(100) NULL,
        rating DECIMAL(2, 1) NOT NULL,
        max_rating DECIMAL(2, 1) DEFAULT 5.0,
        weight DECIMAL(3, 2) DEFAULT 1.00,
        comments TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_performance_metrics table created');

    // Create employee_training table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_training (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        training_name VARCHAR(255) NOT NULL,
        training_type ENUM('safety', 'compliance', 'skills', 'leadership', 'certification', 'refresher') DEFAULT 'safety',
        provider VARCHAR(255) NULL,
        instructor VARCHAR(255) NULL,
        start_date DATE NOT NULL,
        end_date DATE NULL,
        duration_hours DECIMAL(5, 2) NULL,
        status ENUM('scheduled', 'in_progress', 'completed', 'failed', 'cancelled') DEFAULT 'scheduled',
        score DECIMAL(5, 2) NULL,
        passing_score DECIMAL(5, 2) NULL,
        certificate_number VARCHAR(100) NULL,
        expiry_date DATE NULL,
        renewal_required BOOLEAN DEFAULT FALSE,
        renewal_frequency VARCHAR(50) NULL,
        cost DECIMAL(8, 2) NULL,
        file_path VARCHAR(500) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_training table created');

    // Create employee_time_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_time_logs (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        log_date DATE NOT NULL,
        clock_in TIME NULL,
        clock_out TIME NULL,
        break_start TIME NULL,
        break_end TIME NULL,
        total_hours DECIMAL(5, 2) NULL,
        regular_hours DECIMAL(5, 2) NULL,
        overtime_hours DECIMAL(5, 2) NULL,
        holiday_hours DECIMAL(5, 2) NULL,
        weekend_hours DECIMAL(5, 2) NULL,
        night_hours DECIMAL(5, 2) NULL,
        status ENUM('present', 'absent', 'late', 'early_departure', 'sick', 'vacation', 'personal', 'other') DEFAULT 'present',
        job_id VARCHAR(36) NULL,
        crew_id VARCHAR(36) NULL,
        location_lat DECIMAL(10, 8) NULL,
        location_lng DECIMAL(11, 8) NULL,
        notes TEXT NULL,
        approved_by VARCHAR(36) NULL,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_time_logs table created');

    // Create employee_benefits table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_benefits (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        benefit_type ENUM('health_insurance', 'dental_insurance', 'vision_insurance', 'life_insurance', 'disability_insurance', 'retirement', 'vacation', 'sick_leave', 'personal_leave', 'other') NOT NULL,
        provider VARCHAR(255) NULL,
        policy_number VARCHAR(100) NULL,
        group_number VARCHAR(100) NULL,
        start_date DATE NOT NULL,
        end_date DATE NULL,
        employee_cost DECIMAL(8, 2) NULL,
        employer_cost DECIMAL(8, 2) NULL,
        total_cost DECIMAL(8, 2) NULL,
        coverage_level VARCHAR(100) NULL,
        dependents_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_benefits table created');

    // Create employee_incidents table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_incidents (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        incident_type ENUM('safety_violation', 'policy_violation', 'performance_issue', 'attendance_issue', 'accident', 'injury', 'other') NOT NULL,
        incident_date DATE NOT NULL,
        incident_time TIME NULL,
        location TEXT NULL,
        description TEXT NOT NULL,
        severity ENUM('minor', 'moderate', 'major', 'critical') DEFAULT 'minor',
        witnesses TEXT NULL,
        reported_by VARCHAR(36) NULL,
        investigation_required BOOLEAN DEFAULT FALSE,
        investigation_date DATE NULL,
        investigation_by VARCHAR(36) NULL,
        findings TEXT NULL,
        corrective_actions TEXT NULL,
        disciplinary_action ENUM('none', 'verbal_warning', 'written_warning', 'suspension', 'termination', 'other') DEFAULT 'none',
        suspension_start DATE NULL,
        suspension_end DATE NULL,
        suspension_reason TEXT NULL,
        follow_up_date DATE NULL,
        status ENUM('reported', 'investigating', 'resolved', 'closed') DEFAULT 'reported',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_incidents table created');

    // Create employee_equipment table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employee_equipment (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        equipment_name VARCHAR(255) NOT NULL,
        equipment_type ENUM('safety_gear', 'tools', 'uniforms', 'electronics', 'vehicles', 'other') DEFAULT 'safety_gear',
        serial_number VARCHAR(100) NULL,
        asset_tag VARCHAR(100) NULL,
        issue_date DATE NOT NULL,
        return_date DATE NULL,
        condition ENUM('new', 'good', 'fair', 'poor', 'damaged') DEFAULT 'good',
        replacement_cost DECIMAL(8, 2) NULL,
        is_returnable BOOLEAN DEFAULT TRUE,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ employee_equipment table created');

    // Create indexes for employees table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_number ON employees (employee_number)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_email ON employees (email)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_type ON employees (employee_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_position ON employees (position)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_status ON employees (status)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_hire_date ON employees (hire_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_assigned_truck_id ON employees (assigned_truck_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_assigned_crew_id ON employees (assigned_crew_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_supervisor_id ON employees (supervisor_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_is_active ON employees (is_active)');
    console.log('✓ employees indexes created');

    // Create indexes for employee_portal_credentials table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_portal_credentials (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_username ON employee_portal_credentials (username)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_email ON employee_portal_credentials (email)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_is_active ON employee_portal_credentials (is_active)');
    console.log('✓ employee_portal_credentials indexes created');

    // Create indexes for employee_emergency_contacts table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_emergency_contacts (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_contact_type ON employee_emergency_contacts (contact_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_is_primary ON employee_emergency_contacts (is_primary)');
    console.log('✓ employee_emergency_contacts indexes created');

    // Create indexes for employee_documents table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_documents (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_document_type ON employee_documents (document_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_status ON employee_documents (status)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_expiry_date ON employee_documents (expiry_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_is_required ON employee_documents (is_required)');
    console.log('✓ employee_documents indexes created');

    // Create indexes for employee_certifications table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_certifications (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_status ON employee_certifications (status)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_expiry_date ON employee_certifications (expiry_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_renewal_required ON employee_certifications (renewal_required)');
    console.log('✓ employee_certifications indexes created');

    // Create indexes for employee_pay_rates table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_pay_rates (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_pay_type ON employee_pay_rates (pay_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_effective_date ON employee_pay_rates (effective_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_is_current ON employee_pay_rates (is_current)');
    console.log('✓ employee_pay_rates indexes created');

    // Create indexes for employee_schedules table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_schedules (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_schedule_type ON employee_schedules (schedule_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_day_of_week ON employee_schedules (day_of_week)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_effective_date ON employee_schedules (effective_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_is_available ON employee_schedules (is_available)');
    console.log('✓ employee_schedules indexes created');

    // Create indexes for employee_performance table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_performance (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_review_type ON employee_performance (review_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_review_date ON employee_performance (review_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_next_review_date ON employee_performance (next_review_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_status ON employee_performance (status)');
    console.log('✓ employee_performance indexes created');

    // Create indexes for employee_performance_metrics table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_performance_id ON employee_performance_metrics (performance_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_metric_category ON employee_performance_metrics (metric_category)');
    console.log('✓ employee_performance_metrics indexes created');

    // Create indexes for employee_training table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_training (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_training_type ON employee_training (training_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_status ON employee_training (status)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_start_date ON employee_training (start_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_expiry_date ON employee_training (expiry_date)');
    console.log('✓ employee_training indexes created');

    // Create indexes for employee_time_logs table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_time_logs (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_log_date ON employee_time_logs (log_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_status ON employee_time_logs (status)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_job_id ON employee_time_logs (job_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_crew_id ON employee_time_logs (crew_id)');
    console.log('✓ employee_time_logs indexes created');

    // Create indexes for employee_benefits table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_benefits (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_benefit_type ON employee_benefits (benefit_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_start_date ON employee_benefits (start_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_end_date ON employee_benefits (end_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_is_active ON employee_benefits (is_active)');
    console.log('✓ employee_benefits indexes created');

    // Create indexes for employee_incidents table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_incidents (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_incident_type ON employee_incidents (incident_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_incident_date ON employee_incidents (incident_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_severity ON employee_incidents (severity)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_status ON employee_incidents (status)');
    console.log('✓ employee_incidents indexes created');

    // Create indexes for employee_equipment table
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_employee_id ON employee_equipment (employee_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_equipment_type ON employee_equipment (equipment_type)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_issue_date ON employee_equipment (issue_date)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_condition ON employee_equipment (condition)');
    console.log('✓ employee_equipment indexes created');

    // Insert sample employees
    const sampleEmployees = [
      {
        id: 'emp-1',
        employee_number: 'EMP001',
        first_name: 'John',
        last_name: 'Driver',
        email: 'john.driver@company.com',
        phone: '555-0100',
        address: '123 Main St',
        city: 'Wilmington',
        state: 'NC',
        zip_code: '28401',
        employee_type: 'regular',
        position: 'driver',
        status: 'active',
        hire_date: '2022-03-15',
        department: 'operations',
        notes: 'Experienced driver, excellent safety record'
      },
      {
        id: 'emp-2',
        employee_number: 'EMP002',
        first_name: 'Mike',
        last_name: 'Helper',
        email: 'mike.helper@company.com',
        phone: '555-0200',
        address: '456 Oak Ave',
        city: 'Wilmington',
        state: 'NC',
        zip_code: '28403',
        employee_type: '1099',
        position: 'helper',
        status: 'active',
        hire_date: '2023-03-01',
        department: 'operations',
        notes: 'Hard worker, learning quickly'
      },
      {
        id: 'emp-3',
        employee_number: 'EMP003',
        first_name: 'Lisa',
        last_name: 'Supervisor',
        email: 'lisa.supervisor@company.com',
        phone: '555-0300',
        address: '789 Pine St',
        city: 'Wilmington',
        state: 'NC',
        zip_code: '28405',
        employee_type: 'manager',
        position: 'supervisor',
        status: 'active',
        hire_date: '2021-06-01',
        department: 'operations',
        notes: 'Excellent supervisor, great leadership skills'
      },
      {
        id: 'emp-4',
        employee_number: 'EMP004',
        first_name: 'Sarah',
        last_name: 'Manager',
        email: 'sarah.manager@company.com',
        phone: '555-0400',
        address: '321 Elm St',
        city: 'Wilmington',
        state: 'NC',
        zip_code: '28402',
        employee_type: 'manager',
        position: 'manager',
        status: 'active',
        hire_date: '2020-08-01',
        department: 'admin',
        notes: 'Senior manager, excellent organizational skills'
      },
      {
        id: 'emp-5',
        employee_number: 'EMP005',
        first_name: 'Tom',
        last_name: 'Dispatcher',
        email: 'tom.dispatcher@company.com',
        phone: '555-0500',
        address: '654 Maple Dr',
        city: 'Wilmington',
        state: 'NC',
        zip_code: '28404',
        employee_type: 'regular',
        position: 'dispatcher',
        status: 'active',
        hire_date: '2022-01-15',
        department: 'operations',
        notes: 'Efficient dispatcher, great communication skills'
      }
    ];

    for (const employee of sampleEmployees) {
      await connection.execute(`
        INSERT INTO employees (id, employee_number, first_name, last_name, email, phone, address, city, state, zip_code, employee_type, position, status, hire_date, department, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [employee.id, employee.employee_number, employee.first_name, employee.last_name, employee.email, employee.phone, employee.address, employee.city, employee.state, employee.zip_code, employee.employee_type, employee.position, employee.status, employee.hire_date, employee.department, employee.notes]);
    }
    console.log('✓ Sample employees inserted');

    // Insert sample emergency contacts
    const sampleEmergencyContacts = [
      {
        id: 'ec-1',
        employee_id: 'emp-1',
        contact_type: 'primary',
        name: 'Jane Driver',
        relationship: 'spouse',
        phone: '555-0102',
        is_primary: true
      },
      {
        id: 'ec-2',
        employee_id: 'emp-2',
        contact_type: 'primary',
        name: 'Sarah Helper',
        relationship: 'sister',
        phone: '555-0202',
        is_primary: true
      },
      {
        id: 'ec-3',
        employee_id: 'emp-3',
        contact_type: 'primary',
        name: 'Tom Supervisor',
        relationship: 'spouse',
        phone: '555-0302',
        is_primary: true
      }
    ];

    for (const contact of sampleEmergencyContacts) {
      await connection.execute(`
        INSERT INTO employee_emergency_contacts (id, employee_id, contact_type, name, relationship, phone, is_primary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [contact.id, contact.employee_id, contact.contact_type, contact.name, contact.relationship, contact.phone, contact.is_primary]);
    }
    console.log('✓ Sample emergency contacts inserted');

    // Insert sample pay rates
    const samplePayRates = [
      {
        id: 'pay-1',
        employee_id: 'emp-1',
        pay_type: 'hourly',
        base_rate: 18.00,
        overtime_rate: 27.00,
        effective_date: '2022-03-15'
      },
      {
        id: 'pay-2',
        employee_id: 'emp-2',
        pay_type: 'hourly',
        base_rate: 15.00,
        overtime_rate: 22.50,
        effective_date: '2023-03-01'
      },
      {
        id: 'pay-3',
        employee_id: 'emp-3',
        pay_type: 'hourly',
        base_rate: 25.00,
        overtime_rate: 37.50,
        effective_date: '2021-06-01'
      }
    ];

    for (const payRate of samplePayRates) {
      await connection.execute(`
        INSERT INTO employee_pay_rates (id, employee_id, pay_type, base_rate, overtime_rate, effective_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [payRate.id, payRate.employee_id, payRate.pay_type, payRate.base_rate, payRate.overtime_rate, payRate.effective_date]);
    }
    console.log('✓ Sample pay rates inserted');

    // Insert sample schedules
    const sampleSchedules = [
      {
        id: 'sched-1',
        employee_id: 'emp-1',
        schedule_type: 'regular',
        day_of_week: 'monday',
        start_time: '08:00:00',
        end_time: '17:00:00',
        break_start: '12:00:00',
        break_end: '13:00:00',
        effective_date: '2024-01-01'
      },
      {
        id: 'sched-2',
        employee_id: 'emp-1',
        schedule_type: 'regular',
        day_of_week: 'tuesday',
        start_time: '08:00:00',
        end_time: '17:00:00',
        break_start: '12:00:00',
        break_end: '13:00:00',
        effective_date: '2024-01-01'
      }
    ];

    for (const schedule of sampleSchedules) {
      await connection.execute(`
        INSERT INTO employee_schedules (id, employee_id, schedule_type, day_of_week, start_time, end_time, break_start, break_end, effective_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [schedule.id, schedule.employee_id, schedule.schedule_type, schedule.day_of_week, schedule.start_time, schedule.end_time, schedule.break_start, schedule.break_end, schedule.effective_date]);
    }
    console.log('✓ Sample schedules inserted');

    // Insert sample performance review
    const samplePerformance = {
      id: 'perf-1',
      employee_id: 'emp-1',
      review_type: 'annual',
      review_date: '2023-12-15',
      reviewer_id: 'emp-3',
      overall_rating: 4.2,
      next_review_date: '2024-06-15',
      status: 'completed',
      comments: 'Excellent performance, great safety record',
      goals: 'Complete advanced safety training, improve job documentation',
      achievements: 'Perfect attendance, excellent customer feedback',
      areas_for_improvement: 'Documentation could be more detailed'
    };

    await connection.execute(`
      INSERT INTO employee_performance (id, employee_id, review_type, review_date, reviewer_id, overall_rating, next_review_date, status, comments, goals, achievements, areas_for_improvement)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [samplePerformance.id, samplePerformance.employee_id, samplePerformance.review_type, samplePerformance.review_date, samplePerformance.reviewer_id, samplePerformance.overall_rating, samplePerformance.next_review_date, samplePerformance.status, samplePerformance.comments, samplePerformance.goals, samplePerformance.achievements, samplePerformance.areas_for_improvement]);
    console.log('✓ Sample performance review inserted');

    // Insert sample time log
    const sampleTimeLog = {
      id: 'time-1',
      employee_id: 'emp-1',
      log_date: '2024-01-15',
      clock_in: '08:00:00',
      clock_out: '17:00:00',
      break_start: '12:00:00',
      break_end: '13:00:00',
      total_hours: 8.0,
      regular_hours: 8.0,
      status: 'present'
    };

    await connection.execute(`
      INSERT INTO employee_time_logs (id, employee_id, log_date, clock_in, clock_out, break_start, break_end, total_hours, regular_hours, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [sampleTimeLog.id, sampleTimeLog.employee_id, sampleTimeLog.log_date, sampleTimeLog.clock_in, sampleTimeLog.clock_out, sampleTimeLog.break_start, sampleTimeLog.break_end, sampleTimeLog.total_hours, sampleTimeLog.regular_hours, sampleTimeLog.status]);
    console.log('✓ Sample time log inserted');

    console.log('\n🎉 All employee tables, indexes, and sample data created successfully!');
    console.log('\nTables created:');
    console.log('- employees');
    console.log('- employee_portal_credentials');
    console.log('- employee_emergency_contacts');
    console.log('- employee_documents');
    console.log('- employee_certifications');
    console.log('- employee_pay_rates');
    console.log('- employee_schedules');
    console.log('- employee_performance');
    console.log('- employee_performance_metrics');
    console.log('- employee_training');
    console.log('- employee_time_logs');
    console.log('- employee_benefits');
    console.log('- employee_incidents');
    console.log('- employee_equipment');

  } catch (error) {
    console.error('Error creating employee tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  createEmployeesTables()
    .then(() => {
      console.log('Employee migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Employee migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createEmployeesTables };
