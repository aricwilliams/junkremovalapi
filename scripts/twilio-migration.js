const database = require('../config/database');

async function createTwilioTables() {
  try {
    console.log('🚀 Starting Twilio database migration...');

    // Create user_phone_numbers table
    const createPhoneNumbersTable = `
      CREATE TABLE IF NOT EXISTS user_phone_numbers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        twilio_sid VARCHAR(100) NOT NULL,
        friendly_name VARCHAR(100),
        country VARCHAR(10) DEFAULT 'US',
        region VARCHAR(100),
        locality VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        purchase_price DECIMAL(10,4),
        purchase_price_unit VARCHAR(10) DEFAULT 'USD',
        monthly_cost DECIMAL(10,4) DEFAULT 1.00,
        capabilities JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_phone_number (phone_number),
        INDEX idx_twilio_sid (twilio_sid),
        UNIQUE KEY unique_phone_number (phone_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await database.query(createPhoneNumbersTable);
    console.log('✅ Created user_phone_numbers table');

    // Create twilio_call_logs table
    const createCallLogsTable = `
      CREATE TABLE IF NOT EXISTS twilio_call_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        phone_number_id INT,
        call_sid VARCHAR(100) NOT NULL,
        from_number VARCHAR(20),
        to_number VARCHAR(20),
        status VARCHAR(50),
        direction VARCHAR(20),
        price DECIMAL(10,4),
        price_unit VARCHAR(10),
        recording_url TEXT,
        recording_sid VARCHAR(100),
        recording_duration INT,
        recording_channels INT,
        recording_status VARCHAR(50),
        duration INT DEFAULT 0,
        start_time TIMESTAMP NULL,
        end_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_phone_number_id (phone_number_id),
        INDEX idx_call_sid (call_sid),
        INDEX idx_from_number (from_number),
        INDEX idx_to_number (to_number),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        UNIQUE KEY unique_call_sid (call_sid)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await database.query(createCallLogsTable);
    console.log('✅ Created twilio_call_logs table');

    // Create call_forwarding table
    const createCallForwardingTable = `
      CREATE TABLE IF NOT EXISTS call_forwarding (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        phone_number_id INT NOT NULL,
        forward_to_number VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        forwarding_type ENUM('always', 'busy', 'no_answer', 'unavailable') DEFAULT 'always',
        ring_timeout INT DEFAULT 20,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_phone_number_id (phone_number_id),
        INDEX idx_is_active (is_active),
        FOREIGN KEY (phone_number_id) REFERENCES user_phone_numbers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await database.query(createCallForwardingTable);
    console.log('✅ Created call_forwarding table');

    console.log('🎉 Twilio database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during Twilio migration:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createTwilioTables()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createTwilioTables };
