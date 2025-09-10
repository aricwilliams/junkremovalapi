const database = require('../config/database');

class TwilioCallLog {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.phone_number_id = data.phone_number_id;
    this.call_sid = data.call_sid;
    this.from_number = data.from_number;
    this.to_number = data.to_number;
    this.status = data.status;
    this.direction = data.direction;
    this.price = data.price;
    this.price_unit = data.price_unit;
    this.recording_url = data.recording_url;
    this.recording_sid = data.recording_sid;
    this.recording_duration = data.recording_duration;
    this.recording_channels = data.recording_channels;
    this.recording_status = data.recording_status;
    this.duration = data.duration;
    this.start_time = data.start_time;
    this.end_time = data.end_time;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(data) {
    try {
      const sql = `
        INSERT INTO twilio_call_logs (
          user_id, phone_number_id, call_sid, from_number, to_number,
          status, direction, price, price_unit, recording_url, recording_sid,
          recording_duration, recording_channels, recording_status, duration,
          start_time, end_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        data.user_id,
        data.phone_number_id,
        data.call_sid,
        data.from_number,
        data.to_number,
        data.status,
        data.direction,
        data.price,
        data.price_unit,
        data.recording_url,
        data.recording_sid,
        data.recording_duration,
        data.recording_channels,
        data.recording_status,
        data.duration || 0,
        data.start_time,
        data.end_time
      ];

      const result = await database.query(sql, params);
      return result.insertId;
    } catch (error) {
      console.error('Error creating call log:', error);
      throw error;
    }
  }

  static async findByCallSid(callSid) {
    try {
      const sql = 'SELECT * FROM twilio_call_logs WHERE call_sid = ?';
      const results = await database.query(sql, [callSid]);
      return results.length > 0 ? new TwilioCallLog(results[0]) : null;
    } catch (error) {
      console.error('Error finding call log by SID:', error);
      throw error;
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      let sql = 'SELECT * FROM twilio_call_logs WHERE user_id = ?';
      const params = [userId];

      if (options.phone_number_id) {
        sql += ' AND phone_number_id = ?';
        params.push(options.phone_number_id);
      }

      if (options.status) {
        sql += ' AND status = ?';
        params.push(options.status);
      }

      if (options.direction) {
        sql += ' AND direction = ?';
        params.push(options.direction);
      }

      if (options.start_date && options.end_date) {
        sql += ' AND created_at BETWEEN ? AND ?';
        params.push(options.start_date, options.end_date);
      }

      sql += ' ORDER BY created_at DESC';

      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }

      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }

      const results = await database.query(sql, params);
      return results.map(row => new TwilioCallLog(row));
    } catch (error) {
      console.error('Error finding call logs by user ID:', error);
      throw error;
    }
  }

  static async update(callSid, data) {
    try {
      const fields = [];
      const values = [];

      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(callSid);
      const sql = `UPDATE twilio_call_logs SET ${fields.join(', ')} WHERE call_sid = ?`;
      
      const result = await database.query(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating call log:', error);
      throw error;
    }
  }

  static async getCallStats(userId, options = {}) {
    try {
      let sql = `
        SELECT 
          COUNT(*) as total_calls,
          SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) as inbound_calls,
          SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) as outbound_calls,
          SUM(duration) as total_duration,
          SUM(price) as total_cost,
          AVG(duration) as avg_duration,
          AVG(price) as avg_cost
        FROM twilio_call_logs 
        WHERE user_id = ?
      `;
      const params = [userId];

      if (options.phone_number_id) {
        sql += ' AND phone_number_id = ?';
        params.push(options.phone_number_id);
      }

      if (options.start_date && options.end_date) {
        sql += ' AND created_at BETWEEN ? AND ?';
        params.push(options.start_date, options.end_date);
      }

      const results = await database.query(sql, params);
      return results[0];
    } catch (error) {
      console.error('Error getting call stats:', error);
      throw error;
    }
  }

  static async getRecentCalls(userId, limit = 10) {
    try {
      const sql = `
        SELECT 
          tcl.*,
          upn.phone_number as phone_number_display,
          upn.friendly_name as phone_name
        FROM twilio_call_logs tcl
        LEFT JOIN user_phone_numbers upn ON tcl.phone_number_id = upn.id
        WHERE tcl.user_id = ?
        ORDER BY tcl.created_at DESC
        LIMIT ?
      `;
      const results = await database.query(sql, [userId, limit]);
      return results.map(row => new TwilioCallLog(row));
    } catch (error) {
      console.error('Error getting recent calls:', error);
      throw error;
    }
  }

  // Instance methods
  async update(data) {
    return await TwilioCallLog.update(this.call_sid, data);
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      phone_number_id: this.phone_number_id,
      call_sid: this.call_sid,
      from_number: this.from_number,
      to_number: this.to_number,
      status: this.status,
      direction: this.direction,
      price: this.price,
      price_unit: this.price_unit,
      recording_url: this.recording_url,
      recording_sid: this.recording_sid,
      recording_duration: this.recording_duration,
      recording_channels: this.recording_channels,
      recording_status: this.recording_status,
      duration: this.duration,
      start_time: this.start_time,
      end_time: this.end_time,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = TwilioCallLog;
