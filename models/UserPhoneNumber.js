const database = require('../config/database');

class UserPhoneNumber {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.phone_number = data.phone_number;
    this.twilio_sid = data.twilio_sid;
    this.friendly_name = data.friendly_name;
    this.country = data.country;
    this.region = data.region;
    this.locality = data.locality;
    this.is_active = data.is_active;
    this.purchase_price = data.purchase_price;
    this.purchase_price_unit = data.purchase_price_unit;
    this.monthly_cost = data.monthly_cost;
    this.capabilities = data.capabilities;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(data) {
    try {
      const sql = `
        INSERT INTO user_phone_numbers (
          user_id, phone_number, twilio_sid, friendly_name, country, 
          region, locality, is_active, purchase_price, purchase_price_unit, 
          monthly_cost, capabilities
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        data.user_id,
        data.phone_number,
        data.twilio_sid,
        data.friendly_name,
        data.country || 'US',
        data.region,
        data.locality,
        data.is_active !== undefined ? data.is_active : true,
        data.purchase_price,
        data.purchase_price_unit || 'USD',
        data.monthly_cost || 1.00,
        data.capabilities ? JSON.stringify(data.capabilities) : null
      ];

      const result = await database.query(sql, params);
      return result.insertId;
    } catch (error) {
      console.error('Error creating user phone number:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const sql = 'SELECT * FROM user_phone_numbers WHERE id = ?';
      const results = await database.query(sql, [id]);
      return results.length > 0 ? new UserPhoneNumber(results[0]) : null;
    } catch (error) {
      console.error('Error finding phone number by ID:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const sql = 'SELECT * FROM user_phone_numbers WHERE user_id = ? ORDER BY created_at DESC';
      const results = await database.query(sql, [userId]);
      return results.map(row => new UserPhoneNumber(row));
    } catch (error) {
      console.error('Error finding phone numbers by user ID:', error);
      throw error;
    }
  }

  static async findActiveByUserId(userId) {
    try {
      const sql = 'SELECT * FROM user_phone_numbers WHERE user_id = ? AND is_active = true ORDER BY created_at DESC';
      const results = await database.query(sql, [userId]);
      return results.map(row => new UserPhoneNumber(row));
    } catch (error) {
      console.error('Error finding active phone numbers by user ID:', error);
      throw error;
    }
  }

  static async findByPhoneNumber(phoneNumber) {
    try {
      const sql = 'SELECT * FROM user_phone_numbers WHERE phone_number = ?';
      const results = await database.query(sql, [phoneNumber]);
      return results.length > 0 ? new UserPhoneNumber(results[0]) : null;
    } catch (error) {
      console.error('Error finding phone number by number:', error);
      throw error;
    }
  }

  static async findByTwilioSid(twilioSid) {
    try {
      const sql = 'SELECT * FROM user_phone_numbers WHERE twilio_sid = ?';
      const results = await database.query(sql, [twilioSid]);
      return results.length > 0 ? new UserPhoneNumber(results[0]) : null;
    } catch (error) {
      console.error('Error finding phone number by Twilio SID:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          if (key === 'capabilities' && data[key]) {
            values.push(JSON.stringify(data[key]));
          } else {
            values.push(data[key]);
          }
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const sql = `UPDATE user_phone_numbers SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await database.query(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating phone number:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const sql = 'DELETE FROM user_phone_numbers WHERE id = ?';
      const result = await database.query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting phone number:', error);
      throw error;
    }
  }

  static async getUserPhoneNumberStats(userId) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_numbers,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_numbers,
          SUM(monthly_cost) as total_monthly_cost,
          SUM(purchase_price) as total_purchase_cost
        FROM user_phone_numbers 
        WHERE user_id = ?
      `;
      const results = await database.query(sql, [userId]);
      return results[0];
    } catch (error) {
      console.error('Error getting phone number stats:', error);
      throw error;
    }
  }

  // Instance methods
  async update(data) {
    return await UserPhoneNumber.update(this.id, data);
  }

  async delete() {
    return await UserPhoneNumber.delete(this.id);
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      phone_number: this.phone_number,
      twilio_sid: this.twilio_sid,
      friendly_name: this.friendly_name,
      country: this.country,
      region: this.region,
      locality: this.locality,
      is_active: this.is_active,
      purchase_price: this.purchase_price,
      purchase_price_unit: this.purchase_price_unit,
      monthly_cost: this.monthly_cost,
      capabilities: this.capabilities ? JSON.parse(this.capabilities) : null,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = UserPhoneNumber;
