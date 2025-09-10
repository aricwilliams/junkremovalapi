const database = require('../config/database');

class CallForwarding {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.phone_number_id = data.phone_number_id;
    this.forward_to_number = data.forward_to_number;
    this.is_active = data.is_active;
    this.forwarding_type = data.forwarding_type;
    this.ring_timeout = data.ring_timeout;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(data) {
    try {
      const sql = `
        INSERT INTO call_forwarding (
          user_id, phone_number_id, forward_to_number, is_active,
          forwarding_type, ring_timeout
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        data.user_id,
        data.phone_number_id,
        data.forward_to_number,
        data.is_active !== undefined ? data.is_active : true,
        data.forwarding_type || 'always',
        data.ring_timeout || 20
      ];

      const result = await database.query(sql, params);
      return result.insertId;
    } catch (error) {
      console.error('Error creating call forwarding:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const sql = 'SELECT * FROM call_forwarding WHERE id = ?';
      const results = await database.query(sql, [id]);
      return results.length > 0 ? new CallForwarding(results[0]) : null;
    } catch (error) {
      console.error('Error finding call forwarding by ID:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const sql = `
        SELECT 
          cf.*,
          upn.phone_number,
          upn.friendly_name
        FROM call_forwarding cf
        JOIN user_phone_numbers upn ON cf.phone_number_id = upn.id
        WHERE cf.user_id = ?
        ORDER BY cf.created_at DESC
      `;
      const results = await database.query(sql, [userId]);
      return results.map(row => new CallForwarding(row));
    } catch (error) {
      console.error('Error finding call forwarding by user ID:', error);
      throw error;
    }
  }

  static async getActiveForwardingForNumber(phoneNumberId) {
    try {
      const sql = `
        SELECT * FROM call_forwarding 
        WHERE phone_number_id = ? AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const results = await database.query(sql, [phoneNumberId]);
      return results.length > 0 ? new CallForwarding(results[0]) : null;
    } catch (error) {
      console.error('Error finding active forwarding for number:', error);
      throw error;
    }
  }

  static async findByPhoneNumberId(phoneNumberId) {
    try {
      const sql = 'SELECT * FROM call_forwarding WHERE phone_number_id = ? ORDER BY created_at DESC';
      const results = await database.query(sql, [phoneNumberId]);
      return results.map(row => new CallForwarding(row));
    } catch (error) {
      console.error('Error finding call forwarding by phone number ID:', error);
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
          values.push(data[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const sql = `UPDATE call_forwarding SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await database.query(sql, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating call forwarding:', error);
      throw error;
    }
  }

  static async toggleActive(id) {
    try {
      const sql = 'UPDATE call_forwarding SET is_active = NOT is_active WHERE id = ?';
      const result = await database.query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error toggling call forwarding active status:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const sql = 'DELETE FROM call_forwarding WHERE id = ?';
      const result = await database.query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting call forwarding:', error);
      throw error;
    }
  }

  static async deactivateAllForNumber(phoneNumberId) {
    try {
      const sql = 'UPDATE call_forwarding SET is_active = false WHERE phone_number_id = ?';
      const result = await database.query(sql, [phoneNumberId]);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deactivating call forwarding for number:', error);
      throw error;
    }
  }

  static async getForwardingStats(userId) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_forwarding_rules,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_forwarding_rules,
          COUNT(DISTINCT phone_number_id) as numbers_with_forwarding
        FROM call_forwarding 
        WHERE user_id = ?
      `;
      const results = await database.query(sql, [userId]);
      return results[0];
    } catch (error) {
      console.error('Error getting forwarding stats:', error);
      throw error;
    }
  }

  // Instance methods
  async update(data) {
    return await CallForwarding.update(this.id, data);
  }

  async toggleActive() {
    return await CallForwarding.toggleActive(this.id);
  }

  async delete() {
    return await CallForwarding.delete(this.id);
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      phone_number_id: this.phone_number_id,
      forward_to_number: this.forward_to_number,
      is_active: this.is_active,
      forwarding_type: this.forwarding_type,
      ring_timeout: this.ring_timeout,
      created_at: this.created_at,
      updated_at: this.updated_at,
      // Include phone number details if available
      phone_number: this.phone_number,
      friendly_name: this.friendly_name
    };
  }
}

module.exports = CallForwarding;
