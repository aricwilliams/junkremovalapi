const db = require('./config/database');

async function addSampleJobs() {
  try {
    console.log('🚀 Adding Sample Jobs to Database...\n');

    // Job 1: Residential Cleanout
    console.log('1. Adding Job 1: Residential Cleanout...');
    const job1 = await db.query(`
      INSERT INTO jobs (
        business_id, customer_id, estimate_id, assigned_employee_id, 
        title, description, scheduled_date, completion_date, status, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, null, null, null,
      'Residential Cleanout - Main Street',
      'Remove old furniture, appliances, and general household items from 3-bedroom house',
      '2024-01-15 09:00:00', null, 'scheduled', 350.00
    ]);
    console.log('✅ Job 1 created with ID:', job1.insertId);

    // Job 2: Office Cleanout
    console.log('2. Adding Job 2: Office Cleanout...');
    const job2 = await db.query(`
      INSERT INTO jobs (
        business_id, customer_id, estimate_id, assigned_employee_id, 
        title, description, scheduled_date, completion_date, status, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, null, null, null,
      'Office Cleanout - Downtown Building',
      'Remove office furniture, computers, and equipment from closed business',
      '2024-01-18 14:00:00', null, 'scheduled', 750.00
    ]);
    console.log('✅ Job 2 created with ID:', job2.insertId);

    // Job 3: Garage Cleanout
    console.log('3. Adding Job 3: Garage Cleanout...');
    const job3 = await db.query(`
      INSERT INTO jobs (
        business_id, customer_id, estimate_id, assigned_employee_id, 
        title, description, scheduled_date, completion_date, status, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, null, null, null,
      'Garage Cleanout - Suburban Home',
      'Remove old tools, equipment, and storage items from 2-car garage',
      '2024-01-20 10:00:00', null, 'scheduled', 200.00
    ]);
    console.log('✅ Job 3 created with ID:', job3.insertId);

    // Add status history for all jobs
    console.log('\n4. Adding status history...');
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
    console.log('\n5. Adding job items...');
    
    // Items for Job 1
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job1.insertId, 'Sofa', 'furniture', 1, 50.00, 'medium', 30]);
    
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job1.insertId, 'Refrigerator', 'appliances', 1, 75.00, 'hard', 45]);

    // Items for Job 2
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job2.insertId, 'Office Desk', 'furniture', 3, 60.00, 'medium', 35]);
    
    await db.query(`
      INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [job2.insertId, 'Computer Monitors', 'electronics', 5, 25.00, 'easy', 15]);

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
    console.log('\n6. Adding job notes...');
    
    // Notes for Job 1
    await db.query(`
      INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job1.insertId, null, 'general', 'Customer requested early morning pickup', false]);
    
    await db.query(`
      INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job1.insertId, null, 'customer_communication', 'Confirmed pickup time with customer', false]);

    // Notes for Job 2
    await db.query(`
      INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job2.insertId, null, 'internal', 'Building has elevator access', true]);

    // Notes for Job 3
    await db.query(`
      INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [job3.insertId, null, 'general', 'Garage is accessible from alley', false]);
    console.log('✅ Job notes added');

    console.log('\n🎉 Sample jobs added successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Job 1 (Residential): ID ${job1.insertId}, $350.00`);
    console.log(`- Job 2 (Office): ID ${job2.insertId}, $750.00`);
    console.log(`- Job 3 (Garage): ID ${job3.insertId}, $200.00`);

    // Verify the data
    console.log('\n🔍 Verifying data...');
    const jobs = await db.query(`
      SELECT id, title, status, scheduled_date, total_cost 
      FROM jobs 
      WHERE business_id = 1 
      ORDER BY id
    `);
    console.table(jobs);

  } catch (error) {
    console.error('❌ Error adding sample jobs:', error.message);
  }
}

addSampleJobs();
