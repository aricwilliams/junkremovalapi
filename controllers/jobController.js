const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');
const { getFileUrl } = require('../middleware/upload');
const config = require('../config/config');

// Helper function to create success response
const createSuccessResponse = (message, data = null) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
});

// Helper function to create error response
const createErrorResponse = (message, errorCode = 'INTERNAL_SERVER_ERROR', statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = errorCode;
  throw error;
};

// Get all jobs with filtering, sorting, and pagination
const getAllJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customer_id,
      crew_id,
      date_from,
      date_to,
      sort_by = 'scheduled_date',
      sort_order = 'desc'
    } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND j.status = ?';
      params.push(status);
    }

    if (customer_id) {
      whereClause += ' AND j.customer_id = ?';
      params.push(customer_id);
    }

    if (crew_id) {
      whereClause += ' AND j.crew_id = ?';
      params.push(crew_id);
    }

    if (date_from) {
      whereClause += ' AND j.scheduled_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND j.scheduled_date <= ?';
      params.push(date_to);
    }

    // Count total jobs
    const countSql = `
      SELECT COUNT(*) as total 
      FROM jobs j 
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get jobs with pagination
    const jobsSql = `
      SELECT 
        j.id,
        j.customer_id,
        j.customer_name,
        j.customer_phone,
        j.customer_email,
        j.address,
        j.city,
        j.state,
        j.zip_code,
        j.latitude,
        j.longitude,
        j.scheduled_date,
        j.time_slot,
        j.estimated_hours,
        j.status,
        j.priority,
        j.total_estimate,
        j.actual_total,
        j.notes,
        j.created_at,
        j.updated_at,
        c.name as crew_name
      FROM jobs j
      LEFT JOIN crews c ON j.crew_id = c.id
      ${whereClause}
      ORDER BY j.${sort_by} ${sort_order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const jobs = await query(jobsSql, [...params, parseInt(limit), offset]);

    // Format response
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      customer_id: job.customer_id,
      customer_name: job.customer_name,
      customer_phone: job.customer_phone,
      customer_email: job.customer_email,
      address: job.address,
      city: job.city,
      state: job.state,
      zip_code: job.zip_code,
      latitude: job.latitude,
      longitude: job.longitude,
      scheduled_date: job.scheduled_date,
      time_slot: job.time_slot,
      estimated_hours: job.estimated_hours,
      status: job.status,
      priority: job.priority,
      total_estimate: job.total_estimate,
      actual_total: job.actual_total,
      notes: job.notes,
      crew_name: job.crew_name,
      created: job.created_at,
      updated: job.updated_at
    }));

    const response = createSuccessResponse('Jobs retrieved successfully', {
      jobs: formattedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages
      }
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get job by ID
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get job details
    const jobSql = `
      SELECT 
        j.*,
        c.name as crew_name
      FROM jobs j
      LEFT JOIN crews c ON j.crew_id = c.id
      WHERE j.id = ?
    `;
    const jobs = await query(jobSql, [id]);

    if (jobs.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    const job = jobs[0];

    // Get job items
    const itemsSql = 'SELECT * FROM job_items WHERE job_id = ?';
    const items = await query(itemsSql, [id]);

    // Get job photos
    const photosSql = 'SELECT * FROM job_photos WHERE job_id = ? ORDER BY uploaded_at DESC';
    const photos = await query(photosSql, [id]);

    // Get crew assignment details
    let crewAssignment = null;
    if (job.crew_id) {
      const crewSql = `
        SELECT 
          c.id as crew_id,
          c.name as crew_name,
          cm.employee_id,
          cm.role,
          e.name as employee_name
        FROM crews c
        JOIN crew_members cm ON c.id = cm.crew_id
        JOIN employees e ON cm.employee_id = e.id
        WHERE c.id = ? AND cm.is_active = 1
      `;
      const crewMembers = await query(crewSql, [job.crew_id]);

      if (crewMembers.length > 0) {
        crewAssignment = {
          crew_id: crewMembers[0].crew_id,
          crew_name: crewMembers[0].crew_name,
          members: crewMembers.map(member => ({
            employee_id: member.employee_id,
            name: member.employee_name,
            role: member.role
          }))
        };
      }
    }

    // Format photos
    const beforePhotos = photos.filter(p => p.photo_type === 'before').map(p => p.file_path);
    const afterPhotos = photos.filter(p => p.photo_type === 'after').map(p => p.file_path);

    const response = createSuccessResponse('Job retrieved successfully', {
      job: {
        id: job.id,
        customer_id: job.customer_id,
        customer_name: job.customer_name,
        customer_phone: job.customer_phone,
        customer_email: job.customer_email,
        address: job.address,
        city: job.city,
        state: job.state,
        zip_code: job.zip_code,
        latitude: job.latitude,
        longitude: job.longitude,
        scheduled_date: job.scheduled_date,
        time_slot: job.time_slot,
        estimated_hours: job.estimated_hours,
        status: job.status,
        priority: job.priority,
        total_estimate: job.total_estimate,
        actual_total: job.actual_total,
        notes: job.notes,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          base_price: item.base_price,
          difficulty: item.difficulty,
          estimated_time: item.estimated_time
        })),
        before_photos: beforePhotos,
        after_photos: afterPhotos,
        crew_assignment: crewAssignment,
        created: job.created_at,
        updated: job.updated_at
      }
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Create new job
const createJob = async (req, res, next) => {
  try {
    const jobData = req.body;
    const jobId = uuidv4();

    await transaction(async (connection) => {
      // Insert job
      const jobSql = `
        INSERT INTO jobs (
          id, customer_id, customer_name, customer_phone, customer_email,
          address, city, state, zip_code, latitude, longitude,
          scheduled_date, time_slot, estimated_hours, priority,
          total_estimate, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(jobSql, [
        jobId,
        jobData.customer_id,
        jobData.customer_name,
        jobData.customer_phone,
        jobData.customer_email,
        jobData.address,
        jobData.city,
        jobData.state,
        jobData.zip_code,
        jobData.latitude || null,
        jobData.longitude || null,
        jobData.scheduled_date,
        jobData.time_slot,
        jobData.estimated_hours,
        jobData.priority || 'medium',
        jobData.total_estimate,
        jobData.notes || null,
        'scheduled'
      ]);

      // Insert job items
      if (jobData.items && jobData.items.length > 0) {
        const itemSql = `
          INSERT INTO job_items (
            id, job_id, name, category, quantity, base_price,
            difficulty, estimated_time, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const item of jobData.items) {
          await connection.execute(itemSql, [
            uuidv4(),
            jobId,
            item.name,
            item.category,
            item.quantity || 1,
            item.base_price,
            item.difficulty || 'medium',
            item.estimated_time,
            item.notes || null
          ]);
        }
      }

      // Insert initial status history
      const statusSql = `
        INSERT INTO job_status_history (
          id, job_id, status, changed_by, notes
        ) VALUES (?, ?, ?, ?, ?)
      `;
      await connection.execute(statusSql, [
        uuidv4(),
        jobId,
        'scheduled',
        req.user.id,
        'Job created'
      ]);
    });

    const response = createSuccessResponse('Job created successfully', {
      job_id: jobId,
      job: {
        id: jobId,
        customer_id: jobData.customer_id,
        customer_name: jobData.customer_name,
        status: 'scheduled',
        scheduled_date: jobData.scheduled_date,
        created: new Date().toISOString()
      }
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Update job
const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if job exists
    const checkSql = 'SELECT id FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return createErrorResponse('No fields to update', 'NO_FIELDS_TO_UPDATE', 400);
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateSql = `UPDATE jobs SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(updateSql, updateValues);

    const response = createSuccessResponse('Job updated successfully', {
      job_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Delete job (soft delete)
const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if job exists
    const checkSql = 'SELECT id, status FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    if (existingJob[0].status === 'cancelled') {
      return createErrorResponse('Job is already cancelled', 'JOB_ALREADY_CANCELLED', 400);
    }

    // Soft delete - update status to cancelled
    const updateSql = 'UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await query(updateSql, ['cancelled', id]);

    // Add status history
    const statusSql = `
      INSERT INTO job_status_history (
        id, job_id, status, changed_by, notes
      ) VALUES (?, ?, ?, ?, ?)
    `;
    await query(statusSql, [uuidv4(), id, 'cancelled', req.user.id, 'Job cancelled']);

    const response = createSuccessResponse('Job cancelled successfully', {
      job_id: id,
      status: 'cancelled'
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Update job status
const updateJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, status_notes, actual_start_time } = req.body;

    // Check if job exists
    const checkSql = 'SELECT id, status FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    const oldStatus = existingJob[0].status;

    // Validate status transition
    const validTransitions = {
      'scheduled': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[oldStatus].includes(status)) {
      return createErrorResponse(
        `Invalid status transition from ${oldStatus} to ${status}`,
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    // Update job status
    const updateSql = `
      UPDATE jobs 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      ${actual_start_time ? ', actual_start_time = ?' : ''}
      WHERE id = ?
    `;
    
    const updateValues = actual_start_time ? [status, actual_start_time, id] : [status, id];
    await query(updateSql, updateValues);

    // Add status history
    const statusSql = `
      INSERT INTO job_status_history (
        id, job_id, status, changed_by, notes
      ) VALUES (?, ?, ?, ?, ?)
    `;
    await query(statusSql, [uuidv4(), id, status, req.user.id, status_notes || null]);

    const response = createSuccessResponse('Job status updated successfully', {
      job_id: id,
      old_status: oldStatus,
      new_status: status,
      status_notes,
      actual_start_time
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Assign crew to job
const assignCrewToJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { crew_id, assignment_notes } = req.body;

    // Check if job exists
    const checkJobSql = 'SELECT id, crew_id FROM jobs WHERE id = ?';
    const existingJob = await query(checkJobSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    // Check if crew exists and is available
    const checkCrewSql = 'SELECT id, name, is_available FROM crews WHERE id = ?';
    const existingCrew = await query(checkCrewSql, [crew_id]);

    if (existingCrew.length === 0) {
      return createErrorResponse('Crew not found', 'CREW_NOT_FOUND', 404);
    }

    if (!existingCrew[0].is_available) {
      return createErrorResponse('Crew is not available', 'CREW_NOT_AVAILABLE', 400);
    }

    // Update job with crew assignment
    const updateSql = 'UPDATE jobs SET crew_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await query(updateSql, [crew_id, id]);

    // Update crew availability
    const updateCrewSql = 'UPDATE crews SET is_available = 0, current_job_id = ? WHERE id = ?';
    await query(updateCrewSql, [id, crew_id]);

    // If there was a previous crew, make them available
    if (existingJob[0].crew_id) {
      const freeCrewSql = 'UPDATE crews SET is_available = 1, current_job_id = NULL WHERE id = ?';
      await query(freeCrewSql, [existingJob[0].crew_id]);
    }

    const response = createSuccessResponse('Crew assigned successfully', {
      job_id: id,
      crew_id,
      crew_name: existingCrew[0].name,
      assignment_notes
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get job progress
const getJobProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if job exists
    const checkSql = 'SELECT id, status FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    // Get time logs
    const timeLogsSql = `
      SELECT 
        tl.id,
        tl.activity_type,
        tl.start_time,
        tl.end_time,
        tl.duration_minutes,
        tl.notes,
        e.name as crew_member
      FROM job_time_logs tl
      JOIN employees e ON tl.employee_id = e.id
      WHERE tl.job_id = ?
      ORDER BY tl.start_time DESC
    `;
    const timeLogs = await query(timeLogsSql, [id]);

    // Get photos
    const photosSql = 'SELECT * FROM job_photos WHERE job_id = ? ORDER BY uploaded_at DESC';
    const photos = await query(photosSql, [id]);

    // Calculate progress percentage based on status
    let progressPercentage = 0;
    switch (existingJob[0].status) {
      case 'scheduled':
        progressPercentage = 0;
        break;
      case 'in-progress':
        progressPercentage = 50;
        break;
      case 'completed':
        progressPercentage = 100;
        break;
      case 'cancelled':
        progressPercentage = 0;
        break;
    }

    // Get notes from status history
    const notesSql = `
      SELECT 
        jsh.notes,
        jsh.created_at,
        e.name as crew_member
      FROM job_status_history jsh
      LEFT JOIN employees e ON jsh.changed_by = e.id
      WHERE jsh.job_id = ? AND jsh.notes IS NOT NULL
      ORDER BY jsh.created_at DESC
    `;
    const notes = await query(notesSql, [id]);

    const response = createSuccessResponse('Job progress retrieved successfully', {
      job_id: id,
      current_status: existingJob[0].status,
      progress_percentage: progressPercentage,
      time_logs: timeLogs.map(log => ({
        id: log.id,
        crew_member: log.crew_member,
        activity: log.activity_type,
        start_time: log.start_time,
        end_time: log.end_time,
        duration_minutes: log.duration_minutes
      })),
      photos: {
        before: photos.filter(p => p.photo_type === 'before').map(p => p.file_path),
        after: photos.filter(p => p.photo_type === 'after').map(p => p.file_path)
      },
      notes: notes.map(note => ({
        id: note.id,
        crew_member: note.crew_member,
        note: note.notes,
        timestamp: note.created_at
      }))
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get job items
const getJobItems = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if job exists
    const checkSql = 'SELECT id FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    // Get job items
    const itemsSql = 'SELECT * FROM job_items WHERE job_id = ? ORDER BY created_at ASC';
    const items = await query(itemsSql, [id]);

    const response = createSuccessResponse('Job items retrieved successfully', {
      job_id: id,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        base_price: item.base_price,
        difficulty: item.difficulty,
        estimated_time: item.estimated_time,
        actual_time: item.actual_time,
        notes: item.notes
      }))
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Add item to job
const addItemToJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const itemData = req.body;

    // Check if job exists
    const checkSql = 'SELECT id FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    // Insert new item
    const itemId = uuidv4();
    const insertSql = `
      INSERT INTO job_items (
        id, job_id, name, category, quantity, base_price,
        difficulty, estimated_time, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(insertSql, [
      itemId,
      id,
      itemData.name,
      itemData.category,
      itemData.quantity || 1,
      itemData.base_price,
      itemData.difficulty || 'medium',
      itemData.estimated_time,
      itemData.notes || null
    ]);

    const response = createSuccessResponse('Item added to job successfully', {
      item_id: itemId,
      job_id: id
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Upload job photos
const uploadJobPhotos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { photo_type, description } = req.body;

    // Check if job exists
    const checkSql = 'SELECT id FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    if (!req.files || req.files.length === 0) {
      return createErrorResponse('No photos uploaded', 'NO_PHOTOS_UPLOADED', 400);
    }

    const uploadedPhotos = [];

    for (const file of req.files) {
      const photoId = uuidv4();
      const photoUrl = getFileUrl(req, file.filename);

      // Insert photo record
      const photoSql = `
        INSERT INTO job_photos (
          id, job_id, photo_type, file_path, file_name,
          file_size, mime_type, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await query(photoSql, [
        photoId,
        id,
        photo_type,
        photoUrl,
        file.filename,
        file.size,
        file.mimetype,
        req.user.id
      ]);

      uploadedPhotos.push({
        id: photoId,
        filename: file.filename,
        url: photoUrl,
        photo_type,
        description
      });
    }

    const response = createSuccessResponse('Photos uploaded successfully', {
      job_id: id,
      uploaded_photos: uploadedPhotos
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Get job photos
const getJobPhotos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { photo_type } = req.query;

    // Check if job exists
    const checkSql = 'SELECT id FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    // Build query
    let photosSql = 'SELECT * FROM job_photos WHERE job_id = ?';
    const params = [id];

    if (photo_type) {
      photosSql += ' AND photo_type = ?';
      params.push(photo_type);
    }

    photosSql += ' ORDER BY uploaded_at DESC';
    const photos = await query(photosSql, params);

    // Group photos by type
    const groupedPhotos = {
      before: [],
      after: []
    };

    photos.forEach(photo => {
      groupedPhotos[photo.photo_type].push({
        id: photo.id,
        filename: photo.file_name,
        url: photo.file_path,
        photo_type: photo.photo_type,
        description: photo.description,
        uploaded_at: photo.uploaded_at
      });
    });

    const response = createSuccessResponse('Job photos retrieved successfully', {
      job_id: id,
      photos: groupedPhotos
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Start job time log
const startJobTimeLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { crew_member_id, activity, notes } = req.body;

    // Check if job exists
    const checkSql = 'SELECT id FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    // Insert time log
    const logId = uuidv4();
    const insertSql = `
      INSERT INTO job_time_logs (
        id, job_id, employee_id, activity_type, start_time, notes
      ) VALUES (?, ?, ?, ?, NOW(), ?)
    `;

    await query(insertSql, [logId, id, crew_member_id, activity, notes]);

    const response = createSuccessResponse('Time log started successfully', {
      time_log_id: logId,
      job_id: id,
      start_time: new Date().toISOString(),
      status: 'active'
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Stop job time log
const stopJobTimeLog = async (req, res, next) => {
  try {
    const { id, logId } = req.params;
    const { notes } = req.body;

    // Check if time log exists and is active
    const checkSql = `
      SELECT id, start_time, activity_type 
      FROM job_time_logs 
      WHERE id = ? AND job_id = ? AND end_time IS NULL
    `;
    const existingLog = await query(checkSql, [logId, id]);

    if (existingLog.length === 0) {
      return createErrorResponse('Active time log not found', 'TIME_LOG_NOT_FOUND', 404);
    }

    // Calculate duration
    const startTime = new Date(existingLog[0].start_time);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

    // Update time log
    const updateSql = `
      UPDATE job_time_logs 
      SET end_time = NOW(), duration_minutes = ?, notes = CONCAT(COALESCE(notes, ''), ' | ', ?)
      WHERE id = ?
    `;
    await query(updateSql, [durationMinutes, notes || 'Stopped', logId]);

    const response = createSuccessResponse('Time log stopped successfully', {
      time_log_id: logId,
      job_id: id,
      start_time: existingLog[0].start_time,
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      status: 'completed'
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Send job notification
const sendJobNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notificationData = req.body;

    // Check if job exists
    const checkSql = 'SELECT id, customer_email FROM jobs WHERE id = ?';
    const existingJob = await query(checkSql, [id]);

    if (existingJob.length === 0) {
      return createErrorResponse('Job not found', 'JOB_NOT_FOUND', 404);
    }

    // Insert notification record
    const notificationId = uuidv4();
    const insertSql = `
      INSERT INTO job_notifications (
        id, job_id, notification_type, message, sent_to,
        delivery_method, status, sent_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const sentTo = [];
    const deliveryMethods = [];

    if (notificationData.send_email) {
      sentTo.push(existingJob[0].customer_email);
      deliveryMethods.push('email');
    }

    if (notificationData.send_sms) {
      // In a real implementation, you would get the customer's phone number
      // and send SMS via Twilio or similar service
      deliveryMethods.push('sms');
    }

    await query(insertSql, [
      notificationId,
      id,
      notificationData.type,
      notificationData.message,
      sentTo.join(', '),
      deliveryMethods.join(', '),
      'sent',
      req.user.id
    ]);

    // In a real implementation, you would actually send the notifications here
    // For now, we'll just simulate success

    const response = createSuccessResponse('Notification sent successfully', {
      notification_id: notificationId,
      job_id: id,
      sent_to: sentTo,
      delivery_status: 'sent'
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Get job summary report
const getJobSummaryReport = async (req, res, next) => {
  try {
    const { date_from, date_to, crew_id, status, format = 'json' } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (date_from) {
      whereClause += ' AND scheduled_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND scheduled_date <= ?';
      params.push(date_to);
    }

    if (crew_id) {
      whereClause += ' AND crew_id = ?';
      params.push(crew_id);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Get summary statistics
    const summarySql = `
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_jobs,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_jobs,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_jobs,
        SUM(total_estimate) as total_revenue,
        AVG(total_estimate) as average_job_value,
        SUM(estimated_hours) as total_hours,
        AVG(estimated_hours) as average_job_duration
      FROM jobs
      ${whereClause}
    `;

    const summaryResult = await query(summarySql, params);
    const summary = summaryResult[0];

    // Get jobs by status
    const statusSql = `
      SELECT status, COUNT(*) as count
      FROM jobs
      ${whereClause}
      GROUP BY status
    `;
    const statusResults = await query(statusSql, params);

    const jobsByStatus = {};
    statusResults.forEach(row => {
      jobsByStatus[row.status] = row.count;
    });

    // Get jobs by crew
    const crewSql = `
      SELECT 
        c.id as crew_id,
        c.name as crew_name,
        COUNT(j.id) as job_count
      FROM crews c
      LEFT JOIN jobs j ON c.id = j.crew_id ${whereClause.replace('WHERE 1=1', 'AND')}
      GROUP BY c.id, c.name
      HAVING job_count > 0
    `;
    const crewResults = await query(crewSql, params.slice(1)); // Remove the first '1=1' condition

    const jobsByCrew = {};
    crewResults.forEach(row => {
      jobsByCrew[row.crew_id] = row.job_count;
    });

    const response = createSuccessResponse('Job summary report generated successfully', {
      report_period: {
        from: date_from || 'all',
        to: date_to || 'all'
      },
      summary: {
        total_jobs: summary.total_jobs || 0,
        completed_jobs: summary.completed_jobs || 0,
        scheduled_jobs: summary.scheduled_jobs || 0,
        in_progress_jobs: summary.in_progress_jobs || 0,
        cancelled_jobs: summary.cancelled_jobs || 0,
        total_revenue: summary.total_revenue || 0,
        average_job_value: summary.average_job_value || 0,
        total_hours: summary.total_hours || 0,
        average_job_duration: summary.average_job_duration || 0
      },
      jobs_by_status: jobsByStatus,
      jobs_by_crew: jobsByCrew
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  assignCrewToJob,
  getJobProgress,
  getJobItems,
  addItemToJob,
  uploadJobPhotos,
  getJobPhotos,
  startJobTimeLog,
  stopJobTimeLog,
  sendJobNotification,
  getJobSummaryReport
};
