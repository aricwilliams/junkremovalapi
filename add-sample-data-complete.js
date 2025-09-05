const db = require('./config/database');

async function addSampleData() {
  try {
    console.log('🚀 Adding Complete Sample Data...\n');

    // First, add some customers
    console.log('1. Adding customers...');
    const customer1 = await db.query(`
      INSERT INTO customers (
        business_id, name, email, phone, address, city, state, zip_code, 
        customer_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 'John Smith', 'john.smith@email.com', '15551234567', 
      '123 Main Street', 'Wilmington', 'NC', '28401', 'residential', 'new'
    ]);
    console.log('✅ Customer 1 created with ID:', customer1.insertId);

    const customer2 = await db.query(`
      INSERT INTO customers (
        business_id, name, email, phone, address, city, state, zip_code, 
        customer_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 'ABC Office Solutions', 'contact@abcoffice.com', '15559876543', 
      '456 Business Blvd', 'Wilmington', 'NC', '28402', 'commercial', 'new'
    ]);
    console.log('✅ Customer 2 created with ID:', customer2.insertId);

    const customer3 = await db.query(`
      INSERT INTO customers (
        business_id, name, email, phone, address, city, state, zip_code, 
        customer_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 'Sarah Johnson', 'sarah.johnson@email.com', '15555555555', 
      '789 Oak Avenue', 'Wilmington', 'NC', '28403', 'residential', 'new'
    ]);
    console.log('✅ Customer 3 created with ID:', customer3.insertId);

    // Add some employees
    console.log('\n2. Adding employees...');
    const employee1 = await db.query(`
      INSERT INTO employees (
        business_id, first_name, last_name, email, phone, job_title, 
        employee_type, position, status, hire_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 'Mike', 'Johnson', 'mike.johnson@company.com', '15551111111', 
      'Lead Driver', 'regular', 'driver', 'active', '2024-01-01'
    ]);
    console.log('✅ Employee 1 created with ID:', employee1.insertId);

    const employee2 = await db.query(`
      INSERT INTO employees (
        business_id, first_name, last_name, email, phone, job_title, 
        employee_type, position, status, hire_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 'Lisa', 'Williams', 'lisa.williams@company.com', '15552222222', 
      'Helper', 'regular', 'helper', 'active', '2024-01-01'
    ]);
    console.log('✅ Employee 2 created with ID:', employee2.insertId);

    // Add some estimates
    console.log('\n3. Adding estimates...');
    const estimate1 = await db.query(`
      INSERT INTO estimates (
        business_id, customer_id, title, amount, status, sent_date, expiry_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, customer1.insertId, 'Residential Cleanout Estimate', 350.00, 'accepted',
      '2024-01-10 10:00:00', '2024-01-25 10:00:00', 'Standard residential cleanout'
    ]);
    console.log('✅ Estimate 1 created with ID:', estimate1.insertId);

    const estimate2 = await db.query(`
      INSERT INTO estimates (
        business_id, customer_id, title, amount, status, sent_date, expiry_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, customer2.insertId, 'Office Cleanout Estimate', 750.00, 'accepted',
      '2024-01-12 14:00:00', '2024-01-27 14:00:00', 'Large office cleanout with electronics'
    ]);
    console.log('✅ Estimate 2 created with ID:', estimate2.insertId);

    // Now add the jobs
    console.log('\n4. Adding jobs...');
    
    // Job 1: Residential Cleanout
    const job1 = await db.query(`
      INSERT INTO jobs (
        business_id, customer_id, estimate_id, assigned_employee_id, 
        title, description, scheduled_date, completion_date, status, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, customer1.insertId, estimate1.insertId, employee1.insertId,
      'Residential Cleanout - Main Street',
      'Remove old furniture, appliances, and general household items from 3-bedroom house',
      '2024-01-15 09:00:00', null, 'scheduled', 350.00
    ]);
    console.log('✅ Job 1 created with ID:', job1.insertId);

    // Job 2: Office Cleanout
    const job2 = await db.query(`
      INSERT INTO jobs (
        business_id, customer_id, estimate_id, assigned_employee_id, 
        title, description, scheduled_date, completion_date, status, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, customer2.insertId, estimate2.insertId, employee2.insertId,
      'Office Cleanout - Downtown Building',
      'Remove office furniture, computers, and equipment from closed business',
      '2024-01-18 14:00:00', null, 'scheduled', 750.00
    ]);
    console.log('✅ Job 2 created with ID:', job2.insertId);

    // Job 3: Garage Cleanout
    const job3 = await db.query(`
      INSERT INTO jobs (
        business_id, customer_id, estimate_id, assigned_employee_id, 
        title, description, scheduled_date, completion_date, status, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, customer3.insertId, null, employee1.insertId,
      'Garage Cleanout - Suburban Home',
      'Remove old tools, equipment, and storage items from 2-car garage',
      '2024-01-20 10:00:00', null, 'scheduled', 200.00
    ]);
    console.log('✅ Job 3 created with ID:', job3.insertId);

    // Add status history
    console.log('\n5. Adding status history...');
    await db.query(`
      INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, notes, changed_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job1.insertId, null, 'scheduled', 1, 'Job created']);

    await db.query(`
      INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, notes, changed_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job2.insertId, null, 'scheduled', 1, 'Job created']);

    await db.query(`
      INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, notes, changed_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job3.insertId, null, 'scheduled', 1, 'Job created']);
    console.log('✅ Status history added');

    // Add job items
    console.log('\n6. Adding job items...');
    
    // Items for Job 1
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job1.insertId, 'Sofa', 'furniture', 1, 50.00, 'medium', 30]);
    
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job1.insertId, 'Refrigerator', 'appliances', 1, 75.00, 'hard', 45]);

    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job1.insertId, 'Dining Table', 'furniture', 1, 40.00, 'medium', 25]);

    // Items for Job 2
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job2.insertId, 'Office Desk', 'furniture', 3, 60.00, 'medium', 35]);
    
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job2.insertId, 'Computer Monitors', 'electronics', 5, 25.00, 'easy', 15]);

    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job2.insertId, 'Filing Cabinets', 'furniture', 2, 45.00, 'medium', 30]);

    // Items for Job 3
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job3.insertId, 'Old Tools', 'miscellaneous', 1, 30.00, 'easy', 20]);
    
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job3.insertId, 'Storage Boxes', 'miscellaneous', 10, 5.00, 'easy', 10]);
    console.log('✅ Job items added');

    // Add job notes
    console.log('\n7. Adding job notes...');
    
    // Notes for Job 1
    await db.query(`
      INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job1.insertId, employee1.insertId, 'general', 'Customer requested early morning pickup', false]);
    
    await db.query(`
      INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job1.insertId, employee1.insertId, 'customer_communication', 'Confirmed pickup time with customer', false]);

    // Notes for Job 2
    await db.query(`
      INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job2.insertId, employee2.insertId, 'internal', 'Building has elevator access', true]);

    await db.query(`
      INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job2.insertId, employee2.insertId, 'customer_communication', 'Office manager will be on-site during pickup', false]);

    // Notes for Job 3
    await db.query(`
      INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job3.insertId, employee1.insertId, 'general', 'Garage is accessible from alley', false]);
    console.log('✅ Job notes added');

    console.log('\n🎉 Complete sample data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`- 3 Customers created`);
    console.log(`- 2 Employees created`);
    console.log(`- 2 Estimates created`);
    console.log(`- 3 Jobs created:`);
    console.log(`  * Job 1 (Residential): ID ${job1.insertId}, $350.00`);
    console.log(`  * Job 2 (Office): ID ${job2.insertId}, $750.00`);
    console.log(`  * Job 3 (Garage): ID ${job3.insertId}, $200.00`);

    // Verify the data
    console.log('\n🔍 Verifying jobs data...');
    const jobs = await db.query(`
      SELECT 
        j.id, j.title, j.status, j.scheduled_date, j.total_cost,
        c.name as customer_name,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN employees e ON j.assigned_employee_id = e.id
      WHERE j.business_id = 1 
      ORDER BY j.id
    `);
    console.table(jobs);

  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  }
}

addSampleData();
