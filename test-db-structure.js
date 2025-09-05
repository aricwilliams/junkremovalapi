const db = require('./config/database');

async function testDatabaseStructure() {
  try {
    console.log('🧪 Testing Database Structure...\n');

    // Check if businesses table exists
    console.log('1. Checking businesses table...');
    const businesses = await db.query('SELECT COUNT(*) as count FROM businesses');
    console.log('✅ Businesses table exists. Count:', businesses[0].count);

    // Check if jobs table exists
    console.log('\n2. Checking jobs table...');
    try {
      const jobs = await db.query('SELECT COUNT(*) as count FROM jobs');
      console.log('✅ Jobs table exists. Count:', jobs[0].count);
    } catch (error) {
      console.log('❌ Jobs table does not exist:', error.message);
      console.log('💡 You need to create the jobs table first.');
      return;
    }

    // Check if customers table exists
    console.log('\n3. Checking customers table...');
    try {
      const customers = await db.query('SELECT COUNT(*) as count FROM customers');
      console.log('✅ Customers table exists. Count:', customers[0].count);
    } catch (error) {
      console.log('❌ Customers table does not exist:', error.message);
    }

    // Check if employees table exists
    console.log('\n4. Checking employees table...');
    try {
      const employees = await db.query('SELECT COUNT(*) as count FROM employees');
      console.log('✅ Employees table exists. Count:', employees[0].count);
    } catch (error) {
      console.log('❌ Employees table does not exist:', error.message);
    }

    // Check if estimates table exists
    console.log('\n5. Checking estimates table...');
    try {
      const estimates = await db.query('SELECT COUNT(*) as count FROM estimates');
      console.log('✅ Estimates table exists. Count:', estimates[0].count);
    } catch (error) {
      console.log('❌ Estimates table does not exist:', error.message);
    }

    // Test a simple jobs query
    console.log('\n6. Testing simple jobs query...');
    try {
      const simpleJobs = await db.query('SELECT id, title, status FROM jobs LIMIT 5');
      console.log('✅ Simple jobs query works. Results:', simpleJobs);
    } catch (error) {
      console.log('❌ Simple jobs query failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Database structure test failed:', error.message);
  }
}

testDatabaseStructure();
