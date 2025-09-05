const db = require('./config/database');

async function checkUserBusiness() {
  try {
    console.log('🔍 Checking User Business Association...\n');

    // Check all businesses
    console.log('1. All Businesses:');
    const businesses = await db.query('SELECT id, business_name, owner_email, username FROM businesses');
    console.table(businesses);

    // Check all jobs and their business associations
    console.log('\n2. All Jobs with Business Info:');
    const jobs = await db.query(`
      SELECT 
        j.id, j.title, j.business_id, j.status, j.total_cost,
        b.business_name, b.owner_email
      FROM jobs j
      LEFT JOIN businesses b ON j.business_id = b.id
      ORDER BY j.id
    `);
    console.table(jobs);

    // Check which business the test user belongs to
    console.log('\n3. Test User Business:');
    const testUser = await db.query(`
      SELECT id, business_name, owner_email, username 
      FROM businesses 
      WHERE username = 'testuser123'
    `);
    console.table(testUser);

    if (testUser.length > 0) {
      console.log(`\n💡 Test user 'testuser123' belongs to business_id: ${testUser[0].id}`);
      
      // Check jobs for this business
      console.log('\n4. Jobs for Test User Business:');
      const userJobs = await db.query(`
        SELECT 
          j.id, j.title, j.status, j.total_cost,
          c.name as customer_name
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        WHERE j.business_id = ?
        ORDER BY j.id
      `, [testUser[0].id]);
      console.table(userJobs);
    }

  } catch (error) {
    console.error('❌ Error checking user business:', error.message);
  }
}

checkUserBusiness();
