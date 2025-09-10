const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
  constructor() {
    console.log('🔌 Initializing database connection...');
    console.log('📊 Database Config:', {
      host: process.env.DB_HOST || 'switchyard.proxy.rlwy.net',
      port: process.env.DB_PORT || 20553,
      user: process.env.DB_USERNAME || 'root',
      database: process.env.DB_DATABASE || 'junkremoval',
      password: process.env.DB_PASSWORD ? '***' : 'NOT_SET'
    });
    
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'switchyard.proxy.rlwy.net',
      port: Number(process.env.DB_PORT) || 20553,
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'mmmGPUfMVK...',
      database: process.env.DB_DATABASE || 'junkremoval',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: { 
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    });
    
    // Test connection on initialization
    this.testConnection();
  }

  async query(sql, params = []) {
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getConnection() {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('Failed to get DB connection:', error);
      throw error;
    }
  }

  // For backward compatibility with existing code
  async execute(sql, params = []) {
    return this.query(sql, params);
  }
  
  // Test database connection
  async testConnection() {
    try {
      console.log('🧪 Testing database connection...');
      const connection = await this.pool.getConnection();
      console.log('✅ Database connection successful!');
      connection.release();
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('🔍 Error details:', {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Connection refused. Check if:');
        console.log('   1. MySQL server is running');
        console.log('   2. Host and port are correct');
        console.log('   3. Firewall allows connections');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('💡 Access denied. Check:');
        console.log('   1. Username and password');
        console.log('   2. User permissions');
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        console.log('💡 Database does not exist. Create it first:');
        console.log(`   CREATE DATABASE ${process.env.DB_DATABASE || 'junkremoval'};`);
      }
      
      return false;
    }
  }
}

module.exports = new Database();
