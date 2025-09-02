const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

/**
 * Fleet Settings Controller
 * Handles all fleet settings and configuration operations for the Fleet Management API
 */

/**
 * Get all fleet management settings and configurations
 */
async function getFleetSettings(req, res) {
  try {
    // Get all settings
    const settingsQuery = `
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        description,
        is_public,
        created_at,
        updated_at
      FROM fleet_settings
      ORDER BY setting_key
    `;

    const [settings] = await db.execute(settingsQuery);

    // Group settings by category
    const groupedSettings = {
      maintenance_settings: {},
      fuel_settings: {},
      tracking_settings: {},
      notification_settings: {},
      general_settings: {}
    };

    settings.forEach(setting => {
      const key = setting.setting_key;
      let value = setting.setting_value;

      // Convert value based on setting type
      if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = value; // Keep as string if JSON parsing fails
        }
      }

      // Categorize settings
      if (key.includes('maintenance') || key.includes('service') || key.includes('interval')) {
        groupedSettings.maintenance_settings[key] = {
          value,
          type: setting.setting_type,
          description: setting.description,
          is_public: setting.is_public
        };
      } else if (key.includes('fuel') || key.includes('efficiency')) {
        groupedSettings.fuel_settings[key] = {
          value,
          type: setting.setting_type,
          description: setting.description,
          is_public: setting.is_public
        };
      } else if (key.includes('location') || key.includes('tracking') || key.includes('geofencing') || key.includes('speed')) {
        groupedSettings.tracking_settings[key] = {
          value,
          type: setting.setting_type,
          description: setting.description,
          is_public: setting.is_public
        };
      } else if (key.includes('notification') || key.includes('reminder') || key.includes('alert')) {
        groupedSettings.notification_settings[key] = {
          value,
          type: setting.setting_type,
          description: setting.description,
          is_public: setting.is_public
        };
      } else {
        groupedSettings.general_settings[key] = {
          value,
          type: setting.setting_type,
          description: setting.description,
          is_public: setting.is_public
        };
      }
    });

    res.json({
      success: true,
      message: 'Fleet settings retrieved successfully',
      data: {
        settings: groupedSettings,
        total_settings: settings.length,
        categories: Object.keys(groupedSettings).map(category => ({
          name: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count: Object.keys(groupedSettings[category]).length
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting fleet settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve fleet settings',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update fleet management settings
 */
async function updateFleetSettings(req, res) {
  try {
    const updateData = req.body;
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const updatedSettings = [];
      const errors = [];

      // Process maintenance settings
      if (updateData.maintenance_settings) {
        for (const [key, value] of Object.entries(updateData.maintenance_settings)) {
          try {
            const settingKey = key.startsWith('maintenance_') ? key : `maintenance_${key}`;
            await connection.execute(
              'UPDATE fleet_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
              [value.toString(), settingKey]
            );
            updatedSettings.push(settingKey);
          } catch (error) {
            errors.push(`Failed to update ${key}: ${error.message}`);
          }
        }
      }

      // Process fuel settings
      if (updateData.fuel_settings) {
        for (const [key, value] of Object.entries(updateData.fuel_settings)) {
          try {
            const settingKey = key.startsWith('fuel_') ? key : `fuel_${key}`;
            await connection.execute(
              'UPDATE fleet_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
              [value.toString(), settingKey]
            );
            updatedSettings.push(settingKey);
          } catch (error) {
            errors.push(`Failed to update ${key}: ${error.message}`);
          }
        }
      }

      // Process tracking settings
      if (updateData.tracking_settings) {
        for (const [key, value] of Object.entries(updateData.tracking_settings)) {
          try {
            const settingKey = key.startsWith('tracking_') ? key : `tracking_${key}`;
            await connection.execute(
              'UPDATE fleet_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
              [value.toString(), settingKey]
            );
            updatedSettings.push(settingKey);
          } catch (error) {
            errors.push(`Failed to update ${key}: ${error.message}`);
          }
        }
      }

      // Process notification settings
      if (updateData.notification_settings) {
        for (const [key, value] of Object.entries(updateData.notification_settings)) {
          try {
            const settingKey = key.startsWith('notification_') ? key : `notification_${key}`;
            await connection.execute(
              'UPDATE fleet_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
              [value.toString(), settingKey]
            );
            updatedSettings.push(settingKey);
          } catch (error) {
            errors.push(`Failed to update ${key}: ${error.message}`);
          }
        }
      }

      // Process general settings
      if (updateData.general_settings) {
        for (const [key, value] of Object.entries(updateData.general_settings)) {
          try {
            await connection.execute(
              'UPDATE fleet_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
              [value.toString(), key]
            );
            updatedSettings.push(key);
          } catch (error) {
            errors.push(`Failed to update ${key}: ${error.message}`);
          }
        }
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Some settings failed to update',
          error: 'PARTIAL_UPDATE_FAILED',
          details: errors,
          timestamp: new Date().toISOString()
        });
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Fleet settings updated successfully',
        data: {
          updated_settings: updatedSettings,
          total_updated: updatedSettings.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating fleet settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fleet settings',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get a specific fleet setting by key
 */
async function getFleetSettingByKey(req, res) {
  try {
    const { key } = req.params;

    const settingQuery = `
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        description,
        is_public,
        created_at,
        updated_at
      FROM fleet_settings
      WHERE setting_key = ?
    `;

    const [settings] = await db.execute(settingQuery, [key]);

    if (settings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
        error: 'SETTING_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const setting = settings[0];
    let value = setting.setting_value;

    // Convert value based on setting type
    if (setting.setting_type === 'number') {
      value = parseFloat(value);
    } else if (setting.setting_type === 'boolean') {
      value = value === 'true';
    } else if (setting.setting_type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = value; // Keep as string if JSON parsing fails
      }
    }

    res.json({
      success: true,
      message: 'Fleet setting retrieved successfully',
      data: {
        setting_key: setting.setting_key,
        value,
        type: setting.setting_type,
        description: setting.description,
        is_public: setting.is_public,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting fleet setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve fleet setting',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create a new fleet setting
 */
async function createFleetSetting(req, res) {
  try {
    const { setting_key, setting_value, setting_type = 'string', description, is_public = false } = req.body;

    // Validate required fields
    if (!setting_key || setting_value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting key and value are required',
        error: 'MISSING_REQUIRED_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    // Check if setting already exists
    const [existingSettings] = await db.execute(
      'SELECT setting_key FROM fleet_settings WHERE setting_key = ?',
      [setting_key]
    );

    if (existingSettings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Setting with this key already exists',
        error: 'SETTING_ALREADY_EXISTS',
        timestamp: new Date().toISOString()
      });
    }

    // Validate setting type
    const validTypes = ['string', 'number', 'boolean', 'json'];
    if (!validTypes.includes(setting_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid setting type',
        error: 'INVALID_SETTING_TYPE',
        timestamp: new Date().toISOString()
      });
    }

    // Validate value based on type
    if (setting_type === 'number' && isNaN(parseFloat(setting_value))) {
      return res.status(400).json({
        success: false,
        message: 'Value must be a valid number',
        error: 'INVALID_NUMBER_VALUE',
        timestamp: new Date().toISOString()
      });
    }

    if (setting_type === 'boolean' && !['true', 'false', true, false].includes(setting_value)) {
      return res.status(400).json({
        success: false,
        message: 'Value must be a valid boolean',
        error: 'INVALID_BOOLEAN_VALUE',
        timestamp: new Date().toISOString()
      });
    }

    if (setting_type === 'json') {
      try {
        JSON.parse(setting_value);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Value must be valid JSON',
          error: 'INVALID_JSON_VALUE',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Insert new setting
    const insertQuery = `
      INSERT INTO fleet_settings (
        id, setting_key, setting_value, setting_type, description, is_public
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const settingId = uuidv4();
    await db.execute(insertQuery, [
      settingId,
      setting_key,
      setting_value.toString(),
      setting_type,
      description || null,
      is_public
    ]);

    res.status(201).json({
      success: true,
      message: 'Fleet setting created successfully',
      data: {
        setting_id: settingId,
        setting_key,
        setting_value,
        setting_type,
        description,
        is_public
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating fleet setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fleet setting',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete a fleet setting
 */
async function deleteFleetSetting(req, res) {
  try {
    const { key } = req.params;

    // Check if setting exists
    const [existingSettings] = await db.execute(
      'SELECT setting_key, is_public FROM fleet_settings WHERE setting_key = ?',
      [key]
    );

    if (existingSettings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
        error: 'SETTING_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const setting = existingSettings[0];

    // Check if setting is required (system setting)
    const requiredSettings = [
      'maintenance_reminder_days',
      'low_fuel_threshold',
      'fuel_efficiency_target',
      'location_update_interval',
      'enable_geofencing',
      'enable_speed_alerts',
      'speed_limit',
      'oil_change_interval',
      'brake_service_interval',
      'tire_rotation_interval'
    ];

    if (requiredSettings.includes(key)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete required system setting',
        error: 'REQUIRED_SETTING',
        timestamp: new Date().toISOString()
      });
    }

    // Delete setting
    await db.execute('DELETE FROM fleet_settings WHERE setting_key = ?', [key]);

    res.json({
      success: true,
      message: 'Fleet setting deleted successfully',
      data: {
        setting_key: key,
        deleted_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting fleet setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fleet setting',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Reset fleet settings to defaults
 */
async function resetFleetSettings(req, res) {
  try {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get all non-required settings
      const nonRequiredSettingsQuery = `
        SELECT setting_key 
        FROM fleet_settings 
        WHERE setting_key NOT IN (
          'maintenance_reminder_days',
          'low_fuel_threshold',
          'fuel_efficiency_target',
          'location_update_interval',
          'enable_geofencing',
          'enable_speed_alerts',
          'speed_limit',
          'oil_change_interval',
          'brake_service_interval',
          'tire_rotation_interval'
        )
      `;

      const [nonRequiredSettings] = await connection.execute(nonRequiredSettingsQuery);
      const deletedSettings = nonRequiredSettings.map(setting => setting.setting_key);

      if (deletedSettings.length === 0) {
        await connection.rollback();
        return res.json({
          success: true,
          message: 'No non-required settings to reset',
          data: {
            deleted_settings: [],
            total_deleted: 0
          },
          timestamp: new Date().toISOString()
        });
      }

      // Delete non-required settings
      await connection.execute(
        'DELETE FROM fleet_settings WHERE setting_key NOT IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          'maintenance_reminder_days',
          'low_fuel_threshold',
          'fuel_efficiency_target',
          'location_update_interval',
          'enable_geofencing',
          'enable_speed_alerts',
          'speed_limit',
          'oil_change_interval',
          'brake_service_interval',
          'tire_rotation_interval'
        ]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Fleet settings reset to defaults successfully',
        data: {
          deleted_settings: deletedSettings,
          total_deleted: deletedSettings.length,
          remaining_settings: 'Required system settings only'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error resetting fleet settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset fleet settings',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getFleetSettings,
  updateFleetSettings,
  getFleetSettingByKey,
  createFleetSetting,
  deleteFleetSetting,
  resetFleetSettings
};
