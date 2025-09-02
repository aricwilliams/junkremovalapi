const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

/**
 * Fuel Management Controller
 * Handles all fuel-related operations for the Fleet Management API
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
      'SELECT id, name, make, model, license_plate FROM vehicles WHERE id = ? AND is_active = TRUE',
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
        COUNT(*) as total_records,
        SUM(fuel_quantity) as total_gallons,
        SUM(total_fuel_cost) as total_cost,
        AVG(fuel_cost_per_unit) as avg_cost_per_gallon,
        MAX(fuel_date) as last_fuel_date,
        MIN(fuel_date) as first_fuel_date
      FROM vehicle_fuel_logs
      WHERE vehicle_id = ? ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
    `;

    const [summaryResult] = await db.execute(summaryQuery, [id, ...params]);
    const summary = summaryResult[0];

    // Calculate fuel efficiency if we have enough data
    let fuelEfficiency = null;
    if (fuelLogs.length >= 2) {
      const sortedLogs = fuelLogs.sort((a, b) => new Date(a.fuel_date) - new Date(b.fuel_date));
      const firstLog = sortedLogs[0];
      const lastLog = sortedLogs[sortedLogs.length - 1];
      
      if (lastLog.odometer_reading > firstLog.odometer_reading) {
        const totalMiles = lastLog.odometer_reading - firstLog.odometer_reading;
        const totalGallons = fuelLogs.reduce((sum, log) => sum + parseFloat(log.fuel_quantity), 0);
        fuelEfficiency = totalMiles / totalGallons;
      }
    }

    // Format response
    const response = {
      vehicle_id: id,
      vehicle_name: vehicle.name,
      vehicle_info: {
        make: vehicle.make,
        model: vehicle.model,
        license_plate: vehicle.license_plate
      },
      fuel_logs: fuelLogs.map(log => ({
        id: log.id,
        date: log.fuel_date,
        time: log.fuel_time,
        fuel_type: log.fuel_type,
        gallons: log.fuel_quantity,
        cost_per_gallon: log.fuel_cost_per_unit,
        total_cost: log.total_fuel_cost,
        odometer: log.odometer_reading,
        fuel_station: log.fuel_station,
        driver: log.driver_name,
        notes: log.notes
      })),
      summary: {
        total_records: summary.total_records,
        total_gallons: summary.total_gallons ? parseFloat(summary.total_gallons).toFixed(2) : 0,
        total_cost: summary.total_cost ? parseFloat(summary.total_cost).toFixed(2) : 0,
        average_cost_per_gallon: summary.avg_cost_per_gallon ? parseFloat(summary.avg_cost_per_gallon).toFixed(2) : 0,
        last_fuel_date: summary.last_fuel_date,
        first_fuel_date: summary.first_fuel_date,
        fuel_efficiency: fuelEfficiency ? fuelEfficiency.toFixed(1) + ' mpg' : null
      }
    };

    res.json({
      success: true,
      message: 'Fuel logs retrieved successfully',
      data: response,
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
    const fuelLogData = req.body;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id, fuel_type, fuel_capacity FROM vehicles WHERE id = ? AND is_active = TRUE',
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

    // Validate fuel type matches vehicle
    if (fuelLogData.fuel_type && fuelLogData.fuel_type !== vehicle.fuel_type) {
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
      const fuelLogId = uuidv4();
      const insertFuelLogQuery = `
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
        fuelLogData.fuel_date,
        fuelLogData.fuel_time || null,
        fuelLogData.fuel_station || null,
        fuelLogData.fuel_station_address || null,
        fuelLogData.fuel_type || vehicle.fuel_type,
        fuelLogData.fuel_quantity,
        fuelLogData.fuel_quantity_units || 'gallons',
        fuelLogData.fuel_cost_per_unit,
        fuelLogData.total_fuel_cost,
        fuelLogData.odometer_reading,
        fuelLogData.fuel_level_before || null,
        fuelLogData.fuel_level_after || null,
        fuelLogData.driver_id || null,
        fuelLogData.driver_name || null,
        fuelLogData.notes || null
      ];

      await connection.execute(insertFuelLogQuery, insertParams);

      // Update vehicle current fuel level if provided
      if (fuelLogData.fuel_level_after !== undefined) {
        await connection.execute(
          'UPDATE vehicles SET current_fuel_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [fuelLogData.fuel_level_after, id]
        );
      }

      // Update vehicle mileage if new odometer reading is higher
      if (fuelLogData.odometer_reading) {
        await connection.execute(
          'UPDATE vehicles SET mileage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND mileage < ?',
          [fuelLogData.odometer_reading, id, fuelLogData.odometer_reading]
        );
      }

      // Insert cost record
      const costId = uuidv4();
      const insertCostQuery = `
        INSERT INTO vehicle_costs (
          id, vehicle_id, cost_date, cost_type, cost_category, description,
          amount, quantity, unit_cost, vendor, odometer_reading, fuel_log_id
        ) VALUES (?, ?, ?, 'fuel', 'fuel', 'Fuel purchase', ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(insertCostQuery, [
        costId,
        id,
        fuelLogData.fuel_date,
        fuelLogData.total_fuel_cost,
        fuelLogData.fuel_quantity,
        fuelLogData.fuel_cost_per_unit,
        fuelLogData.fuel_station || 'Unknown',
        fuelLogData.odometer_reading,
        fuelLogId
      ]);

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Fuel log added successfully',
        data: {
          fuel_log_id: fuelLogId,
          vehicle_id: id,
          total_cost: fuelLogData.total_fuel_cost,
          gallons: fuelLogData.fuel_quantity,
          cost_record_id: costId
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
      'SELECT id, fuel_quantity, total_fuel_cost, odometer_reading FROM vehicle_fuel_logs WHERE id = ? AND vehicle_id = ?',
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

    updateParams.push(fuelLogId);

    const updateQuery = `UPDATE vehicle_fuel_logs SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.execute(updateQuery, updateParams);

    // Update related cost record if fuel cost changed
    if (updateData.total_fuel_cost !== undefined || updateData.fuel_quantity !== undefined) {
      const newTotalCost = updateData.total_fuel_cost || existingFuelLog.total_fuel_cost;
      const newQuantity = updateData.fuel_quantity || existingFuelLog.fuel_quantity;
      
      await db.execute(
        'UPDATE vehicle_costs SET amount = ?, quantity = ? WHERE fuel_log_id = ?',
        [newTotalCost, newQuantity, fuelLogId]
      );
    }

    // Update vehicle fuel level if changed
    if (updateData.fuel_level_after !== undefined) {
      await db.execute(
        'UPDATE vehicles SET current_fuel_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [updateData.fuel_level_after, id]
      );
    }

    // Update vehicle mileage if odometer reading changed
    if (updateData.odometer_reading && updateData.odometer_reading > existingFuelLog.odometer_reading) {
      await db.execute(
        'UPDATE vehicles SET mileage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [updateData.odometer_reading, id]
      );
    }

    res.json({
      success: true,
      message: 'Fuel log updated successfully',
      data: {
        fuel_log_id: fuelLogId,
        vehicle_id: id,
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

      // Delete related cost record
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
