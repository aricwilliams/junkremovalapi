const db = require('./config/database');

async function debugJobsQuery() {
  try {
    console.log('🧪 Debugging Jobs Query...\n');

    // Test 1: Simple jobs query without joins
    console.log('1. Testing simple jobs query...');
    const simpleJobs = await db.query('SELECT * FROM jobs LIMIT 5');
    console.log('✅ Simple jobs query works. Count:', simpleJobs.length);

    // Test 2: Jobs query with business_id filter
    console.log('\n2. Testing jobs query with business_id filter...');
    const businessJobs = await db.query('SELECT * FROM jobs WHERE business_id = ? LIMIT 5', [1]);
    console.log('✅ Business jobs query works. Count:', businessJobs.length);

    // Test 3: Jobs query with LEFT JOINs
    console.log('\n3. Testing jobs query with LEFT JOINs...');
    const joinJobs = await db.query(`
      SELECT 
        j.*,
        c.name as customer_name,
        c.email as customer_email,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        est.title as estimate_title
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN employees e ON j.assigned_employee_id = e.id
      LEFT JOIN estimates est ON j.estimate_id = est.id
      WHERE j.business_id = ?
      LIMIT 5
    `, [1]);
    console.log('✅ JOIN jobs query works. Count:', joinJobs.length);

    // Test 4: Jobs query with ORDER BY
    console.log('\n4. Testing jobs query with ORDER BY...');
    const orderJobs = await db.query(`
      SELECT 
        j.*,
        c.name as customer_name,
        c.email as customer_email,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        est.title as estimate_title
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN employees e ON j.assigned_employee_id = e.id
      LEFT JOIN estimates est ON j.estimate_id = est.id
      WHERE j.business_id = ?
      ORDER BY j.scheduled_date DESC
      LIMIT 5
    `, [1]);
    console.log('✅ ORDER BY jobs query works. Count:', orderJobs.length);

    // Test 5: Jobs query with LIMIT and OFFSET
    console.log('\n5. Testing jobs query with LIMIT and OFFSET...');
    const paginationJobs = await db.query(`
      SELECT 
        j.*,
        c.name as customer_name,
        c.email as customer_email,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        est.title as estimate_title
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN employees e ON j.assigned_employee_id = e.id
      LEFT JOIN estimates est ON j.estimate_id = est.id
      WHERE j.business_id = ?
      ORDER BY j.scheduled_date DESC
      LIMIT ? OFFSET ?
    `, [1, 20, 0]);
    console.log('✅ Pagination jobs query works. Count:', paginationJobs.length);

    console.log('\n✅ All queries work! The issue might be in the parameter handling.');

  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Error details:', error);
  }
}

debugJobsQuery();
