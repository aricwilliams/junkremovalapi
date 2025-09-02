const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

/**
 * Vehicle Fuel Logs Controller
 * Handles all vehicle fuel-related operations for the Fleet Management API
 */

// Helper function to build dynamic WHERE clause for fuel log queries
function buildFuelLogWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.date_from) {
    conditions.push('vfl.fuel_date >= ?');
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push('vfl.fuel_date <= ?');
    params.push(filters.date_to);
  }

  if (filters.fuel_type) {
    conditions.push('vfl.fuel_type = ?');
    params.push(filters.fuel_type);
  }

  if (filters.driver_id) {
    conditions.push('vfl.driver_id = ?');
    params.push(filters.driver_id);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

/**
 * Get all fuel logs for a specific vehicle
 */
async function getVehicleFuelLogs(req, res) {
  try {
    const { id } = req.params;
    const {
      date_from,
      date_to,
      fuel_type,
      driver_id
    } = req.query;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id, name, make, model, license_plate, fuel_type as vehicle_fuel_type FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const vehicle = existingVehicles[0];
    const filters = { date_from, date_to, fuel_type, driver_id };
    const { whereClause, params } = buildFuelLogWhereClause(filters);

    // Get fuel logs
    const fuelLogsQuery = `
      SELECT 
        vfl.id,
        vfl.fuel_date,
        vfl.fuel_time,
        vfl.fuel_station,
        vfl.fuel_station_address,
        vfl.fuel_type,
        vfl.fuel_quantity,
        vfl.fuel_quantity_units,
        vfl.fuel_cost_per_unit,
        vfl.total_fuel_cost,
        vfl.odometer_reading,
        vfl.fuel_level_before,
        vfl.fuel_level_after,
        vfl.driver_id,
        vfl.driver_name,
        vfl.notes,
        vfl.created_at
      FROM vehicle_fuel_logs vfl
      WHERE vfl.vehicle_id = ? ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
      ORDER BY vfl.fuel_date DESC, vfl.fuel_time DESC
    `;

    const [fuelLogs] = await db.execute(fuelLogsQuery, [id, ...params]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_logs,
        SUM(fuel_quantity) as total_fuel_consumed,
        SUM(total_fuel_cost) as total_fuel_cost,
        AVG(fuel_cost_per_unit) as avg_fuel_cost_per_unit,
        MAX(fuel_date) as last_fuel_date,
        MIN(fuel_date) as first_fuel_date,
        SUM(CASE WHEN fuel_type = 'gasoline' THEN fuel_quantity ELSE 0 END) as gasoline_consumed,
        SUM(CASE WHEN fuel_type = 'diesel' THEN fuel_quantity ELSE 0 END) as diesel_consumed
      FROM vehicle_fuel_logs
      WHERE vehicle_id = ?
    `;

    const [summaryResult] = await db.execute(summaryQuery, [id]);
    const summary = summaryResult[0];

    // Calculate fuel efficiency if we have mileage data
    let fuelEfficiency = null;
    if (fuelLogs.length >= 2) {
      const sortedLogs = fuelLogs.sort((a, b) => new Date(a.fuel_date) - new Date(b.fuel_date));
      const firstLog = sortedLogs[0];
      const lastLog = sortedLogs[sortedLogs.length - 1];
      
      if (firstLog.odometer_reading && lastLog.odometer_reading) {
        const totalMiles = lastLog.odometer_reading - firstLog.odometer_reading;
        const totalFuel = fuelLogs.reduce((sum, log) => sum + parseFloat(log.fuel_quantity), 0);
        
        if (totalMiles > 0 && totalFuel > 0) {
          fuelEfficiency = (totalMiles / totalFuel).toFixed(2);
        }
      }
    }

    res.json({
      success: true,
      message: 'Vehicle fuel logs retrieved successfully',
      data: {
        vehicle_id: id,
        vehicle_name: vehicle.name,
        vehicle_fuel_type: vehicle.vehicle_fuel_type,
        fuel_logs: fuelLogs,
        summary: {
          ...summary,
          fuel_efficiency_mpg: fuelEfficiency
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting vehicle fuel logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle fuel logs',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Add a new fuel log entry for a vehicle
 */
async function addFuelLog(req, res) {
  try {
    const { id } = req.params;
    const fuelData = req.body;
    const fuelLogId = uuidv4();

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id, name, fuel_type, current_fuel_level, mileage FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const vehicle = existingVehicles[0];

    // Validate fuel type matches vehicle fuel type
    if (fuelData.fuel_type && fuelData.fuel_type !== vehicle.fuel_type) {
      return res.status(400).json({
        success: false,
        message: 'Fuel type does not match vehicle fuel type',
        error: 'INVALID_FUEL_TYPE',
        timestamp: new Date().toISOString()
      });
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert fuel log
      const insertQuery = `
        INSERT INTO vehicle_fuel_logs (
          id, vehicle_id, fuel_date, fuel_time, fuel_station, fuel_station_address,
          fuel_type, fuel_quantity, fuel_quantity_units, fuel_cost_per_unit,
          total_fuel_cost, odometer_reading, fuel_level_before, fuel_level_after,
          driver_id, driver_name, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        fuelLogId,
        id,
        fuelData.fuel_date,
        fuelData.fuel_time || null,
        fuelData.fuel_station || null,
        fuelData.fuel_station_address || null,
        fuelData.fuel_type || vehicle.fuel_type,
        fuelData.fuel_quantity,
        fuelData.fuel_quantity_units || 'gallons',
        fuelData.fuel_cost_per_unit,
        fuelData.total_fuel_cost,
        fuelData.odometer_reading,
        fuelData.fuel_level_before || vehicle.current_fuel_level,
        fuelData.fuel_level_after || null,
        fuelData.driver_id || null,
        fuelData.driver_name || null,
        fuelData.notes || null
      ];

      await connection.execute(insertQuery, insertParams);

      // Update vehicle fuel level and mileage
      const updateFields = [];
      const updateParams = [];

      if (fuelData.fuel_level_after !== undefined) {
        updateFields.push('current_fuel_level = ?');
        updateParams.push(fuelData.fuel_level_after);
      }

      if (fuelData.odometer_reading && fuelData.odometer_reading > vehicle.mileage) {
        updateFields.push('mileage = ?');
        updateParams.push(fuelData.odometer_reading);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateParams.push(id);

        const updateQuery = `UPDATE vehicles SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.execute(updateQuery, updateParams);
      }

      // Create cost record
      const costId = uuidv4();
      const insertCostQuery = `
        INSERT INTO vehicle_costs (
          id, vehicle_id, cost_date, cost_type, cost_category, description,
          amount, quantity, unit_cost, vendor, invoice_number, odometer_reading,
          fuel_log_id
        ) VALUES (?, ?, ?, 'fuel', 'fuel', ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(insertCostQuery, [
        costId,
        id,
        fuelData.fuel_date,
        `Fuel purchase - ${fuelData.fuel_quantity} ${fuelData.fuel_quantity_units || 'gallons'}`,
        fuelData.total_fuel_cost,
        fuelData.fuel_quantity,
        fuelData.fuel_cost_per_unit,
        fuelData.fuel_station || 'Unknown',
        null, // invoice_number
        fuelData.odometer_reading,
        fuelLogId
      ]);

      await connection.commit();

      // Get created fuel log
      const [fuelLogs] = await db.execute(
        'SELECT id, fuel_date, fuel_type, fuel_quantity, total_fuel_cost, odometer_reading FROM vehicle_fuel_logs WHERE id = ?',
        [fuelLogId]
      );

      res.status(201).json({
        success: true,
        message: 'Fuel log added successfully',
        data: {
          fuel_log_id: fuelLogId,
          vehicle_id: id,
          fuel_type: fuelData.fuel_type || vehicle.fuel_type,
          fuel_quantity: fuelData.fuel_quantity,
          total_cost: fuelData.total_fuel_cost,
          odometer_reading: fuelData.odometer_reading
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
    console.error('Error adding fuel log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add fuel log',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update an existing fuel log
 */
async function updateFuelLog(req, res) {
  try {
    const { id, fuelLogId } = req.params;
    const updateData = req.body;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Check if fuel log exists
    const [existingFuelLogs] = await db.execute(
      'SELECT id, fuel_type, fuel_quantity, total_fuel_cost, odometer_reading FROM vehicle_fuel_logs WHERE id = ? AND vehicle_id = ?',
      [fuelLogId, id]
    );

    if (existingFuelLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fuel log not found',
        error: 'FUEL_LOG_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const existingFuelLog = existingFuelLogs[0];

    // Build dynamic UPDATE query
    const updateFields = [];
    const updateParams = [];

    const allowedFields = [
      'fuel_date', 'fuel_time', 'fuel_station', 'fuel_station_address',
      'fuel_type', 'fuel_quantity', 'fuel_quantity_units', 'fuel_cost_per_unit',
      'total_fuel_cost', 'odometer_reading', 'fuel_level_before', 'fuel_level_after',
      'driver_id', 'driver_name', 'notes'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateParams.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_UPDATE_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(fuelLogId);

    const updateQuery = `UPDATE vehicle_fuel_logs SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.execute(updateQuery, updateParams);

    // Update vehicle fuel level and mileage if provided
    if (updateData.fuel_level_after !== undefined || updateData.odometer_reading !== undefined) {
      const vehicleUpdateFields = [];
      const vehicleUpdateParams = [];

      if (updateData.fuel_level_after !== undefined) {
        vehicleUpdateFields.push('current_fuel_level = ?');
        vehicleUpdateParams.push(updateData.fuel_level_after);
      }

      if (updateData.odometer_reading !== undefined) {
        vehicleUpdateFields.push('mileage = ?');
        vehicleUpdateParams.push(updateData.odometer_reading);
      }

      vehicleUpdateFields.push('updated_at = CURRENT_TIMESTAMP');
      vehicleUpdateParams.push(id);

      const vehicleUpdateQuery = `UPDATE vehicles SET ${vehicleUpdateFields.join(', ')} WHERE id = ?`;
      await db.execute(vehicleUpdateQuery, vehicleUpdateParams);
    }

    // Update related cost record if fuel cost changed
    if (updateData.total_fuel_cost !== undefined) {
      await db.execute(
        'UPDATE vehicle_costs SET amount = ?, updated_at = CURRENT_TIMESTAMP WHERE fuel_log_id = ?',
        [updateData.total_fuel_cost, fuelLogId]
      );
    }

    // Get updated fuel log
    const [fuelLogs] = await db.execute(
      'SELECT id, fuel_date, fuel_type, fuel_quantity, total_fuel_cost, updated_at FROM vehicle_fuel_logs WHERE id = ?',
      [fuelLogId]
    );

    res.json({
      success: true,
      message: 'Fuel log updated successfully',
      data: {
        fuel_log_id: fuelLogId,
        updated_fields: Object.keys(updateData)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating fuel log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fuel log',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete a fuel log
 */
async function deleteFuelLog(req, res) {
  try {
    const { id, fuelLogId } = req.params;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Check if fuel log exists
    const [existingFuelLogs] = await db.execute(
      'SELECT id FROM vehicle_fuel_logs WHERE id = ? AND vehicle_id = ?',
      [fuelLogId, id]
    );

    if (existingFuelLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fuel log not found',
        error: 'FUEL_LOG_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Delete related cost record first
      await connection.execute(
        'DELETE FROM vehicle_costs WHERE fuel_log_id = ?',
        [fuelLogId]
      );

      // Delete fuel log
      await connection.execute(
        'DELETE FROM vehicle_fuel_logs WHERE id = ?',
        [fuelLogId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Fuel log deleted successfully',
        data: {
          fuel_log_id: fuelLogId,
          vehicle_id: id
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
    console.error('Error deleting fuel log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fuel log',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get fuel log by ID
 */
async function getFuelLogById(req, res) {
  try {
    const { id, fuelLogId } = req.params;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id, name FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Get fuel log details
    const fuelLogQuery = `
      SELECT 
        vfl.*,
        v.name as vehicle_name,
        v.make,
        v.model,
        v.license_plate
      FROM vehicle_fuel_logs vfl
      JOIN vehicles v ON vfl.vehicle_id = v.id
      WHERE vfl.id = ? AND vfl.vehicle_id = ?
    `;

    const [fuelLogs] = await db.execute(fuelLogQuery, [fuelLogId, id]);

    if (fuelLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fuel log not found',
        error: 'FUEL_LOG_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const fuelLog = fuelLogs[0];

    res.json({
      success: true,
      message: 'Fuel log retrieved successfully',
      data: { fuel_log: fuelLog },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting fuel log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve fuel log',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getVehicleFuelLogs,
  addFuelLog,
  updateFuelLog,
  deleteFuelLog,
  getFuelLogById
};
