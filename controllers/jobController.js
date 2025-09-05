const db = require('../config/database');

// Get all jobs for the authenticated business
const getJobs = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { 
      status, 
      customer_id, 
      employee_id, 
      date_from, 
      date_to,
      page = 1, 
      limit = 20, 
      sort_by = 'scheduled_date', 
      sort_order = 'desc' 
    } = req.query;

    // Validate sort_by parameter to prevent SQL injection
    const allowedSortFields = ['scheduled_date', 'completion_date', 'created_at', 'total_cost', 'status'];
    const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'scheduled_date';
    const validSortOrder = ['asc', 'desc'].includes(sort_order.toLowerCase()) ? sort_order.toUpperCase() : 'DESC';

    // Build WHERE clause
    let whereClause = 'WHERE j.business_id = ?';
    const params = [businessId];

    if (status) {
      whereClause += ' AND j.status = ?';
      params.push(status);
    }

    if (customer_id) {
      whereClause += ' AND j.customer_id = ?';
      params.push(customer_id);
    }

    if (employee_id) {
      whereClause += ' AND j.assigned_employee_id = ?';
      params.push(employee_id);
    }

    if (date_from) {
      whereClause += ' AND j.scheduled_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND j.scheduled_date <= ?';
      params.push(date_to);
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM jobs j 
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalItems = countResult[0].total;

    // Get jobs with related data
    const jobsQuery = `
      SELECT 
        j.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.city as customer_city,
        c.state as customer_state,
        c.zip_code as customer_zip_code,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.email as employee_email,
        e.phone as employee_phone,
        e.job_title as employee_job_title,
        est.title as estimate_title,
        est.amount as estimate_amount,
        est.status as estimate_status
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN employees e ON j.assigned_employee_id = e.id
      LEFT JOIN estimates est ON j.estimate_id = est.id
      ${whereClause}
      ORDER BY j.${validSortBy} ${validSortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    
    // Use the same params array for the jobs query
    const jobs = await db.query(jobsQuery, params);

    // Format the response
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      business_id: job.business_id,
      customer_id: job.customer_id,
      estimate_id: job.estimate_id,
      assigned_employee_id: job.assigned_employee_id,
      title: job.title,
      description: job.description,
      scheduled_date: job.scheduled_date,
      completion_date: job.completion_date,
      status: job.status,
      total_cost: job.total_cost,
      created_at: job.created_at,
      updated_at: job.updated_at,
      customer: {
        id: job.customer_id,
        name: job.customer_name,
        email: job.customer_email,
        phone: job.customer_phone,
        address: job.customer_address,
        city: job.customer_city,
        state: job.customer_state,
        zip_code: job.customer_zip_code
      },
      employee: job.assigned_employee_id ? {
        id: job.assigned_employee_id,
        first_name: job.employee_first_name,
        last_name: job.employee_last_name,
        email: job.employee_email,
        phone: job.employee_phone,
        job_title: job.employee_job_title
      } : null,
      estimate: job.estimate_id ? {
        id: job.estimate_id,
        title: job.estimate_title,
        amount: job.estimate_amount,
        status: job.estimate_status
      } : null
    }));

    res.json({
      success: true,
      data: {
        jobs: formattedJobs,
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
    console.error('Get jobs error:', error);
    next(error);
  }
};

// Get single job with full details
const getJob = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const jobId = req.params.id;

    // Get job with related data
    const job = await db.query(
      `SELECT 
        j.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.city as customer_city,
        c.state as customer_state,
        c.zip_code as customer_zip_code,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        e.email as employee_email,
        e.phone as employee_phone,
        e.job_title as employee_job_title,
        est.title as estimate_title,
        est.amount as estimate_amount,
        est.status as estimate_status
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN employees e ON j.assigned_employee_id = e.id
      LEFT JOIN estimates est ON j.estimate_id = est.id
      WHERE j.id = ? AND j.business_id = ?`,
      [jobId, businessId]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const jobData = job[0];

    // Get job items
    const items = await db.query(
      'SELECT * FROM job_items WHERE job_id = ? ORDER BY created_at',
      [jobId]
    );

    // Get job photos
    const photos = await db.query(
      'SELECT * FROM job_photos WHERE job_id = ? ORDER BY uploaded_at',
      [jobId]
    );

    // Get job notes
    const notes = await db.query(
      `SELECT 
        jn.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM job_notes jn
      LEFT JOIN employees e ON jn.employee_id = e.id
      WHERE jn.job_id = ? 
      ORDER BY jn.created_at DESC`,
      [jobId]
    );

    // Get status history
    const statusHistory = await db.query(
      `SELECT 
        jsh.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM job_status_history jsh
      LEFT JOIN employees e ON jsh.changed_by = e.id
      WHERE jsh.job_id = ? 
      ORDER BY jsh.changed_at DESC`,
      [jobId]
    );

    const formattedJob = {
      id: jobData.id,
      business_id: jobData.business_id,
      customer_id: jobData.customer_id,
      estimate_id: jobData.estimate_id,
      assigned_employee_id: jobData.assigned_employee_id,
      title: jobData.title,
      description: jobData.description,
      scheduled_date: jobData.scheduled_date,
      completion_date: jobData.completion_date,
      status: jobData.status,
      total_cost: jobData.total_cost,
      created_at: jobData.created_at,
      updated_at: jobData.updated_at,
      customer: {
        id: jobData.customer_id,
        name: jobData.customer_name,
        email: jobData.customer_email,
        phone: jobData.customer_phone,
        address: jobData.customer_address,
        city: jobData.customer_city,
        state: jobData.customer_state,
        zip_code: jobData.customer_zip_code
      },
      employee: jobData.assigned_employee_id ? {
        id: jobData.assigned_employee_id,
        first_name: jobData.employee_first_name,
        last_name: jobData.employee_last_name,
        email: jobData.employee_email,
        phone: jobData.employee_phone,
        job_title: jobData.employee_job_title
      } : null,
      estimate: jobData.estimate_id ? {
        id: jobData.estimate_id,
        title: jobData.estimate_title,
        amount: jobData.estimate_amount,
        status: jobData.estimate_status
      } : null,
      items: items,
      photos: photos,
      notes: notes.map(note => ({
        ...note,
        employee_name: note.employee_first_name && note.employee_last_name 
          ? `${note.employee_first_name} ${note.employee_last_name}` 
          : null
      })),
      status_history: statusHistory.map(history => ({
        ...history,
        employee_name: history.employee_first_name && history.employee_last_name 
          ? `${history.employee_first_name} ${history.employee_last_name}` 
          : null
      }))
    };

    res.json({
      success: true,
      data: { job: formattedJob },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get job error:', error);
    next(error);
  }
};

// Create new job
const createJob = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const {
      customer_id,
      estimate_id,
      assigned_employee_id,
      title,
      description,
      scheduled_date,
      total_cost
    } = req.body;

    // Verify customer belongs to this business
    const customer = await db.query(
      'SELECT id FROM customers WHERE id = ? AND business_id = ?',
      [customer_id, businessId]
    );

    if (customer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found or does not belong to your business',
        error: 'CUSTOMER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Verify estimate belongs to this business (if provided)
    if (estimate_id) {
      const estimate = await db.query(
        'SELECT id FROM estimates WHERE id = ? AND business_id = ?',
        [estimate_id, businessId]
      );

      if (estimate.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Estimate not found or does not belong to your business',
          error: 'ESTIMATE_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Verify employee belongs to this business (if provided)
    if (assigned_employee_id) {
      const employee = await db.query(
        'SELECT id FROM employees WHERE id = ? AND business_id = ?',
        [assigned_employee_id, businessId]
      );

      if (employee.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Employee not found or does not belong to your business',
          error: 'EMPLOYEE_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
    }

    const result = await db.query(
      `INSERT INTO jobs (
        business_id, customer_id, estimate_id, assigned_employee_id, 
        title, description, scheduled_date, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessId, customer_id, estimate_id, assigned_employee_id, title, description, scheduled_date, total_cost]
    );

    // Add initial status to history
    await db.query(
      `INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [result.insertId, null, 'scheduled', req.user.id, 'Job created']
    );

    const newJob = await db.query(
      'SELECT * FROM jobs WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: { job: newJob[0] },
      message: 'Job created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create job error:', error);
    next(error);
  }
};

// Update job
const updateJob = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const jobId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.business_id;
    delete updateData.created_at;

    // Check if job exists and belongs to business
    const existingJob = await db.query(
      'SELECT id, status FROM jobs WHERE id = ? AND business_id = ?',
      [jobId, businessId]
    );

    if (existingJob.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const oldStatus = existingJob[0].status;

    // Verify related entities if being updated
    if (updateData.customer_id) {
      const customer = await db.query(
        'SELECT id FROM customers WHERE id = ? AND business_id = ?',
        [updateData.customer_id, businessId]
      );

      if (customer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found or does not belong to your business',
          error: 'CUSTOMER_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
    }

    if (updateData.estimate_id) {
      const estimate = await db.query(
        'SELECT id FROM estimates WHERE id = ? AND business_id = ?',
        [updateData.estimate_id, businessId]
      );

      if (estimate.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Estimate not found or does not belong to your business',
          error: 'ESTIMATE_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
    }

    if (updateData.assigned_employee_id) {
      const employee = await db.query(
        'SELECT id FROM employees WHERE id = ? AND business_id = ?',
        [updateData.assigned_employee_id, businessId]
      );

      if (employee.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Employee not found or does not belong to your business',
          error: 'EMPLOYEE_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Build dynamic update query
    const allowedFields = [
      'customer_id', 'estimate_id', 'assigned_employee_id', 'title', 
      'description', 'scheduled_date', 'completion_date', 'status', 'total_cost'
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

    updateValues.push(jobId);

    await db.query(
      `UPDATE jobs SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Add status change to history if status changed
    if (updateData.status && updateData.status !== oldStatus) {
      await db.query(
        `INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [jobId, oldStatus, updateData.status, req.user.id, 'Status updated']
      );
    }

    const updatedJob = await db.query(
      'SELECT * FROM jobs WHERE id = ?',
      [jobId]
    );

    res.json({
      success: true,
      data: { job: updatedJob[0] },
      message: 'Job updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update job error:', error);
    next(error);
  }
};

// Delete job
const deleteJob = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const jobId = req.params.id;

    // Check if job exists and belongs to business
    const existingJob = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND business_id = ?',
      [jobId, businessId]
    );

    if (existingJob.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    await db.query('DELETE FROM jobs WHERE id = ?', [jobId]);

    res.json({
      success: true,
      message: 'Job deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete job error:', error);
    next(error);
  }
};

// Get job statistics
const getJobStats = async (req, res, next) => {
  try {
    const businessId = req.user.id;

    // Get basic stats
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_jobs,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_jobs,
        COALESCE(SUM(total_cost), 0) as total_revenue,
        COALESCE(AVG(total_cost), 0) as average_job_value
      FROM jobs 
      WHERE business_id = ?
    `, [businessId]);

    // Get today's stats
    const todayStats = await db.query(`
      SELECT 
        COUNT(*) as jobs_today,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_today
      FROM jobs 
      WHERE business_id = ? AND DATE(scheduled_date) = CURDATE()
    `, [businessId]);

    const result = {
      ...stats[0],
      ...todayStats[0]
    };

    res.json({
      success: true,
      data: { stats: result },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get job stats error:', error);
    next(error);
  }
};

// Add job item
const addJobItem = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const jobId = req.params.id;
    const { name, category, quantity, base_price, difficulty, estimated_time } = req.body;

    // Verify job exists and belongs to business
    const job = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND business_id = ?',
      [jobId, businessId]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const result = await db.query(
      `INSERT INTO job_items (job_id, name, category, quantity, base_price, difficulty, estimated_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [jobId, name, category, quantity, base_price, difficulty, estimated_time]
    );

    const newItem = await db.query(
      'SELECT * FROM job_items WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: { item: newItem[0] },
      message: 'Job item added successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Add job item error:', error);
    next(error);
  }
};

// Update job item
const updateJobItem = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { jobId, itemId } = req.params;
    const updateData = req.body;

    // Verify job exists and belongs to business
    const job = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND business_id = ?',
      [jobId, businessId]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Verify item exists and belongs to job
    const item = await db.query(
      'SELECT id FROM job_items WHERE id = ? AND job_id = ?',
      [itemId, jobId]
    );

    if (item.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job item not found',
        error: 'JOB_ITEM_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'category', 'quantity', 'base_price', 'difficulty', 'estimated_time'];
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

    updateValues.push(itemId);

    await db.query(
      `UPDATE job_items SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const updatedItem = await db.query(
      'SELECT * FROM job_items WHERE id = ?',
      [itemId]
    );

    res.json({
      success: true,
      data: { item: updatedItem[0] },
      message: 'Job item updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update job item error:', error);
    next(error);
  }
};

// Delete job item
const deleteJobItem = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { jobId, itemId } = req.params;

    // Verify job exists and belongs to business
    const job = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND business_id = ?',
      [jobId, businessId]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Verify item exists and belongs to job
    const item = await db.query(
      'SELECT id FROM job_items WHERE id = ? AND job_id = ?',
      [itemId, jobId]
    );

    if (item.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job item not found',
        error: 'JOB_ITEM_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    await db.query('DELETE FROM job_items WHERE id = ?', [itemId]);

    res.json({
      success: true,
      message: 'Job item deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete job item error:', error);
    next(error);
  }
};

// Add job note
const addJobNote = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const jobId = req.params.id;
    const { note_type, content, is_important } = req.body;

    // Verify job exists and belongs to business
    const job = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND business_id = ?',
      [jobId, businessId]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const result = await db.query(
      `INSERT INTO job_notes (job_id, employee_id, note_type, content, is_important)
       VALUES (?, ?, ?, ?, ?)`,
      [jobId, req.user.id, note_type, content, is_important || false]
    );

    const newNote = await db.query(
      `SELECT 
        jn.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM job_notes jn
      LEFT JOIN employees e ON jn.employee_id = e.id
      WHERE jn.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: { note: newNote[0] },
      message: 'Job note added successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Add job note error:', error);
    next(error);
  }
};

// Update job note
const updateJobNote = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { jobId, noteId } = req.params;
    const updateData = req.body;

    // Verify job exists and belongs to business
    const job = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND business_id = ?',
      [jobId, businessId]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Verify note exists and belongs to job
    const note = await db.query(
      'SELECT id FROM job_notes WHERE id = ? AND job_id = ?',
      [noteId, jobId]
    );

    if (note.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job note not found',
        error: 'JOB_NOTE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Build dynamic update query
    const allowedFields = ['note_type', 'content', 'is_important'];
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

    updateValues.push(noteId);

    await db.query(
      `UPDATE job_notes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const updatedNote = await db.query(
      `SELECT 
        jn.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM job_notes jn
      LEFT JOIN employees e ON jn.employee_id = e.id
      WHERE jn.id = ?`,
      [noteId]
    );

    res.json({
      success: true,
      data: { note: updatedNote[0] },
      message: 'Job note updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update job note error:', error);
    next(error);
  }
};

// Delete job note
const deleteJobNote = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { jobId, noteId } = req.params;

    // Verify job exists and belongs to business
    const job = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND business_id = ?',
      [jobId, businessId]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Verify note exists and belongs to job
    const note = await db.query(
      'SELECT id FROM job_notes WHERE id = ? AND job_id = ?',
      [noteId, jobId]
    );

    if (note.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job note not found',
        error: 'JOB_NOTE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    await db.query('DELETE FROM job_notes WHERE id = ?', [noteId]);

    res.json({
      success: true,
      message: 'Job note deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete job note error:', error);
    next(error);
  }
};

// Get job status history
const getJobStatusHistory = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const jobId = req.params.id;

    // Verify job exists and belongs to business
    const job = await db.query(
      'SELECT id FROM jobs WHERE id = ? AND business_id = ?',
      [jobId, businessId]
    );

    if (job.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const statusHistory = await db.query(
      `SELECT 
        jsh.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM job_status_history jsh
      LEFT JOIN employees e ON jsh.changed_by = e.id
      WHERE jsh.job_id = ? 
      ORDER BY jsh.changed_at DESC`,
      [jobId]
    );

    const formattedHistory = statusHistory.map(history => ({
      ...history,
      employee_name: history.employee_first_name && history.employee_last_name 
        ? `${history.employee_first_name} ${history.employee_last_name}` 
        : null
    }));

    res.json({
      success: true,
      data: { status_history: formattedHistory },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get job status history error:', error);
    next(error);
  }
};

module.exports = {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobStats,
  addJobItem,
  updateJobItem,
  deleteJobItem,
  addJobNote,
  updateJobNote,
  deleteJobNote,
  getJobStatusHistory
};
