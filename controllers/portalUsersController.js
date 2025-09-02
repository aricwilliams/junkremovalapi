const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const dbConfig = require('../config/database');

// Helper function to build dynamic WHERE clause
function buildWhereClause(filters) {
  const conditions = [];
  const values = [];

  if (filters.search) {
    conditions.push('(pu.username LIKE ? OR pu.email LIKE ? OR CONCAT(c.first_name, " ", c.last_name) LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    values.push(searchTerm, searchTerm, searchTerm);
  }

  if (filters.status) {
    conditions.push('pu.is_active = ?');
    values.push(filters.status === 'active');
  }

  if (filters.user_type) {
    conditions.push('c.customer_type = ?');
    values.push(filters.user_type);
  }

  if (filters.date_from) {
    conditions.push('pu.created_at >= ?');
    values.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push('pu.created_at <= ?');
    values.push(filters.date_to);
  }

  return {
    whereClause: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    values
  };
}

// Helper function to build ORDER BY clause
function buildOrderByClause(sortBy, sortOrder) {
  const validSortFields = {
    'created_at': 'pu.created_at',
    'username': 'pu.username',
    'email': 'pu.email',
    'last_login': 'pu.last_login',
    'role': 'pu.role'
  };

  const field = validSortFields[sortBy] || 'pu.created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  return `ORDER BY ${field} ${order}`;
}

// Get all portal users with filtering, sorting, and pagination
async function getAllPortalUsers(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      user_type,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const filters = { search, status, user_type, date_from, date_to };
    
    const { whereClause, values } = buildWhereClause(filters);
    const orderByClause = buildOrderByClause(sort_by, sort_order);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM portal_users pu
      JOIN customers c ON pu.customer_id = c.id
      ${whereClause}
    `;
    
    const [countResult] = await mysql.execute(countQuery, values);
    const total = countResult[0].total;

    // Get paginated results
    const query = `
      SELECT 
        pu.id,
        pu.username,
        pu.email,
        pu.role,
        pu.is_active,
        pu.last_login,
        pu.created_at,
        c.first_name,
        c.last_name,
        c.customer_type,
        c.company_name
      FROM portal_users pu
      JOIN customers c ON pu.customer_id = c.id
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const [users] = await mysql.execute(query, [...values, parseInt(limit), offset]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN pu.is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN pu.is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN pu.is_locked = 1 THEN 1 ELSE 0 END) as suspended_users,
        c.customer_type,
        COUNT(*) as count
      FROM portal_users pu
      JOIN customers c ON pu.customer_id = c.id
      GROUP BY c.customer_type
    `;

    const [summaryResult] = await mysql.execute(summaryQuery);
    
    const userTypes = {};
    summaryResult.forEach(row => {
      userTypes[row.customer_type] = row.count;
    });

    const summary = {
      total_users: total,
      active_users: summaryResult.reduce((sum, row) => sum + row.active_users, 0),
      inactive_users: summaryResult.reduce((sum, row) => sum + row.inactive_users, 0),
      suspended_users: summaryResult.reduce((sum, row) => sum + row.suspended_users, 0),
      user_types: userTypes
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    };

    res.json({
      success: true,
      message: 'Portal users retrieved successfully',
      data: {
        users,
        pagination,
        summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting portal users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve portal users',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Get portal user by ID with all related information
async function getPortalUserById(req, res) {
  try {
    const { id } = req.params;

    // Get basic user information
    const userQuery = `
      SELECT 
        pu.*,
        c.first_name,
        c.last_name,
        c.customer_type,
        c.company_name,
        c.phone,
        c.mobile,
        c.date_of_birth
      FROM portal_users pu
      JOIN customers c ON pu.customer_id = c.id
      WHERE pu.id = ?
    `;

    const [users] = await mysql.execute(userQuery, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portal user not found',
        error: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const user = users[0];

    // Get user permissions
    let permissions = {};
    if (user.permissions) {
      try {
        permissions = JSON.parse(user.permissions);
      } catch (e) {
        permissions = {};
      }
    }

    // Get service history summary
    const serviceHistoryQuery = `
      SELECT 
        COUNT(*) as total_jobs,
        SUM(COALESCE(j.total_cost, 0)) as total_spent,
        MAX(j.completed_date) as last_service_date,
        AVG(COALESCE(j.customer_rating, 0)) as average_rating
      FROM jobs j
      WHERE j.customer_id = ?
    `;

    const [serviceHistory] = await mysql.execute(serviceHistoryQuery, [user.customer_id]);

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

    const [activities] = await mysql.execute(activityQuery, [id]);

    // Build comprehensive user object
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      personal_info: {
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        mobile: user.mobile,
        date_of_birth: user.date_of_birth,
        preferred_contact_method: 'email' // Default value
      },
      account_info: {
        user_type: user.customer_type,
        status: user.is_active ? 'active' : 'inactive',
        email_verified: true, // Default value
        phone_verified: false, // Default value
        two_factor_enabled: user.two_factor_enabled,
        last_login: user.last_login,
        created: user.created_at
      },
      preferences: {
        language: 'en', // Default value
        timezone: 'America/New_York', // Default value
        notification_preferences: {
          email_notifications: true,
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
        average_rating: parseFloat(serviceHistory[0]?.average_rating || 0).toFixed(1)
      },
      recent_activity: activities
    };

    res.json({
      success: true,
      message: 'Portal user retrieved successfully',
      data: {
        user: userData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting portal user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve portal user',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Create new portal user
async function createPortalUser(req, res) {
  try {
    const {
      username,
      email,
      password,
      personal_info,
      user_type = 'customer',
      preferences
    } = req.body;

    // Check if username or email already exists
    const existingUserQuery = `
      SELECT id FROM portal_users 
      WHERE username = ? OR email = ?
    `;
    
    const [existingUsers] = await mysql.execute(existingUserQuery, [username, email]);
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists',
        error: 'DUPLICATE_USER',
        timestamp: new Date().toISOString()
      });
    }

    // Get customer ID (assuming customer already exists)
    const customerQuery = `
      SELECT id FROM customers 
      WHERE email = ? OR (first_name = ? AND last_name = ?)
      LIMIT 1
    `;
    
    const [customers] = await mysql.execute(customerQuery, [
      email, 
      personal_info.first_name, 
      personal_info.last_name
    ]);

    let customerId;
    if (customers.length > 0) {
      customerId = customers[0].id;
    } else {
      // Create new customer if doesn't exist
      customerId = uuidv4();
      const createCustomerQuery = `
        INSERT INTO customers (id, first_name, last_name, email, phone, mobile, customer_type, date_of_birth)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await mysql.execute(createCustomerQuery, [
        customerId,
        personal_info.first_name,
        personal_info.last_name,
        email,
        personal_info.phone || null,
        personal_info.mobile || null,
        user_type,
        personal_info.date_of_birth || null
      ]);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create portal user
    const userId = uuidv4();
    const createUserQuery = `
      INSERT INTO portal_users (
        id, customer_id, username, email, password_hash, role, permissions, is_active
      ) VALUES (?, ?, ?, ?, ?, 'viewer', ?, TRUE)
    `;

    const defaultPermissions = JSON.stringify({
      dashboard: true,
      requests: true,
      reports: false,
      admin: false
    });

    await mysql.execute(createUserQuery, [
      userId,
      customerId,
      username,
      email,
      passwordHash,
      defaultPermissions
    ]);

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description)
      VALUES (?, ?, ?, 'create_request', 'Portal user account created')
    `;
    
    await mysql.execute(activityQuery, [uuidv4(), userId, customerId]);

    res.status(201).json({
      success: true,
      message: 'Portal user created successfully',
      data: {
        user_id: userId,
        user: {
          id: userId,
          username,
          email,
          user_type,
          status: 'active',
          created: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating portal user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create portal user',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Update portal user
async function updatePortalUser(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user exists
    const userQuery = `
      SELECT id, customer_id FROM portal_users WHERE id = ?
    `;
    
    const [users] = await mysql.execute(userQuery, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portal user not found',
        error: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const user = users[0];
    const updatedFields = [];

    // Update customer information if personal_info is provided
    if (updateData.personal_info) {
      const customerUpdateQuery = `
        UPDATE customers 
        SET 
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          mobile = COALESCE(?, mobile),
          date_of_birth = COALESCE(?, date_of_birth),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await mysql.execute(customerUpdateQuery, [
        updateData.personal_info.first_name || null,
        updateData.personal_info.last_name || null,
        updateData.personal_info.phone || null,
        updateData.personal_info.mobile || null,
        updateData.personal_info.date_of_birth || null,
        user.customer_id
      ]);

      updatedFields.push('personal_info');
    }

    // Update portal user status if provided
    if (updateData.status) {
      const statusUpdateQuery = `
        UPDATE portal_users 
        SET 
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const isActive = updateData.status === 'active';
      await mysql.execute(statusUpdateQuery, [isActive, id]);
      updatedFields.push('status');
    }

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description)
      VALUES (?, ?, ?, 'update_profile', 'Portal user profile updated')
    `;
    
    await mysql.execute(activityQuery, [uuidv4(), id, user.customer_id]);

    res.json({
      success: true,
      message: 'Portal user updated successfully',
      data: {
        user_id: id,
        updated_fields: updatedFields
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating portal user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update portal user',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Delete portal user (soft delete)
async function deletePortalUser(req, res) {
  try {
    const { id } = req.params;

    // Check if user exists
    const userQuery = `
      SELECT id, customer_id FROM portal_users WHERE id = ?
    `;
    
    const [users] = await mysql.execute(userQuery, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portal user not found',
        error: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const user = users[0];

    // Soft delete - set status to inactive
    const deleteQuery = `
      UPDATE portal_users 
      SET 
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await mysql.execute(deleteQuery, [id]);

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description)
      VALUES (?, ?, ?, 'other', 'Portal user account deactivated')
    `;
    
    await mysql.execute(activityQuery, [uuidv4(), id, user.customer_id]);

    res.json({
      success: true,
      message: 'Portal user deleted successfully',
      data: {
        user_id: id,
        status: 'inactive'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting portal user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete portal user',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getAllPortalUsers,
  getPortalUserById,
  createPortalUser,
  updatePortalUser,
  deletePortalUser
};
