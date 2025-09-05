const db = require('../config/database');

// Get all employees for the authenticated business
const getEmployees = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { 
      status, 
      position, 
      employee_type, 
      page = 1, 
      limit = 20, 
      sort_by = 'created_at', 
      sort_order = 'desc' 
    } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE business_id = ?';
    const params = [businessId];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (position) {
      whereClause += ' AND position = ?';
      params.push(position);
    }

    if (employee_type) {
      whereClause += ' AND employee_type = ?';
      params.push(employee_type);
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM employees ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const totalItems = countResult[0].total;

    // Get employees with pagination
    const employeesQuery = `
      SELECT * FROM employees 
      ${whereClause} 
      ORDER BY ${sort_by} ${sort_order.toUpperCase()} 
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);
    
    const employees = await db.query(employeesQuery, params);

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalItems / limit),
          total_items: totalItems,
          items_per_page: parseInt(limit)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get employees error:', error);
    next(error);
  }
};

// Get single employee
const getEmployee = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const employeeId = req.params.id;

    const employee = await db.query(
      'SELECT * FROM employees WHERE id = ? AND business_id = ?',
      [employeeId, businessId]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
        error: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: { employee: employee[0] },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get employee error:', error);
    next(error);
  }
};

// Create new employee
const createEmployee = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const {
      first_name,
      last_name,
      email,
      phone,
      job_title,
      employee_type = 'regular',
      position = 'helper',
      status = 'active',
      hire_date
    } = req.body;

    // Check if employee with same email already exists for this business
    const existingEmployee = await db.query(
      'SELECT id FROM employees WHERE email = ? AND business_id = ?',
      [email, businessId]
    );

    if (existingEmployee.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists',
        error: 'EMPLOYEE_EXISTS',
        timestamp: new Date().toISOString()
      });
    }

    const result = await db.query(
      `INSERT INTO employees (
        business_id, first_name, last_name, email, phone, job_title, 
        employee_type, position, status, hire_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessId, first_name, last_name, email, phone, job_title, employee_type, position, status, hire_date]
    );

    const newEmployee = await db.query(
      'SELECT * FROM employees WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: { employee: newEmployee[0] },
      message: 'Employee created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create employee error:', error);
    next(error);
  }
};

// Update employee
const updateEmployee = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const employeeId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.business_id;
    delete updateData.created_at;

    // Check if employee exists and belongs to business
    const existingEmployee = await db.query(
      'SELECT id FROM employees WHERE id = ? AND business_id = ?',
      [employeeId, businessId]
    );

    if (existingEmployee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
        error: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const duplicateEmployee = await db.query(
        'SELECT id FROM employees WHERE email = ? AND business_id = ? AND id != ?',
        [updateData.email, businessId, employeeId]
      );

      if (duplicateEmployee.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Employee with this email already exists',
          error: 'EMPLOYEE_EXISTS',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Build dynamic update query
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'job_title', 
      'employee_type', 'position', 'status', 'hire_date'
    ];

    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_VALID_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    updateValues.push(employeeId);

    await db.query(
      `UPDATE employees SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    const updatedEmployee = await db.query(
      'SELECT * FROM employees WHERE id = ?',
      [employeeId]
    );

    res.json({
      success: true,
      data: { employee: updatedEmployee[0] },
      message: 'Employee updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update employee error:', error);
    next(error);
  }
};

// Delete employee
const deleteEmployee = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const employeeId = req.params.id;

    // Check if employee exists and belongs to business
    const existingEmployee = await db.query(
      'SELECT id FROM employees WHERE id = ? AND business_id = ?',
      [employeeId, businessId]
    );

    if (existingEmployee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
        error: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Check if employee has associated jobs
    const associatedJobs = await db.query(
      'SELECT COUNT(*) as count FROM jobs WHERE assigned_employee_id = ?',
      [employeeId]
    );

    if (associatedJobs[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete employee with associated jobs',
        error: 'EMPLOYEE_HAS_JOBS',
        timestamp: new Date().toISOString()
      });
    }

    await db.query('DELETE FROM employees WHERE id = ?', [employeeId]);

    res.json({
      success: true,
      message: 'Employee deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
