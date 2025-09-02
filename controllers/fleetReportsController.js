const mysql = require('mysql2/promise');
const db = require('../config/database');

/**
 * Fleet Reports Controller
 * Handles all fleet reporting and analytics operations for the Fleet Management API
 */

/**
 * Get a summary report of all fleet operations and metrics
 */
async function getFleetSummaryReport(req, res) {
  try {
    const {
      date_from,
      date_to,
      vehicle_type,
      format = 'json'
    } = req.query;

    // Validate required parameters
    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'Date range is required for fleet summary report',
        error: 'MISSING_DATE_RANGE',
        timestamp: new Date().toISOString()
      });
    }

    // Build WHERE clause for vehicle type filtering
    let vehicleTypeFilter = '';
    const params = [date_from, date_to];
    
    if (vehicle_type) {
      vehicleTypeFilter = 'AND v.vehicle_type = ?';
      params.push(vehicle_type);
    }

    // Get fleet overview
    const fleetOverviewQuery = `
      SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_vehicles,
        SUM(CASE WHEN status = 'in-use' THEN 1 ELSE 0 END) as in_use_vehicles,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_vehicles,
        SUM(CASE WHEN status = 'out-of-service' THEN 1 ELSE 0 END) as out_of_service_vehicles,
        SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END) as retired_vehicles,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved_vehicles
      FROM vehicles v
      WHERE v.is_active = TRUE ${vehicleTypeFilter}
    `;

    const [fleetOverview] = await db.execute(fleetOverviewQuery, vehicle_type ? [vehicle_type] : []);

    // Get vehicle types breakdown
    const vehicleTypesQuery = `
      SELECT 
        vehicle_type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN status = 'in-use' THEN 1 ELSE 0 END) as in_use_count,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count
      FROM vehicles
      WHERE is_active = TRUE ${vehicleTypeFilter}
      GROUP BY vehicle_type
      ORDER BY count DESC
    `;

    const [vehicleTypes] = await db.execute(vehicleTypesQuery, vehicle_type ? [vehicle_type] : []);

    // Get operational metrics
    const operationalMetricsQuery = `
      SELECT 
        COUNT(DISTINCT va.vehicle_id) as vehicles_with_assignments,
        COUNT(va.id) as total_assignments,
        SUM(CASE WHEN va.status = 'active' THEN 1 ELSE 0 END) as active_assignments,
        SUM(CASE WHEN va.status = 'completed' THEN 1 ELSE 0 END) as completed_assignments,
        AVG(CASE WHEN va.end_date IS NOT NULL AND va.start_date IS NOT NULL 
             THEN DATEDIFF(va.end_date, va.start_date) END) as avg_assignment_duration
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      WHERE va.start_date >= ? AND va.start_date <= ? 
        AND v.is_active = TRUE ${vehicleTypeFilter}
    `;

    const [operationalMetrics] = await db.execute(operationalMetricsQuery, params);

    // Get fuel summary
    const fuelSummaryQuery = `
      SELECT 
        COUNT(*) as total_fuel_logs,
        SUM(fuel_quantity) as total_fuel_consumed,
        SUM(total_fuel_cost) as total_fuel_cost,
        AVG(fuel_cost_per_unit) as avg_fuel_cost_per_unit,
        SUM(CASE WHEN fuel_type = 'gasoline' THEN fuel_quantity ELSE 0 END) as gasoline_consumed,
        SUM(CASE WHEN fuel_type = 'diesel' THEN fuel_quantity ELSE 0 END) as diesel_consumed,
        SUM(CASE WHEN fuel_type = 'electric' THEN fuel_quantity ELSE 0 END) as electric_consumed
      FROM vehicle_fuel_logs vfl
      JOIN vehicles v ON vfl.vehicle_id = v.id
      WHERE vfl.fuel_date >= ? AND vfl.fuel_date <= ? 
        AND v.is_active = TRUE ${vehicleTypeFilter}
    `;

    const [fuelSummary] = await db.execute(fuelSummaryQuery, params);

    // Get maintenance summary
    const maintenanceSummaryQuery = `
      SELECT 
        COUNT(*) as total_maintenance_records,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_maintenance,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_maintenance,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_maintenance,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_maintenance,
        SUM(estimated_cost) as total_estimated_cost,
        SUM(actual_cost) as total_actual_cost,
        AVG(actual_cost) as avg_maintenance_cost
      FROM vehicle_maintenance vm
      JOIN vehicles v ON vm.vehicle_id = v.id
      WHERE vm.scheduled_date >= ? AND vm.scheduled_date <= ? 
        AND v.is_active = TRUE ${vehicleTypeFilter}
    `;

    const [maintenanceSummary] = await db.execute(maintenanceSummaryQuery, params);

    // Get driver assignments summary
    const driverAssignmentsQuery = `
      SELECT 
        COUNT(DISTINCT va.crew_id) as unique_crews_assigned,
        COUNT(DISTINCT va.job_id) as unique_jobs_assigned,
        SUM(CASE WHEN va.assignment_type = 'crew' THEN 1 ELSE 0 END) as crew_assignments,
        SUM(CASE WHEN va.assignment_type = 'job' THEN 1 ELSE 0 END) as job_assignments,
        SUM(CASE WHEN va.assignment_type = 'maintenance' THEN 1 ELSE 0 END) as maintenance_assignments
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      WHERE va.start_date >= ? AND va.start_date <= ? 
        AND v.is_active = TRUE ${vehicleTypeFilter}
    `;

    const [driverAssignments] = await db.execute(driverAssignmentsQuery, params);

    // Calculate utilization rate
    const totalActiveVehicles = fleetOverview[0].available_vehicles + fleetOverview[0].in_use_vehicles;
    const utilizationRate = totalActiveVehicles > 0 
      ? ((fleetOverview[0].in_use_vehicles / totalActiveVehicles) * 100).toFixed(2)
      : 0;

    // Format response
    const response = {
      report_period: {
        date_from,
        date_to,
        generated_at: new Date().toISOString()
      },
      fleet_overview: fleetOverview[0],
      vehicle_types: vehicleTypes,
      operational_metrics: {
        ...operationalMetrics[0],
        utilization_rate_percent: utilizationRate
      },
      fuel_summary: fuelSummary[0],
      maintenance_summary: maintenanceSummary[0],
      driver_assignments: driverAssignments[0]
    };

    if (format === 'pdf') {
      // TODO: Implement PDF generation
      return res.status(501).json({
        success: false,
        message: 'PDF format not yet implemented',
        error: 'PDF_NOT_IMPLEMENTED',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Fleet summary report generated successfully',
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating fleet summary report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate fleet summary report',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get detailed performance metrics for fleet operations
 */
async function getFleetPerformanceReport(req, res) {
  try {
    const {
      date_from,
      date_to,
      vehicle_id,
      crew_id,
      format = 'json'
    } = req.query;

    // Validate required parameters
    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'Date range is required for fleet performance report',
        error: 'MISSING_DATE_RANGE',
        timestamp: new Date().toISOString()
      });
    }

    // Build WHERE clause for filtering
    let vehicleFilter = '';
    let crewFilter = '';
    const params = [date_from, date_to];
    
    if (vehicle_id) {
      vehicleFilter = 'AND v.id = ?';
      params.push(vehicle_id);
    }
    
    if (crew_id) {
      crewFilter = 'AND va.crew_id = ?';
      params.push(crew_id);
    }

    // Get vehicle performance metrics
    const vehiclePerformanceQuery = `
      SELECT 
        v.id,
        v.name,
        v.make,
        v.model,
        v.license_plate,
        v.vehicle_type,
        v.status,
        v.mileage,
        COUNT(va.id) as total_assignments,
        SUM(CASE WHEN va.status = 'completed' THEN 1 ELSE 0 END) as completed_assignments,
        SUM(CASE WHEN va.status = 'active' THEN 1 ELSE 0 END) as active_assignments,
        AVG(CASE WHEN va.end_date IS NOT NULL AND va.start_date IS NOT NULL 
             THEN DATEDIFF(va.end_date, va.start_date) END) as avg_assignment_duration,
        SUM(vfl.fuel_quantity) as total_fuel_consumed,
        SUM(vfl.total_fuel_cost) as total_fuel_cost,
        AVG(vfl.fuel_cost_per_unit) as avg_fuel_cost_per_unit,
        COUNT(vm.id) as total_maintenance_records,
        SUM(vm.actual_cost) as total_maintenance_cost,
        AVG(vm.actual_cost) as avg_maintenance_cost
      FROM vehicles v
      LEFT JOIN vehicle_assignments va ON v.id = va.vehicle_id 
        AND va.start_date >= ? AND va.start_date <= ?
      LEFT JOIN vehicle_fuel_logs vfl ON v.id = vfl.vehicle_id 
        AND vfl.fuel_date >= ? AND vfl.fuel_date <= ?
      LEFT JOIN vehicle_maintenance vm ON v.id = vm.vehicle_id 
        AND vm.scheduled_date >= ? AND vm.scheduled_date <= ?
      WHERE v.is_active = TRUE ${vehicleFilter}
      GROUP BY v.id, v.name, v.make, v.model, v.license_plate, v.vehicle_type, v.status, v.mileage
      ORDER BY total_assignments DESC
    `;

    const [vehiclePerformance] = await db.execute(vehiclePerformanceQuery, [...params, ...params, ...params]);

    // Get crew performance metrics
    const crewPerformanceQuery = `
      SELECT 
        va.crew_id,
        COUNT(DISTINCT va.vehicle_id) as vehicles_assigned,
        COUNT(va.id) as total_assignments,
        SUM(CASE WHEN va.status = 'completed' THEN 1 ELSE 0 END) as completed_assignments,
        SUM(CASE WHEN va.status = 'active' THEN 1 ELSE 0 END) as active_assignments,
        AVG(CASE WHEN va.end_date IS NOT NULL AND va.start_date IS NOT NULL 
             THEN DATEDIFF(va.end_date, va.start_date) END) as avg_assignment_duration,
        SUM(CASE WHEN va.end_mileage IS NOT NULL AND va.start_mileage IS NOT NULL 
             THEN va.end_mileage - va.start_mileage END) as total_miles_driven
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      WHERE va.start_date >= ? AND va.start_date <= ? 
        AND v.is_active = TRUE ${crewFilter}
      GROUP BY va.crew_id
      ORDER BY total_assignments DESC
    `;

    const [crewPerformance] = await db.execute(crewPerformanceQuery, params);

    // Get cost analysis
    const costAnalysisQuery = `
      SELECT 
        vc.cost_type,
        vc.cost_category,
        COUNT(*) as transaction_count,
        SUM(vc.amount) as total_cost,
        AVG(vc.amount) as avg_cost,
        MIN(vc.amount) as min_cost,
        MAX(vc.amount) as max_cost
      FROM vehicle_costs vc
      JOIN vehicles v ON vc.vehicle_id = v.id
      WHERE vc.cost_date >= ? AND vc.cost_date <= ? 
        AND v.is_active = TRUE ${vehicleFilter}
      GROUP BY vc.cost_type, vc.cost_category
      ORDER BY total_cost DESC
    `;

    const [costAnalysis] = await db.execute(costAnalysisQuery, params);

    // Calculate efficiency metrics
    const efficiencyMetrics = vehiclePerformance.map(vehicle => {
      const fuelEfficiency = vehicle.total_fuel_consumed > 0 && vehicle.mileage > 0
        ? (vehicle.mileage / vehicle.total_fuel_consumed).toFixed(2)
        : null;
      
      const costPerMile = vehicle.total_fuel_cost > 0 && vehicle.mileage > 0
        ? (vehicle.total_fuel_cost / vehicle.mileage).toFixed(2)
        : null;

      return {
        ...vehicle,
        fuel_efficiency_mpg: fuelEfficiency,
        cost_per_mile: costPerMile
      };
    });

    // Format response
    const response = {
      report_period: {
        date_from,
        date_to,
        generated_at: new Date().toISOString()
      },
      filters: {
        vehicle_id: vehicle_id || 'all',
        crew_id: crew_id || 'all'
      },
      vehicle_performance: efficiencyMetrics,
      crew_performance: crewPerformance,
      cost_analysis: costAnalysis
    };

    if (format === 'pdf') {
      // TODO: Implement PDF generation
      return res.status(501).json({
        success: false,
        message: 'PDF format not yet implemented',
        error: 'PDF_NOT_IMPLEMENTED',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Fleet performance report generated successfully',
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating fleet performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate fleet performance report',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get fleet insights and actionable recommendations
 */
async function getFleetInsights(req, res) {
  try {
    const {
      date_from,
      date_to,
      format = 'json'
    } = req.query;

    // Validate required parameters
    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'Date range is required for fleet insights',
        error: 'MISSING_DATE_RANGE',
        timestamp: new Date().toISOString()
      });
    }

    const params = [date_from, date_to];

    // Get maintenance insights
    const maintenanceInsightsQuery = `
      SELECT 
        vm.maintenance_type,
        COUNT(*) as count,
        AVG(vm.actual_cost) as avg_cost,
        SUM(vm.actual_cost) as total_cost,
        AVG(CASE WHEN vm.completed_date IS NOT NULL AND vm.scheduled_date IS NOT NULL 
             THEN DATEDIFF(vm.completed_date, vm.scheduled_date) END) as avg_days_to_complete,
        SUM(CASE WHEN vm.status = 'deferred' THEN 1 ELSE 0 END) as deferred_count
      FROM vehicle_maintenance vm
      JOIN vehicles v ON vm.vehicle_id = v.id
      WHERE vm.scheduled_date >= ? AND vm.scheduled_date <= ? 
        AND v.is_active = TRUE
      GROUP BY vm.maintenance_type
      ORDER BY count DESC
    `;

    const [maintenanceInsights] = await db.execute(maintenanceInsightsQuery, params);

    // Get fuel insights
    const fuelInsightsQuery = `
      SELECT 
        vfl.fuel_type,
        COUNT(*) as refuel_count,
        SUM(vfl.fuel_quantity) as total_quantity,
        AVG(vfl.fuel_cost_per_unit) as avg_cost_per_unit,
        SUM(vfl.total_fuel_cost) as total_cost,
        AVG(vfl.fuel_quantity) as avg_refuel_quantity,
        MIN(vfl.fuel_cost_per_unit) as min_cost_per_unit,
        MAX(vfl.fuel_cost_per_unit) as max_cost_per_unit
      FROM vehicle_fuel_logs vfl
      JOIN vehicles v ON vfl.vehicle_id = v.id
      WHERE vfl.fuel_date >= ? AND vfl.fuel_date <= ? 
        AND v.is_active = TRUE
      GROUP BY vfl.fuel_type
      ORDER BY total_cost DESC
    `;

    const [fuelInsights] = await db.execute(fuelInsightsQuery, params);

    // Get utilization insights
    const utilizationInsightsQuery = `
      SELECT 
        v.vehicle_type,
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN v.status = 'in-use' THEN 1 ELSE 0 END) as in_use_count,
        SUM(CASE WHEN v.status = 'available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN v.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count,
        ROUND((SUM(CASE WHEN v.status = 'in-use' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as utilization_rate
      FROM vehicles v
      WHERE v.is_active = TRUE
      GROUP BY v.vehicle_type
      ORDER BY utilization_rate DESC
    `;

    const [utilizationInsights] = await db.execute(utilizationInsightsQuery);

    // Get cost trend insights
    const costTrendInsightsQuery = `
      SELECT 
        DATE_FORMAT(vc.cost_date, '%Y-%m') as month,
        vc.cost_type,
        SUM(vc.amount) as total_cost,
        COUNT(*) as transaction_count
      FROM vehicle_costs vc
      JOIN vehicles v ON vc.vehicle_id = v.id
      WHERE vc.cost_date >= ? AND vc.cost_date <= ? 
        AND v.is_active = TRUE
      GROUP BY DATE_FORMAT(vc.cost_date, '%Y-%m'), vc.cost_type
      ORDER BY month DESC, total_cost DESC
    `;

    const [costTrendInsights] = await db.execute(costTrendInsightsQuery, params);

    // Generate actionable recommendations
    const recommendations = [];

    // Maintenance recommendations
    const highCostMaintenance = maintenanceInsights.filter(item => item.avg_cost > 500);
    if (highCostMaintenance.length > 0) {
      recommendations.push({
        category: 'maintenance',
        priority: 'high',
        title: 'High-Cost Maintenance Types Detected',
        description: `Maintenance types with average costs over $500: ${highCostMaintenance.map(item => item.maintenance_type).join(', ')}`,
        action: 'Review maintenance schedules and consider preventive maintenance strategies',
        potential_savings: 'Reduce unexpected high-cost repairs through preventive maintenance'
      });
    }

    // Fuel recommendations
    const fuelCostVariation = fuelInsights.filter(item => 
      (item.max_cost_per_unit - item.min_cost_per_unit) > 0.50
    );
    if (fuelCostVariation.length > 0) {
      recommendations.push({
        category: 'fuel',
        priority: 'medium',
        title: 'Fuel Cost Variation Detected',
        description: `Significant variation in fuel costs for: ${fuelCostVariation.map(item => item.fuel_type).join(', ')}`,
        action: 'Implement fuel purchasing strategies and negotiate better rates',
        potential_savings: 'Standardize fuel costs and reduce overall fuel expenses'
      });
    }

    // Utilization recommendations
    const lowUtilization = utilizationInsights.filter(item => item.utilization_rate < 50);
    if (lowUtilization.length > 0) {
      recommendations.push({
        category: 'utilization',
        priority: 'medium',
        title: 'Low Vehicle Utilization Detected',
        description: `Vehicle types with utilization below 50%: ${lowUtilization.map(item => item.vehicle_type).join(', ')}`,
        action: 'Review fleet size and consider consolidation or reassignment',
        potential_savings: 'Reduce fleet size and associated costs'
      });
    }

    // Cost trend recommendations
    const increasingCosts = costTrendInsights.filter((item, index, array) => {
      if (index === 0) return false;
      const previousMonth = array[index - 1];
      return item.cost_type === previousMonth.cost_type && 
             item.total_cost > previousMonth.total_cost * 1.2; // 20% increase
    });
    
    if (increasingCosts.length > 0) {
      recommendations.push({
        category: 'cost_management',
        priority: 'high',
        title: 'Increasing Cost Trends Detected',
        description: `Costs increasing by more than 20% month-over-month for: ${[...new Set(increasingCosts.map(item => item.cost_type))].join(', ')}`,
        action: 'Investigate cost drivers and implement cost control measures',
        potential_savings: 'Identify and address root causes of cost increases'
      });
    }

    // Format response
    const response = {
      report_period: {
        date_from,
        date_to,
        generated_at: new Date().toISOString()
      },
      insights: {
        maintenance: maintenanceInsights,
        fuel: fuelInsights,
        utilization: utilizationInsights,
        cost_trends: costTrendInsights
      },
      recommendations: recommendations,
      summary: {
        total_recommendations: recommendations.length,
        high_priority: recommendations.filter(r => r.priority === 'high').length,
        medium_priority: recommendations.filter(r => r.priority === 'medium').length,
        low_priority: recommendations.filter(r => r.priority === 'low').length
      }
    };

    if (format === 'pdf') {
      // TODO: Implement PDF generation
      return res.status(501).json({
        success: false,
        message: 'PDF format not yet implemented',
        error: 'PDF_NOT_IMPLEMENTED',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Fleet insights generated successfully',
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating fleet insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate fleet insights',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getFleetSummaryReport,
  getFleetPerformanceReport,
  getFleetInsights
};
