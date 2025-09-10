const mysql = require('mysql2/promise');
const config = require('../config/config');

async function createSMSLogsTable() {
  let connection;
  
  try {
    console.log('🔧 Creating SMS logs table...');
    
    connection = await mysql.createConnection(config.database);
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS twilio_sms_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message_sid VARCHAR(255) NOT NULL UNIQUE,
        to_number VARCHAR(20) NOT NULL,
        from_number VARCHAR(20) NOT NULL,
        body TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'queued',
        direction ENUM('inbound', 'outbound') NOT NULL,
        price DECIMAL(10, 4) NULL,
        price_unit VARCHAR(10) DEFAULT 'USD',
        error_code VARCHAR(50) NULL,
        error_message TEXT NULL,
        date_sent DATETIME NULL,
        date_created DATETIME NULL,
        date_updated DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_message_sid (message_sid),
        INDEX idx_to_number (to_number),
        INDEX idx_from_number (from_number),
        INDEX idx_status (status),
        INDEX idx_direction (direction),
        INDEX idx_date_sent (date_sent),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ SMS logs table created successfully');
    
    // Create indexes for better performance
    console.log('🔧 Creating additional indexes...');
    
    const indexes = [
      'CREATE INDEX idx_user_date ON twilio_sms_logs (user_id, date_sent)',
      'CREATE INDEX idx_user_status ON twilio_sms_logs (user_id, status)',
      'CREATE INDEX idx_user_direction ON twilio_sms_logs (user_id, direction)',
      'CREATE INDEX idx_phone_conversation ON twilio_sms_logs (to_number, from_number, date_sent)'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await connection.execute(indexQuery);
        console.log('✅ Index created');
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('ℹ️ Index already exists, skipping');
        } else {
          console.error('❌ Error creating index:', error.message);
        }
      }
    }
    
    console.log('🎉 SMS migration completed successfully!');
    
  } catch (error) {
    console.error('❌ SMS migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  createSMSLogsTable()
    .then(() => {
      console.log('✅ SMS migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ SMS migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createSMSLogsTable };
