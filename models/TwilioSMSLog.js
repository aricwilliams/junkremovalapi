const mysql = require('mysql2/promise');
const config = require('../config/database');

class TwilioSMSLog {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.message_sid = data.message_sid;
    this.to_number = data.to_number;
    this.from_number = data.from_number;
    this.body = data.body;
    this.status = data.status;
    this.direction = data.direction;
    this.price = data.price;
    this.price_unit = data.price_unit;
    this.error_code = data.error_code;
    this.error_message = data.error_message;
    this.date_sent = data.date_sent;
    this.date_created = data.date_created;
    this.date_updated = data.date_updated;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new SMS log entry
   */
  static async create(data) {
    try {
      const connection = await mysql.createConnection(config);
      
      const query = `
        INSERT INTO twilio_sms_logs (
          user_id, message_sid, to_number, from_number, body, 
          status, direction, price, price_unit, error_code, 
          error_message, date_sent, date_created, date_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        data.user_id,
        data.message_sid,
        data.to_number,
        data.from_number,
        data.body,
        data.status,
        data.direction,
        data.price,
        data.price_unit,
        data.error_code || null,
        data.error_message || null,
        data.date_sent,
        data.date_created || new Date(),
        data.date_updated || new Date()
      ];
      
      const [result] = await connection.execute(query, values);
      await connection.end();
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating SMS log:', error);
      throw error;
    }
  }

  /**
   * Find SMS log by message SID
   */
  static async findByMessageSid(messageSid) {
    try {
      const connection = await mysql.createConnection(config);
      
      const query = 'SELECT * FROM twilio_sms_logs WHERE message_sid = ?';
      const [rows] = await connection.execute(query, [messageSid]);
      await connection.end();
      
      return rows.length > 0 ? new TwilioSMSLog(rows[0]) : null;
    } catch (error) {
      console.error('Error finding SMS log by SID:', error);
      throw error;
    }
  }

  /**
   * Find SMS logs by user ID
   */
  static async findByUserId(userId, options = {}) {
    try {
      const connection = await mysql.createConnection(config);
      
      let query = 'SELECT * FROM twilio_sms_logs WHERE user_id = ?';
      const values = [userId];
      
      // Add filters
      if (options.phone_number) {
        query += ' AND (to_number = ? OR from_number = ?)';
        values.push(options.phone_number, options.phone_number);
      }
      
      if (options.status) {
        query += ' AND status = ?';
        values.push(options.status);
      }
      
      if (options.direction) {
        query += ' AND direction = ?';
        values.push(options.direction);
      }
      
      if (options.start_date && options.end_date) {
        query += ' AND date_sent BETWEEN ? AND ?';
        values.push(options.start_date, options.end_date);
      }
      
      // Add ordering and pagination
      query += ' ORDER BY date_sent DESC';
      
      if (options.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(options.limit));
        
        if (options.offset) {
          query += ' OFFSET ?';
          values.push(parseInt(options.offset));
        }
      }
      
      const [rows] = await connection.execute(query, values);
      await connection.end();
      
      return rows.map(row => new TwilioSMSLog(row));
    } catch (error) {
      console.error('Error finding SMS logs by user ID:', error);
      throw error;
    }
  }

  /**
   * Update SMS log status
   */
  static async updateStatus(messageSid, status, errorCode = null, errorMessage = null) {
    try {
      const connection = await mysql.createConnection(config);
      
      const query = `
        UPDATE twilio_sms_logs 
        SET status = ?, error_code = ?, error_message = ?, updated_at = NOW()
        WHERE message_sid = ?
      `;
      
      const [result] = await connection.execute(query, [
        status,
        errorCode,
        errorMessage,
        messageSid
      ]);
      
      await connection.end();
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating SMS log status:', error);
      throw error;
    }
  }

  /**
   * Get SMS statistics for user
   */
  static async getSMSStats(userId, options = {}) {
    try {
      const connection = await mysql.createConnection(config);
      
      let query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_count,
          COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_count,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
          COALESCE(SUM(price), 0) as total_cost,
          AVG(CASE WHEN price IS NOT NULL THEN price END) as avg_cost_per_message
        FROM twilio_sms_logs 
        WHERE user_id = ?
      `;
      
      const values = [userId];
      
      if (options.start_date && options.end_date) {
        query += ' AND date_sent BETWEEN ? AND ?';
        values.push(options.start_date, options.end_date);
      }
      
      const [rows] = await connection.execute(query, values);
      await connection.end();
      
      return rows[0];
    } catch (error) {
      console.error('Error getting SMS stats:', error);
      throw error;
    }
  }

  /**
   * Get recent SMS conversations
   */
  static async getConversations(userId, limit = 20) {
    try {
      const connection = await mysql.createConnection(config);
      
      const query = `
        SELECT 
          to_number,
          from_number,
          MAX(date_sent) as last_message_date,
          COUNT(*) as message_count,
          MAX(body) as last_message_preview
        FROM twilio_sms_logs 
        WHERE user_id = ? 
        GROUP BY to_number, from_number
        ORDER BY last_message_date DESC
        LIMIT ?
      `;
      
      const [rows] = await connection.execute(query, [userId, limit]);
      await connection.end();
      
      return rows;
    } catch (error) {
      console.error('Error getting SMS conversations:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      message_sid: this.message_sid,
      to_number: this.to_number,
      from_number: this.from_number,
      body: this.body,
      status: this.status,
      direction: this.direction,
      price: this.price,
      price_unit: this.price_unit,
      error_code: this.error_code,
      error_message: this.error_message,
      date_sent: this.date_sent,
      date_created: this.date_created,
      date_updated: this.date_updated,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = TwilioSMSLog;
