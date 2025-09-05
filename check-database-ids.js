const db = require('./config/database');

async function checkDatabaseIds() {
  try {
    console.log('🔍 Checking Database IDs for Sample Jobs...\n');

    // Check businesses
    console.log('1. Available Businesses:');
    const businesses = await db.query('SELECT id, business_name, owner_email FROM businesses');
    console.table(businesses);

    // Check customers
    console.log('\n2. Available Customers:');
    const customers = await db.query('SELECT id, name, email FROM customers');
    console.table(customers);

    // Check employees
    console.log('\n3. Available Employees:');
    const employees = await db.query('SELECT id, first_name, last_name, email FROM employees');
    console.table(employees);

    // Check estimates
    console.log('\n4. Available Estimates:');
    const estimates = await db.query('SELECT id, title, amount, status FROM estimates');
    console.table(estimates);

    console.log('\n💡 Use these IDs in the SQL INSERT statements!');

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkDatabaseIds();
