const mysql = require('mysql2/promise');

// Helper function to build dynamic WHERE clause for job history
function buildJobHistoryWhereClause(filters, customerId) {
  const conditions = [`j.customer_id = ?`];
  const values = [customerId];

  if (filters.status) {
    conditions.push('j.status = ?');
    values.push(filters.status);
  }

  if (filters.date_from) {
    conditions.push('j.scheduled_date >= ?');
    values.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push('j.scheduled_date <= ?');
    values.push(filters.date_to);
  }

  return {
    whereClause: 'WHERE ' + conditions.join(' AND '),
    values
  };
}

// Helper function to build ORDER BY clause for job history
function buildJobHistoryOrderByClause(sortBy, sortOrder) {
  const validSortFields = {
    'scheduled_date': 'j.scheduled_date',
    'completed_date': 'j.completed_date',
    'created_at': 'j.created_at'
  };

  const field = validSortFields[sortBy] || 'j.scheduled_date';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  return `ORDER BY ${field} ${order}`;
}

// Get job history for the authenticated user
async function getJobHistory(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      date_from,
      date_to,
      sort_by = 'scheduled_date',
      sort_order = 'desc'
    } = req.query;

    const customerId = req.user.customerId;
    const offset = (page - 1) * limit;
    const filters = { status, date_from, date_to };
    
    const { whereClause, values } = buildJobHistoryWhereClause(filters, customerId);
    const orderByClause = buildJobHistoryOrderByClause(sort_by, sort_order);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      ${whereClause}
    `;
    
    const [countResult] = await mysql.execute(countQuery, values);
    const total = countResult[0].total;

    // Get paginated results
    const query = `
      SELECT 
        j.id,
        j.job_number,
        j.title,
        j.description,
        j.status,
        j.scheduled_date,
        j.completed_date,
        j.total_cost,
        j.crew_size,
        j.duration,
        j.customer_rating,
        j.customer_review,
        j.created_at
      FROM jobs j
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const [jobs] = await mysql.execute(query, [...values, parseInt(limit), offset]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_jobs,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_jobs,
        SUM(COALESCE(total_cost, 0)) as total_spent,
        AVG(COALESCE(customer_rating, 0)) as average_rating
      FROM jobs
      WHERE customer_id = ?
    `;

    const [summaryResult] = await mysql.execute(summaryQuery, [customerId]);
    const summary = summaryResult[0];

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    };

    res.json({
      success: true,
      message: 'Job history retrieved successfully',
      data: {
        jobs,
        pagination,
        summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting job history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job history',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Get detailed information about a specific job
async function getJobDetails(req, res) {
  try {
    const { id } = req.params;
    const customerId = req.user.customerId;

    // Get basic job information
    const jobQuery = `
      SELECT 
        j.*,
        c.first_name,
        c.last_name,
        c.company_name
      FROM jobs j
      JOIN customers c ON j.customer_id = c.id
      WHERE j.id = ? AND j.customer_id = ?
    `;

    const [jobs] = await mysql.execute(jobQuery, [id, customerId]);
    
    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const job = jobs[0];

    // Get crew information
    const crewQuery = `
      SELECT 
        e.first_name,
        e.last_name,
        e.phone,
        e.email
      FROM job_assignments ja
      JOIN employees e ON ja.employee_id = e.id
      WHERE ja.job_id = ?
      ORDER BY ja.role
    `;

    const [crewMembers] = await mysql.execute(crewQuery, [id]);

    // Get job progress updates
    const progressQuery = `
      SELECT 
        status,
        notes,
        timestamp,
        updated_by
      FROM job_status_updates
      WHERE job_id = ?
      ORDER BY timestamp ASC
    `;

    const [progressUpdates] = await mysql.execute(progressQuery, [id]);

    // Get items removed
    const itemsQuery = `
      SELECT 
        description,
        quantity,
        disposal_method,
        notes
      FROM job_items
      WHERE job_id = ?
      ORDER BY created_at ASC
    `;

    const [itemsRemoved] = await mysql.execute(itemsQuery, [id]);

    // Get job photos
    const photosQuery = `
      SELECT 
        id,
        file_name,
        photo_type,
        description,
        uploaded_at
      FROM job_photos
      WHERE job_id = ?
      ORDER BY photo_type, uploaded_at ASC
    `;

    const [photos] = await mysql.execute(photosQuery, [id]);

    // Organize photos by type
    const organizedPhotos = {
      before: photos.filter(p => p.photo_type === 'before').map(p => p.file_name),
      after: photos.filter(p => p.photo_type === 'after').map(p => p.file_name),
      during: photos.filter(p => p.photo_type === 'during').map(p => p.file_name)
    };

    // Build comprehensive job object
    const jobData = {
      id: job.id,
      job_number: job.job_number,
      title: job.title,
      description: job.description,
      status: job.status,
      scheduling: {
        scheduled_date: job.scheduled_date,
        start_time: job.start_time,
        estimated_duration: job.estimated_duration,
        actual_duration: job.actual_duration
      },
      location: {
        address: job.location_address,
        city: job.location_city,
        state: job.location_state,
        zip_code: job.location_zip_code,
        access_notes: job.access_notes,
        parking_info: job.parking_info
      },
      crew: {
        crew_leader: crewMembers.length > 0 ? `${crewMembers[0].first_name} ${crewMembers[0].last_name}` : 'Not assigned',
        crew_size: job.crew_size,
        crew_members: crewMembers.map(member => `${member.first_name} ${member.last_name}`)
      },
      progress: {
        start_time: job.start_time,
        completion_time: job.completed_date,
        break_time: job.break_time || '0 minutes',
        status_updates: progressUpdates.map(update => ({
          status: update.status,
          timestamp: update.timestamp,
          notes: update.notes
        }))
      },
      items_removed: itemsRemoved.map(item => ({
        description: item.description,
        quantity: item.quantity,
        disposal_method: item.disposal_method
      })),
      pricing: {
        base_cost: job.base_cost || 0,
        additional_fees: job.additional_fees || 0,
        total_cost: job.total_cost || 0,
        payment_status: job.payment_status || 'pending',
        payment_method: job.payment_method || 'not_specified'
      },
      customer_feedback: {
        rating: job.customer_rating || 0,
        review: job.customer_review || '',
        submitted_date: job.review_submitted_date
      },
      photos: organizedPhotos,
      created: job.created_at,
      updated: job.updated_at
    };

    res.json({
      success: true,
      message: 'Job details retrieved successfully',
      data: {
        job: jobData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting job details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job details',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getJobHistory,
  getJobDetails
};
