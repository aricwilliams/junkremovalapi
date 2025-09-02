const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/database');

// Helper function to build WHERE clause for employee queries
function buildEmployeeWhereClause(params) {
  const conditions = [];
  const values = [];

  if (params.search) {
    conditions.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.phone LIKE ?)');
    const searchTerm = `%${params.search}%`;
    values.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (params.status) {
    conditions.push('e.status = ?');
    values.push(params.status);
  }

  if (params.department) {
    conditions.push('e.department = ?');
    values.push(params.department);
  }

  if (params.position) {
    conditions.push('e.position = ?');
    values.push(params.position);
  }

  if (params.hire_date_from) {
    conditions.push('e.hire_date >= ?');
    values.push(params.hire_date_from);
  }

  if (params.hire_date_to) {
    conditions.push('e.hire_date <= ?');
    values.push(params.hire_date_to);
  }

  // Always filter by active employees unless specifically requesting terminated
  if (params.status !== 'terminated') {
    conditions.push('e.is_active = TRUE');
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values
  };
}

// Helper function to build ORDER BY clause
function buildEmployeeOrderClause(sortBy, sortOrder) {
  const validSortFields = {
    'first_name': 'e.first_name',
    'last_name': 'e.last_name',
    'hire_date': 'e.hire_date',
    'department': 'e.department',
    'position': 'e.position',
    'status': 'e.status'
  };

  const field = validSortFields[sortBy] || 'e.last_name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
  
  return `ORDER BY ${field} ${order}`;
}

/**
 * Get all employees with filtering, sorting, and pagination
 */
async function getAllEmployees(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      department,
      position,
      hire_date_from,
      hire_date_to,
      sort_by = 'last_name',
      sort_order = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;
    const { whereClause, values } = buildEmployeeWhereClause({
      search, status, department, position, hire_date_from, hire_date_to
    });
    const orderClause = buildEmployeeOrderClause(sort_by, sort_order);

    const connection = await mysql.createConnection(config);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      ${whereClause}
    `;
    const [countResult] = await connection.execute(countQuery, values);
    const total = countResult[0].total;

    // Get employees with pagination
    const employeesQuery = `
      SELECT 
        e.id,
        e.employee_number,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.department,
        e.position,
        e.status,
        e.hire_date,
        e.assigned_truck_id,
        e.assigned_crew_id,
        e.supervisor_id,
        e.created_at,
        CONCAT(s.first_name, ' ', s.last_name) as supervisor_name,
        CONCAT(v.make, ' ', v.model) as assigned_vehicle_name
      FROM employees e
      LEFT JOIN employees s ON e.supervisor_id = s.id
      LEFT JOIN vehicles v ON e.assigned_truck_id = v.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const [employees] = await connection.execute(employeesQuery, [...values, parseInt(limit), offset]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_employees,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_employees,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_employees,
        SUM(CASE WHEN status = 'terminated' THEN 1 ELSE 0 END) as terminated_employees,
        SUM(CASE WHEN status = 'on-leave' THEN 1 ELSE 0 END) as on_leave_employees,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_employees,
        SUM(CASE WHEN status = 'probation' THEN 1 ELSE 0 END) as probation_employees
      FROM employees
      WHERE is_active = TRUE
    `;
    const [summaryResult] = await connection.execute(summaryQuery);
    const summary = summaryResult[0];

    // Get department breakdown
    const deptQuery = `
      SELECT 
        department,
        COUNT(*) as count
      FROM employees
      WHERE is_active = TRUE
      GROUP BY department
    `;
    const [deptResult] = await connection.execute(deptQuery);
    const departments = {};
    deptResult.forEach(dept => {
      departments[dept.department] = dept.count;
    });

    await connection.end();

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: 'Employees retrieved successfully',
      data: {
        employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: totalPages
        },
        summary: {
          total_employees: summary.total_employees,
          active_employees: summary.active_employees,
          inactive_employees: summary.inactive_employees,
          terminated_employees: summary.terminated_employees,
          on_leave_employees: summary.on_leave_employees,
          suspended_employees: summary.suspended_employees,
          probation_employees: summary.probation_employees,
          departments
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get employee by ID with all related information
 */
async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;

    const connection = await mysql.createConnection(config);

    // Get basic employee information
    const employeeQuery = `
      SELECT 
        e.*,
        CONCAT(s.first_name, ' ', s.last_name) as supervisor_name,
        CONCAT(v.make, ' ', v.model) as assigned_vehicle_name,
        c.name as crew_name
      FROM employees e
      LEFT JOIN employees s ON e.supervisor_id = s.id
      LEFT JOIN vehicles v ON e.assigned_truck_id = v.id
      LEFT JOIN crews c ON e.assigned_crew_id = c.id
      WHERE e.id = ? AND e.is_active = TRUE
    `;
    const [employees] = await connection.execute(employeeQuery, [id]);

    if (employees.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
        error: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const employee = employees[0];

    // Get emergency contacts
    const contactsQuery = `
      SELECT * FROM employee_emergency_contacts 
      WHERE employee_id = ? AND is_primary = TRUE
      ORDER BY contact_type
    `;
    const [contacts] = await connection.execute(contactsQuery, [id]);

    // Get current pay rate
    const payRateQuery = `
      SELECT * FROM employee_pay_rates 
      WHERE employee_id = ? AND is_current = TRUE
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    const [payRates] = await connection.execute(payRateQuery, [id]);

    // Get current schedule
    const scheduleQuery = `
      SELECT * FROM employee_schedules 
      WHERE employee_id = ? AND effective_date <= CURDATE() 
      AND (end_date IS NULL OR end_date >= CURDATE())
      ORDER BY day_of_week
    `;
    const [schedules] = await connection.execute(scheduleQuery, [id]);

    // Get latest performance review
    const performanceQuery = `
      SELECT * FROM employee_performance 
      WHERE employee_id = ? 
      ORDER BY review_date DESC 
      LIMIT 1
    `;
    const [performances] = await connection.execute(performanceQuery, [id]);

    // Get recent time logs
    const timeLogsQuery = `
      SELECT * FROM employee_time_logs 
      WHERE employee_id = ? 
      ORDER BY log_date DESC 
      LIMIT 10
    `;
    const [timeLogs] = await connection.execute(timeLogsQuery, [id]);

    // Get certifications
    const certQuery = `
      SELECT * FROM employee_certifications 
      WHERE employee_id = ? AND status = 'active'
      ORDER BY expiry_date ASC
    `;
    const [certifications] = await connection.execute(certQuery, [id]);

    // Get benefits
    const benefitsQuery = `
      SELECT * FROM employee_benefits 
      WHERE employee_id = ? AND is_active = TRUE
      ORDER BY start_date DESC
    `;
    const [benefits] = await connection.execute(benefitsQuery, [id]);

    await connection.end();

    // Calculate hourly rate from salary if not set
    let hourlyRate = payRates[0]?.base_rate;
    if (!hourlyRate && employee.current_salary) {
      hourlyRate = (employee.current_salary / 2080).toFixed(2); // Assuming 40 hours/week * 52 weeks
    }

    // Calculate overtime rate
    const overtimeRate = hourlyRate ? (hourlyRate * 1.5).toFixed(2) : null;

    // Calculate attendance rate from time logs
    let attendanceRate = null;
    if (timeLogs.length > 0) {
      const presentDays = timeLogs.filter(log => log.status === 'present').length;
      attendanceRate = ((presentDays / timeLogs.length) * 100).toFixed(1);
    }

    // Calculate safety score (placeholder - would be based on incidents)
    const safetyScore = 95.0; // This would be calculated from incident data

    const employeeData = {
      id: employee.id,
      employee_id: employee.employee_number,
      personal_info: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        city: employee.city,
        state: employee.state,
        zip_code: employee.zip_code,
        country: employee.country,
        emergency_contact: contacts[0] || null
      },
      employment_info: {
        department: employee.department,
        position: employee.position,
        status: employee.status,
        hire_date: employee.hire_date,
        termination_date: employee.termination_date,
        supervisor: employee.supervisor_id,
        supervisor_name: employee.supervisor_name,
        work_location: `${employee.city}, ${employee.state}`
      },
      compensation: {
        current_salary: employee.current_salary,
        hourly_rate: hourlyRate,
        overtime_rate: overtimeRate,
        last_raise_date: null, // Would be tracked in pay rate history
        raise_amount: null,
        bonus_eligible: employee.employee_type === 'regular' || employee.employee_type === 'manager'
      },
      schedule: {
        work_schedule: 'monday_friday', // Would be calculated from schedules
        start_time: schedules[0]?.start_time || '08:00',
        end_time: schedules[0]?.end_time || '17:00',
        break_duration: 60,
        overtime_eligible: true,
        preferred_shifts: ['morning', 'afternoon']
      },
      assignments: {
        assigned_vehicle: employee.assigned_truck_id,
        assigned_vehicle_name: employee.assigned_vehicle_name,
        crew_assignment: employee.assigned_crew_id,
        crew_name: employee.crew_name,
        territory: `${employee.city} Metro Area`
      },
      performance: {
        performance_rating: performances[0]?.overall_rating || null,
        last_review_date: performances[0]?.review_date || null,
        next_review_date: performances[0]?.next_review_date || null,
        attendance_rate: attendanceRate,
        safety_score: safetyScore
      },
      created: employee.created_at,
      updated: employee.updated_at
    };

    res.json({
      success: true,
      message: 'Employee retrieved successfully',
      data: {
        employee: employeeData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create a new employee
 */
async function createEmployee(req, res) {
  try {
    const {
      personal_info,
      employment_info,
      compensation,
      schedule
    } = req.body;

    const connection = await mysql.createConnection(config);

    // Generate employee ID and number
    const employeeId = uuidv4();
    const employeeNumber = `EMP-${Date.now().toString().slice(-6)}`;

    // Insert employee record
    const insertQuery = `
      INSERT INTO employees (
        id, employee_number, first_name, last_name, email, phone, 
        address, city, state, zip_code, country, employee_type, 
        position, status, hire_date, department, notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `;

    const address = `${personal_info.address || ''}, ${employment_info.work_location || ''}`;
    const city = employment_info.work_location?.split(',')[0]?.trim() || 'Wilmington';
    const state = employment_info.work_location?.split(',')[1]?.trim() || 'NC';
    const zipCode = '28401'; // Default zip code

    await connection.execute(insertQuery, [
      employeeId,
      employeeNumber,
      personal_info.first_name,
      personal_info.last_name,
      personal_info.email,
      personal_info.phone,
      address,
      city,
      state,
      zipCode,
      'USA',
      'regular',
      employment_info.position,
      'active',
      employment_info.hire_date,
      employment_info.department,
      'New employee created via API',
      true
    ]);

    // Insert pay rate record
    if (compensation.hourly_rate) {
      const payRateId = uuidv4();
      const payRateQuery = `
        INSERT INTO employee_pay_rates (
          id, employee_id, pay_type, base_rate, overtime_rate, 
          overtime_multiplier, effective_date, is_current
        ) VALUES (?, ?, 'hourly', ?, ?, 1.5, ?, TRUE)
      `;
      
      const overtimeRate = compensation.overtime_rate || (compensation.hourly_rate * 1.5);
      await connection.execute(payRateQuery, [
        payRateId,
        employeeId,
        compensation.hourly_rate,
        overtimeRate,
        employment_info.hire_date
      ]);
    }

    // Insert basic schedule
    const scheduleId = uuidv4();
    const scheduleQuery = `
      INSERT INTO employee_schedules (
        id, employee_id, schedule_type, day_of_week, start_time, 
        end_time, break_start, break_end, effective_date, is_available
      ) VALUES (?, ?, 'regular', 'monday', ?, ?, '12:00:00', '13:00:00', ?, TRUE)
    `;
    
    await connection.execute(scheduleQuery, [
      scheduleId,
      employeeId,
      schedule.start_time,
      schedule.end_time,
      employment_info.hire_date
    ]);

    await connection.end();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        employee_id: employeeId,
        employee: {
          id: employeeId,
          employee_id: employeeNumber,
          first_name: personal_info.first_name,
          last_name: personal_info.last_name,
          department: employment_info.department,
          position: employment_info.position,
          status: 'active',
          created: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Employee with this email already exists',
        error: 'DUPLICATE_EMAIL',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update an existing employee
 */
async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const connection = await mysql.createConnection(config);

    // Check if employee exists
    const checkQuery = 'SELECT id FROM employees WHERE id = ? AND is_active = TRUE';
    const [employees] = await connection.execute(checkQuery, [id]);

    if (employees.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
        error: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const updatedFields = [];
    const updateValues = [];

    // Build update query dynamically
    if (updateData.personal_info) {
      if (updateData.personal_info.first_name) {
        updatedFields.push('first_name = ?');
        updateValues.push(updateData.personal_info.first_name);
      }
      if (updateData.personal_info.last_name) {
        updatedFields.push('last_name = ?');
        updateValues.push(updateData.personal_info.last_name);
      }
      if (updateData.personal_info.email) {
        updatedFields.push('email = ?');
        updateValues.push(updateData.personal_info.email);
      }
      if (updateData.personal_info.phone) {
        updatedFields.push('phone = ?');
        updateValues.push(updateData.personal_info.phone);
      }
    }

    if (updateData.employment_info) {
      if (updateData.employment_info.department) {
        updatedFields.push('department = ?');
        updateValues.push(updateData.employment_info.department);
      }
      if (updateData.employment_info.position) {
        updatedFields.push('position = ?');
        updateValues.push(updateData.employment_info.position);
      }
      if (updateData.employment_info.supervisor) {
        updatedFields.push('supervisor_id = ?');
        updateValues.push(updateData.employment_info.supervisor);
      }
    }

    if (updatedFields.length === 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_UPDATE_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    // Update employee record
    updatedFields.push('updated_at = CURRENT_TIMESTAMP');
    const updateQuery = `UPDATE employees SET ${updatedFields.join(', ')} WHERE id = ?`;
    updateValues.push(id);

    await connection.execute(updateQuery, updateValues);

    // Update pay rate if compensation changed
    if (updateData.compensation && (updateData.compensation.hourly_rate || updateData.compensation.current_salary)) {
      // End current pay rate
      await connection.execute(
        'UPDATE employee_pay_rates SET is_current = FALSE, end_date = CURDATE() WHERE employee_id = ? AND is_current = TRUE',
        [id]
      );

      // Insert new pay rate
      const payRateId = uuidv4();
      const newRate = updateData.compensation.hourly_rate || (updateData.compensation.current_salary / 2080);
      const overtimeRate = updateData.compensation.overtime_rate || (newRate * 1.5);

      const payRateQuery = `
        INSERT INTO employee_pay_rates (
          id, employee_id, pay_type, base_rate, overtime_rate, 
          overtime_multiplier, effective_date, is_current
        ) VALUES (?, ?, 'hourly', ?, ?, 1.5, CURDATE(), TRUE)
      `;
      
      await connection.execute(payRateQuery, [payRateId, id, newRate, overtimeRate]);
      updatedFields.push('compensation');
    }

    // Update schedule if changed
    if (updateData.schedule) {
      const scheduleQuery = `
        UPDATE employee_schedules 
        SET start_time = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ? AND day_of_week = 'monday' AND effective_date <= CURDATE()
      `;
      
      await connection.execute(scheduleQuery, [
        updateData.schedule.start_time || '08:00:00',
        updateData.schedule.end_time || '17:00:00',
        id
      ]);
      updatedFields.push('schedule');
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        employee_id: id,
        updated_fields: updatedFields.filter(field => field !== 'updated_at')
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete an employee (soft delete - sets status to 'terminated')
 */
async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;

    const connection = await mysql.createConnection(config);

    // Check if employee exists
    const checkQuery = 'SELECT id, status FROM employees WHERE id = ? AND is_active = TRUE';
    const [employees] = await connection.execute(checkQuery, [id]);

    if (employees.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
        error: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const employee = employees[0];

    if (employee.status === 'terminated') {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Employee is already terminated',
        error: 'EMPLOYEE_ALREADY_TERMINATED',
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete by updating status and setting termination date
    const updateQuery = `
      UPDATE employees 
      SET status = 'terminated', 
          termination_date = CURDATE(),
          termination_reason = 'Terminated via API',
          is_active = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.execute(updateQuery, [id]);

    // End current pay rate
    await connection.execute(
      'UPDATE employee_pay_rates SET is_current = FALSE, end_date = CURDATE() WHERE employee_id = ? AND is_current = TRUE',
      [id]
    );

    // End current schedule
    await connection.execute(
      'UPDATE employee_schedules SET end_date = CURDATE() WHERE employee_id = ? AND (end_date IS NULL OR end_date >= CURDATE())',
      [id]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Employee deleted successfully',
      data: {
        employee_id: id,
        status: 'terminated'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
