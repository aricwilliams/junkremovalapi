const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Get client profile for the authenticated user
async function getClientProfile(req, res) {
  try {
    const customerId = req.user.customerId;
    const userId = req.user.userId;

    // Get basic customer information
    const customerQuery = `
      SELECT 
        c.*,
        pu.username,
        pu.email,
        pu.role,
        pu.last_login
      FROM customers c
      JOIN portal_users pu ON c.id = pu.customer_id
      WHERE c.id = ? AND pu.id = ?
    `;

    const [customers] = await mysql.execute(customerQuery, [customerId, userId]);
    
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
        error: 'PROFILE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const customer = customers[0];

    // Get customer addresses
    const addressesQuery = `
      SELECT 
        id,
        type,
        street,
        city,
        state,
        zip_code,
        country,
        is_default,
        created_at
      FROM customer_addresses
      WHERE customer_id = ?
      ORDER BY is_default DESC, created_at ASC
    `;

    const [addresses] = await mysql.execute(addressesQuery, [customerId]);

    // Get service history summary
    const serviceHistoryQuery = `
      SELECT 
        COUNT(*) as total_jobs,
        SUM(COALESCE(total_cost, 0)) as total_spent,
        MAX(completed_date) as last_service_date,
        AVG(COALESCE(customer_rating, 0)) as average_rating
      FROM jobs
      WHERE customer_id = ?
    `;

    const [serviceHistory] = await mysql.execute(serviceHistoryQuery, [customerId]);

    // Get favorite services (most used service types)
    const favoriteServicesQuery = `
      SELECT 
        j.service_type,
        COUNT(*) as usage_count
      FROM jobs j
      WHERE j.customer_id = ? AND j.status = 'completed'
      GROUP BY j.service_type
      ORDER BY usage_count DESC
      LIMIT 3
    `;

    const [favoriteServices] = await mysql.execute(favoriteServicesQuery, [customerId]);

    // Get recent activity
    const activityQuery = `
      SELECT 
        activity_type,
        description,
        created_at
      FROM portal_activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const [activities] = await mysql.execute(activityQuery, [userId]);

    // Build comprehensive profile object
    const profileData = {
      id: customer.id,
      username: customer.username,
      email: customer.email,
      personal_info: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        mobile: customer.mobile,
        date_of_birth: customer.date_of_birth,
        preferred_contact_method: customer.preferred_contact_method || 'email'
      },
      addresses: addresses.map(addr => ({
        id: addr.id,
        type: addr.type,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zip_code: addr.zip_code,
        country: addr.country,
        is_default: addr.is_default
      })),
      preferences: {
        language: customer.language || 'en',
        timezone: customer.timezone || 'America/New_York',
        notification_preferences: {
          email_notifications: true, // Default values
          sms_notifications: false,
          push_notifications: true,
          marketing_emails: false
        },
        communication_preferences: {
          preferred_contact_time: 'business_hours',
          preferred_contact_method: 'email'
        }
      },
      service_history: {
        total_jobs: serviceHistory[0]?.total_jobs || 0,
        total_spent: parseFloat(serviceHistory[0]?.total_spent || 0).toFixed(2),
        last_service_date: serviceHistory[0]?.last_service_date,
        average_rating: parseFloat(serviceHistory[0]?.average_rating || 0).toFixed(1),
        favorite_services: favoriteServices.map(service => service.service_type)
      },
      recent_activity: activities.map(activity => ({
        type: activity.activity_type,
        description: activity.description,
        timestamp: activity.activity_created_at
      }))
    };

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        profile: profileData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting client profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Update client profile
async function updateClientProfile(req, res) {
  try {
    const customerId = req.user.customerId;
    const userId = req.user.userId;
    const updateData = req.body;

    // Check if customer exists
    const customerQuery = `
      SELECT id FROM customers WHERE id = ?
    `;
    
    const [customers] = await mysql.execute(customerQuery, [customerId]);
    
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
        error: 'PROFILE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const updatedFields = [];

    // Update personal information if provided
    if (updateData.personal_info) {
      const personalInfoQuery = `
        UPDATE customers 
        SET 
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          mobile = COALESCE(?, mobile),
          date_of_birth = COALESCE(?, date_of_birth),
          preferred_contact_method = COALESCE(?, preferred_contact_method),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await mysql.execute(personalInfoQuery, [
        updateData.personal_info.first_name || null,
        updateData.personal_info.last_name || null,
        updateData.personal_info.phone || null,
        updateData.personal_info.mobile || null,
        updateData.personal_info.date_of_birth || null,
        updateData.personal_info.preferred_contact_method || null,
        customerId
      ]);

      updatedFields.push('personal_info');
    }

    // Update addresses if provided
    if (updateData.addresses && Array.isArray(updateData.addresses)) {
      for (const address of updateData.addresses) {
        if (address.id) {
          // Update existing address
          const updateAddressQuery = `
            UPDATE customer_addresses 
            SET 
              type = ?,
              street = ?,
              city = ?,
              state = ?,
              zip_code = ?,
              country = ?,
              is_default = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND customer_id = ?
          `;

          await mysql.execute(updateAddressQuery, [
            address.type,
            address.street,
            address.city,
            address.state,
            address.zip_code,
            address.country || 'USA',
            address.is_default || false,
            address.id,
            customerId
          ]);
        } else {
          // Create new address
          const createAddressQuery = `
            INSERT INTO customer_addresses (
              id, customer_id, type, street, city, state, zip_code, country, is_default, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `;

          await mysql.execute(createAddressQuery, [
            uuidv4(),
            customerId,
            address.type,
            address.street,
            address.city,
            address.state,
            address.zip_code,
            address.country || 'USA',
            address.is_default || false
          ]);
        }
      }

      updatedFields.push('addresses');
    }

    // Update preferences if provided
    if (updateData.preferences) {
      const preferencesQuery = `
        UPDATE customers 
        SET 
          language = COALESCE(?, language),
          timezone = COALESCE(?, timezone),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await mysql.execute(preferencesQuery, [
        updateData.preferences.language || null,
        updateData.preferences.timezone || null,
        customerId
      ]);

      updatedFields.push('preferences');
    }

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description)
      VALUES (?, ?, ?, 'update_profile', 'Profile updated: ${updatedFields.join(', ')}')
    `;

    await mysql.execute(activityQuery, [uuidv4(), userId, customerId]);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        updated_fields: updatedFields
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating client profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Change password
async function changePassword(req, res) {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.user.userId;
    const customerId = req.user.customerId;

    // Validate password confirmation
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match',
        error: 'PASSWORD_MISMATCH',
        timestamp: new Date().toISOString()
      });
    }

    // Get current password hash
    const userQuery = `
      SELECT password_hash FROM portal_users WHERE id = ?
    `;
    
    const [users] = await mysql.execute(userQuery, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const user = users[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        error: 'INVALID_CURRENT_PASSWORD',
        timestamp: new Date().toISOString()
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    const updatePasswordQuery = `
      UPDATE portal_users 
      SET 
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await mysql.execute(updatePasswordQuery, [newPasswordHash, userId]);

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description)
      VALUES (?, ?, ?, 'change_password', 'Password changed successfully')
    `;

    await mysql.execute(activityQuery, [uuidv4(), userId, customerId]);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        password_changed: true,
        changed_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getClientProfile,
  updateClientProfile,
  changePassword
};
