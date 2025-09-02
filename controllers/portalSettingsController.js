const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Get all portal settings for the authenticated user
async function getPortalSettings(req, res) {
  try {
    const customerId = req.user.customerId;

    // Get customer-specific settings
    const settingsQuery = `
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        description
      FROM portal_settings
      WHERE customer_id = ?
      ORDER BY setting_key ASC
    `;

    const [settings] = await mysql.execute(settingsQuery, [customerId]);

    // Get user preferences from portal_users table
    const userQuery = `
      SELECT 
        role,
        permissions,
        two_factor_enabled,
        last_login
      FROM portal_users
      WHERE customer_id = ?
      LIMIT 1
    `;

    const [users] = await mysql.execute(userQuery, [customerId]);
    const user = users[0] || {};

    // Parse permissions
    let permissions = {};
    if (user.permissions) {
      try {
        permissions = JSON.parse(user.permissions);
      } catch (e) {
        permissions = {};
      }
    }

    // Build settings object
    const settingsData = {
      general_settings: {
        default_language: 'en',
        default_timezone: 'America/New_York',
        date_format: 'MM/DD/YYYY',
        time_format: '12-hour'
      },
      notification_settings: {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        marketing_emails: false,
        service_updates: true,
        payment_reminders: true
      },
      privacy_settings: {
        profile_visibility: 'private',
        service_history_visibility: 'private',
        allow_marketing_communications: false
      },
      security_settings: {
        two_factor_authentication: user.two_factor_enabled || false,
        session_timeout_minutes: 60,
        password_expiry_days: 90,
        login_attempts_limit: 5
      },
      user_permissions: permissions
    };

    // Override with customer-specific settings
    settings.forEach(setting => {
      const key = setting.setting_key;
      let value = setting.setting_value;

      // Parse value based on type
      switch (setting.setting_type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseInt(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = value;
          }
          break;
        default:
          // string and date types remain as is
          break;
      }

      // Map setting keys to nested objects
      if (key.startsWith('general.')) {
        const subKey = key.replace('general.', '');
        settingsData.general_settings[subKey] = value;
      } else if (key.startsWith('notification.')) {
        const subKey = key.replace('notification.', '');
        settingsData.notification_settings[subKey] = value;
      } else if (key.startsWith('privacy.')) {
        const subKey = key.replace('privacy.', '');
        settingsData.privacy_settings[subKey] = value;
      } else if (key.startsWith('security.')) {
        const subKey = key.replace('security.', '');
        settingsData.security_settings[subKey] = value;
      } else {
        // Direct mapping for simple keys
        settingsData[key] = value;
      }
    });

    res.json({
      success: true,
      message: 'Portal settings retrieved successfully',
      data: settingsData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting portal settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve portal settings',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Update portal settings
async function updatePortalSettings(req, res) {
  try {
    const customerId = req.user.customerId;
    const userId = req.user.userId;
    const updateData = req.body;

    const updatedFields = [];

    // Update general settings
    if (updateData.general_settings) {
      for (const [key, value] of Object.entries(updateData.general_settings)) {
        if (value !== undefined) {
          await updateSetting(customerId, `general.${key}`, value, 'string', `General setting: ${key}`);
          updatedFields.push(`general.${key}`);
        }
      }
    }

    // Update notification settings
    if (updateData.notification_settings) {
      for (const [key, value] of Object.entries(updateData.notification_settings)) {
        if (value !== undefined) {
          await updateSetting(customerId, `notification.${key}`, value, 'boolean', `Notification setting: ${key}`);
          updatedFields.push(`notification.${key}`);
        }
      }
    }

    // Update privacy settings
    if (updateData.privacy_settings) {
      for (const [key, value] of Object.entries(updateData.privacy_settings)) {
        if (value !== undefined) {
          await updateSetting(customerId, `privacy.${key}`, value, 'string', `Privacy setting: ${key}`);
          updatedFields.push(`privacy.${key}`);
        }
      }
    }

    // Update security settings
    if (updateData.security_settings) {
      for (const [key, value] of Object.entries(updateData.security_settings)) {
        if (value !== undefined) {
          if (key === 'two_factor_authentication') {
            // Update two-factor setting in portal_users table
            await updateTwoFactorSetting(userId, value);
            updatedFields.push('two_factor_authentication');
          } else {
            await updateSetting(customerId, `security.${key}`, value, 'number', `Security setting: ${key}`);
            updatedFields.push(`security.${key}`);
          }
        }
      }
    }

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description)
      VALUES (?, ?, ?, 'update_profile', 'Portal settings updated: ${updatedFields.join(', ')}')
    `;

    await mysql.execute(activityQuery, [uuidv4(), userId, customerId]);

    res.json({
      success: true,
      message: 'Portal settings updated successfully',
      data: {
        updated_fields: updatedFields
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating portal settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update portal settings',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to update a setting
async function updateSetting(customerId, key, value, type, description) {
  const upsertQuery = `
    INSERT INTO portal_settings (id, customer_id, setting_key, setting_value, setting_type, description, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      updated_at = VALUES(updated_at)
  `;

  await mysql.execute(upsertQuery, [
    uuidv4(),
    customerId,
    key,
    String(value),
    type,
    description
  ]);
}

// Helper function to update two-factor authentication setting
async function updateTwoFactorSetting(userId, enabled) {
  const updateQuery = `
    UPDATE portal_users 
    SET 
      two_factor_enabled = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await mysql.execute(updateQuery, [enabled, userId]);
}

// Get available setting options
async function getSettingOptions(req, res) {
  try {
    const settingOptions = {
      general_settings: {
        default_language: {
          type: 'select',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' }
          ],
          default: 'en'
        },
        default_timezone: {
          type: 'select',
          options: [
            { value: 'America/New_York', label: 'Eastern Time' },
            { value: 'America/Chicago', label: 'Central Time' },
            { value: 'America/Denver', label: 'Mountain Time' },
            { value: 'America/Los_Angeles', label: 'Pacific Time' },
            { value: 'UTC', label: 'UTC' }
          ],
          default: 'America/New_York'
        },
        date_format: {
          type: 'select',
          options: [
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
          ],
          default: 'MM/DD/YYYY'
        },
        time_format: {
          type: 'select',
          options: [
            { value: '12-hour', label: '12-hour (AM/PM)' },
            { value: '24-hour', label: '24-hour' }
          ],
          default: '12-hour'
        }
      },
      notification_settings: {
        email_notifications: {
          type: 'boolean',
          default: true,
          description: 'Receive email notifications for important updates'
        },
        sms_notifications: {
          type: 'boolean',
          default: false,
          description: 'Receive SMS notifications for urgent updates'
        },
        push_notifications: {
          type: 'boolean',
          default: true,
          description: 'Receive push notifications in the portal'
        },
        marketing_emails: {
          type: 'boolean',
          default: false,
          description: 'Receive marketing and promotional emails'
        },
        service_updates: {
          type: 'boolean',
          default: true,
          description: 'Receive updates about service requests and jobs'
        },
        payment_reminders: {
          type: 'boolean',
          default: true,
          description: 'Receive payment reminders and invoices'
        }
      },
      privacy_settings: {
        profile_visibility: {
          type: 'select',
          options: [
            { value: 'private', label: 'Private' },
            { value: 'public', label: 'Public' },
            { value: 'contacts_only', label: 'Contacts Only' }
          ],
          default: 'private',
          description: 'Control who can see your profile information'
        },
        service_history_visibility: {
          type: 'select',
          options: [
            { value: 'private', label: 'Private' },
            { value: 'public', label: 'Public' },
            { value: 'contacts_only', label: 'Contacts Only' }
          ],
          default: 'private',
          description: 'Control who can see your service history'
        },
        allow_marketing_communications: {
          type: 'boolean',
          default: false,
          description: 'Allow marketing communications from third parties'
        }
      },
      security_settings: {
        two_factor_authentication: {
          type: 'boolean',
          default: false,
          description: 'Enable two-factor authentication for enhanced security'
        },
        session_timeout_minutes: {
          type: 'number',
          min: 15,
          max: 480,
          default: 60,
          description: 'Session timeout in minutes (15-480)'
        },
        password_expiry_days: {
          type: 'number',
          min: 30,
          max: 365,
          default: 90,
          description: 'Password expiry in days (30-365)'
        },
        login_attempts_limit: {
          type: 'number',
          min: 3,
          max: 10,
          default: 5,
          description: 'Maximum login attempts before account lockout (3-10)'
        }
      }
    };

    res.json({
      success: true,
      message: 'Setting options retrieved successfully',
      data: {
        setting_options: settingOptions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting setting options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve setting options',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Reset settings to defaults
async function resetSettingsToDefaults(req, res) {
  try {
    const customerId = req.user.customerId;
    const userId = req.user.userId;

    // Delete all custom settings
    const deleteQuery = `
      DELETE FROM portal_settings WHERE customer_id = ?
    `;

    await mysql.execute(deleteQuery, [customerId]);

    // Reset two-factor authentication
    const resetTwoFactorQuery = `
      UPDATE portal_users 
      SET 
        two_factor_enabled = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = ?
    `;

    await mysql.execute(resetTwoFactorQuery, [customerId]);

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description)
      VALUES (?, ?, ?, 'update_profile', 'Portal settings reset to defaults')
    `;

    await mysql.execute(activityQuery, [uuidv4(), userId, customerId]);

    res.json({
      success: true,
      message: 'Portal settings reset to defaults successfully',
      data: {
        reset_completed: true,
        reset_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error resetting portal settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset portal settings',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getPortalSettings,
  updatePortalSettings,
  getSettingOptions,
  resetSettingsToDefaults
};
