const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/database');

// Helper function to create standardized API response
const createResponse = (success, message, data = null, error = null) => ({
  success,
  message,
  data,
  error,
  timestamp: new Date().toISOString()
});

// Helper function to build WHERE clause for filtering
const buildWhereClause = (filters) => {
  const conditions = [];
  const params = [];
  
  if (filters.search) {
    conditions.push('(l.name LIKE ? OR l.company LIKE ? OR l.email LIKE ? OR l.phone LIKE ? OR l.city LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  if (filters.status) {
    conditions.push('l.status = ?');
    params.push(filters.status);
  }
  
  if (filters.source) {
    conditions.push('l.source = ?');
    params.push(filters.source);
  }
  
  if (filters.priority) {
    conditions.push('l.priority = ?');
    params.push(filters.priority);
  }
  
  if (filters.assigned_to) {
    conditions.push('l.assigned_to = ?');
    params.push(filters.assigned_to);
  }
  
  if (filters.date_from) {
    conditions.push('DATE(l.created_at) >= ?');
    params.push(filters.date_from);
  }
  
  if (filters.date_to) {
    conditions.push('DATE(l.created_at) <= ?');
    params.push(filters.date_to);
  }
  
  // Exclude deleted leads
  conditions.push('l.status != "deleted"');
  
  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

// Helper function to build ORDER BY clause
const buildOrderClause = (sortBy, sortOrder) => {
  const validSortFields = ['name', 'company', 'email', 'city', 'state', 'created_at', 'last_contact_date', 'estimated_value', 'lead_score'];
  const validSortOrders = ['asc', 'desc'];
  
  const field = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const order = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';
  
  return `ORDER BY l.${field} ${order.toUpperCase()}`;
};

// 1. Get All Leads
const getAllLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      source,
      priority,
      assigned_to,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const filters = { search, status, source, priority, assigned_to, date_from, date_to };
    
    const { where, params } = buildWhereClause(filters);
    const orderClause = buildOrderClause(sort_by, sort_order);

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM leads l 
      ${where}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Get leads with pagination
    const leadsSql = `
      SELECT 
        l.id,
        l.name,
        l.company,
        l.email,
        l.phone,
        l.mobile,
        l.address,
        l.city,
        l.state,
        l.zip_code,
        l.country,
        l.status,
        l.source,
        l.priority,
        l.estimated_value,
        l.service_type,
        l.lead_score,
        l.notes,
        l.created_at,
        l.updated_at,
        l.last_contact_date,
        l.next_follow_up_date,
        l.assigned_to,
        l.converted_at,
        l.converted_to_customer_id
      FROM leads l
      ${where}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    
    const leads = await query(leadsSql, [...params, parseInt(limit), offset]);

    // Get summary statistics
    const summarySql = `
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
        COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
        COUNT(CASE WHEN status = 'quoted' THEN 1 END) as quoted_leads,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_leads,
        SUM(estimated_value) as total_potential_value
      FROM leads
      ${where}
    `;
    
    const summary = await query(summarySql, params);

    // Format response
    const formattedLeads = leads.map(lead => ({
      id: lead.id,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      mobile: lead.mobile,
      status: lead.status,
      source: lead.source,
      priority: lead.priority,
      assigned_to: lead.assigned_to,
      estimated_value: parseFloat(lead.estimated_value || 0),
      service_type: lead.service_type,
      location: `${lead.address}, ${lead.city}, ${lead.state} ${lead.zip_code}`,
      created: lead.created_at,
      last_contact: lead.last_contact_date,
      next_follow_up: lead.next_follow_up_date
    }));

    const response = createResponse(true, 'Leads retrieved successfully', {
      leads: formattedLeads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        total_leads: summary[0].total_leads,
        new_leads: summary[0].new_leads,
        contacted_leads: summary[0].contacted_leads,
        qualified_leads: summary[0].qualified_leads,
        quoted_leads: summary[0].quoted_leads,
        scheduled_leads: summary[0].scheduled_leads,
        converted_leads: summary[0].converted_leads,
        lost_leads: summary[0].lost_leads,
        total_potential_value: parseFloat(summary[0].total_potential_value || 0)
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting leads:', error);
    const response = createResponse(false, 'Failed to retrieve leads', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 2. Get Lead by ID
const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get lead details
    const leadSql = `
      SELECT * FROM leads WHERE id = ? AND status != 'deleted'
    `;
    const leads = await query(leadSql, [id]);
    
    if (leads.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    const lead = leads[0];

    // Get lead contacts
    const contactsSql = `
      SELECT 
        id, contact_type, first_name, last_name, title, email, phone, mobile, 
        relationship, is_primary_contact, can_make_decisions, 
        preferred_contact_method, notes, created_at
      FROM lead_contacts 
      WHERE lead_id = ?
      ORDER BY is_primary_contact DESC, created_at ASC
    `;
    const contacts = await query(contactsSql, [id]);

    // Get lead activities
    const activitiesSql = `
      SELECT 
        id, activity_type, subject, description, activity_date, duration_minutes,
        outcome, next_action, next_action_date, scheduled_follow_up, 
        is_completed, completed_at, notes, created_at
      FROM lead_activities 
      WHERE lead_id = ?
      ORDER BY activity_date DESC
    `;
    const activities = await query(activitiesSql, [id]);

    // Get lead notes
    const notesSql = `
      SELECT 
        id, note_type, title, content, is_internal, is_important, priority,
        due_date, is_completed, completed_at, created_at
      FROM lead_notes 
      WHERE lead_id = ?
      ORDER BY created_at DESC
    `;
    const notes = await query(notesSql, [id]);

    // Get lead tags
    const tagsSql = `
      SELECT 
        lt.id, lt.name, lt.color, lt.description,
        lta.assigned_at
      FROM lead_tag_assignments lta
      JOIN lead_tags lt ON lta.tag_id = lt.id
      WHERE lta.lead_id = ?
      ORDER BY lta.assigned_at DESC
    `;
    const tags = await query(tagsSql, [id]);

    // Get lead qualification
    const qualificationSql = `
      SELECT 
        is_qualified, qualification_score, qualification_notes, 
        qualification_criteria, qualified_date, qualified_by, assessed_at
      FROM lead_qualifications 
      WHERE lead_id = ?
    `;
    const qualifications = await query(qualificationSql, [id]);

    // Get lead sources
    const sourcesSql = `
      SELECT 
        source_type, source_name, campaign_name, campaign_id, keyword,
        referrer_url, utm_source, utm_medium, utm_campaign, utm_term,
        utm_content, cost_per_lead, created_at
      FROM lead_sources 
      WHERE lead_id = ?
      ORDER BY created_at DESC
    `;
    const sources = await query(sourcesSql, [id]);

    // Get lead quotes
    const quotesSql = `
      SELECT 
        id, quote_number, quote_amount, quote_type, status, sent_at,
        viewed_at, responded_at, response, counter_offer_amount,
        expiry_date, notes, created_at
      FROM lead_quotes 
      WHERE lead_id = ?
      ORDER BY created_at DESC
    `;
    const quotes = await query(quotesSql, [id]);

    // Get lead follow-ups
    const followUpsSql = `
      SELECT 
        id, follow_up_type, subject, description, scheduled_date,
        scheduled_time, priority, assigned_to, status, completed_at,
        outcome, next_follow_up_date, created_at
      FROM lead_follow_ups 
      WHERE lead_id = ?
      ORDER BY scheduled_date ASC
    `;
    const followUps = await query(followUpsSql, [id]);

    // Get lead workflow
    const workflowSql = `
      SELECT 
        workflow_name, current_stage, stage_order, entered_stage_at,
        stage_duration_hours, is_completed, completed_at, notes
      FROM lead_workflows 
      WHERE lead_id = ?
      ORDER BY stage_order ASC
    `;
    const workflows = await query(workflowSql, [id]);

    const response = createResponse(true, 'Lead retrieved successfully', {
      lead: {
        id: lead.id,
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        mobile: lead.mobile,
        status: lead.status,
        source: lead.source,
        priority: lead.priority,
        assigned_to: lead.assigned_to,
        estimated_value: parseFloat(lead.estimated_value || 0),
        service_type: lead.service_type,
        location: {
          street: lead.address,
          city: lead.city,
          state: lead.state,
          zip_code: lead.zip_code,
          country: lead.country
        },
        project_details: {
          description: lead.notes,
          timeline: null, // Could be added to leads table if needed
          budget_range: null, // Could be added to leads table if needed
          urgency: lead.priority
        },
        qualification: qualifications[0] || {
          is_qualified: false,
          qualification_score: 0,
          qualification_notes: null,
          qualification_criteria: null
        },
        activities: activities.map(activity => ({
          id: activity.id,
          type: activity.activity_type,
          description: activity.description,
          created: activity.activity_date
        })),
        notes: notes.map(note => ({
          id: note.id,
          content: note.content,
          created_by: null, // Could be added to lead_notes table
          created: note.created_at
        })),
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        })),
        sources: sources,
        quotes: quotes,
        follow_ups: followUps,
        workflow: workflows[0] || null,
        created: lead.created_at,
        updated: lead.updated_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead:', error);
    const response = createResponse(false, 'Failed to retrieve lead', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 3. Create New Lead
const createLead = async (req, res) => {
  try {
    const leadData = req.body;
    const leadId = uuidv4();

    await transaction(async (connection) => {
      // Insert main lead record
      const leadSql = `
        INSERT INTO leads (
          id, name, company, email, phone, mobile, address, city, state, 
          zip_code, country, latitude, longitude, status, source, 
          estimated_value, service_type, priority, lead_score, notes, 
          assigned_to, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(leadSql, [
        leadId,
        leadData.name,
        leadData.company || null,
        leadData.email,
        leadData.phone,
        leadData.mobile || null,
        leadData.address,
        leadData.city,
        leadData.state,
        leadData.zip_code,
        leadData.country || 'USA',
        leadData.latitude || null,
        leadData.longitude || null,
        leadData.status || 'new',
        leadData.source || 'other',
        leadData.estimated_value || null,
        leadData.service_type || null,
        leadData.priority || 'medium',
        leadData.lead_score || 0,
        leadData.notes || null,
        leadData.assigned_to || null,
        req.user?.id || null
      ]);

      // Insert contacts if provided
      if (leadData.contacts && leadData.contacts.length > 0) {
        for (const contact of leadData.contacts) {
          const contactId = uuidv4();
          const contactSql = `
            INSERT INTO lead_contacts (
              id, lead_id, contact_type, first_name, last_name, title,
              email, phone, mobile, relationship, is_primary_contact,
              can_make_decisions, preferred_contact_method, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          await connection.execute(contactSql, [
            contactId,
            leadId,
            contact.contact_type || 'primary',
            contact.first_name,
            contact.last_name,
            contact.title || null,
            contact.email || null,
            contact.phone || null,
            contact.mobile || null,
            contact.relationship || null,
            contact.is_primary_contact || false,
            contact.can_make_decisions || false,
            contact.preferred_contact_method || 'phone',
            contact.notes || null
          ]);
        }
      }

      // Insert tags if provided
      if (leadData.tags && leadData.tags.length > 0) {
        for (const tagId of leadData.tags) {
          const tagAssignmentId = uuidv4();
          const tagAssignmentSql = `
            INSERT INTO lead_tag_assignments (
              id, lead_id, tag_id, assigned_by
            ) VALUES (?, ?, ?, ?)
          `;
          
          await connection.execute(tagAssignmentSql, [
            tagAssignmentId,
            leadId,
            tagId,
            req.user?.id || null
          ]);
        }
      }

      // Create initial activity
      const activityId = uuidv4();
      const activitySql = `
        INSERT INTO lead_activities (
          id, lead_id, activity_type, description, activity_date, outcome
        ) VALUES (?, ?, 'initial_contact', 'Lead created', NOW(), 'neutral')
      `;
      
      await connection.execute(activitySql, [activityId, leadId]);

      // Create initial qualification record
      const qualificationId = uuidv4();
      const qualificationSql = `
        INSERT INTO lead_qualifications (
          id, lead_id, is_qualified, qualification_score, assessed_by
        ) VALUES (?, ?, FALSE, 0, ?)
      `;
      
      await connection.execute(qualificationSql, [qualificationId, leadId, req.user?.id || null]);
    });

    const response = createResponse(true, 'Lead created successfully', {
      lead_id: leadId,
      lead: {
        id: leadId,
        name: leadData.name,
        company: leadData.company,
        status: leadData.status || 'new',
        source: leadData.source || 'other',
        created: new Date().toISOString()
      }
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating lead:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      const response = createResponse(false, 'Lead with this email or phone already exists', null, 'DUPLICATE_LEAD');
      return res.status(409).json(response);
    }
    
    const response = createResponse(false, 'Failed to create lead', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 4. Update Lead
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if lead exists
    const checkSql = 'SELECT id FROM leads WHERE id = ? AND status != "deleted"';
    const existingLead = await query(checkSql, [id]);
    
    if (existingLead.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateParams.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      const response = createResponse(false, 'No fields to update', null, 'NO_FIELDS_TO_UPDATE');
      return res.status(400).json(response);
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    const updateSql = `UPDATE leads SET ${updateFields.join(', ')} WHERE id = ?`;
    updateParams.push(id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Lead updated successfully', {
      lead_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating lead:', error);
    const response = createResponse(false, 'Failed to update lead', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 5. Delete Lead (Soft Delete)
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if lead exists
    const checkSql = 'SELECT id FROM leads WHERE id = ? AND status != "deleted"';
    const existingLead = await query(checkSql, [id]);
    
    if (existingLead.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Soft delete - update status to 'deleted'
    const deleteSql = 'UPDATE leads SET status = "deleted", updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await query(deleteSql, [id]);

    const response = createResponse(true, 'Lead deleted successfully', {
      lead_id: id,
      status: 'deleted'
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting lead:', error);
    const response = createResponse(false, 'Failed to delete lead', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 6. Search Leads
const searchLeads = async (req, res) => {
  try {
    const {
      q,
      search_fields = 'name,company,email,phone',
      status,
      source,
      priority,
      assigned_to,
      min_estimated_value,
      max_estimated_value,
      service_type
    } = req.query;

    if (!q) {
      const response = createResponse(false, 'Search query is required', null, 'SEARCH_QUERY_REQUIRED');
      return res.status(400).json(response);
    }

    const startTime = Date.now();
    const searchFields = search_fields.split(',').map(field => field.trim());
    
    // Build search conditions
    const searchConditions = [];
    const searchParams = [];
    
    if (searchFields.includes('name')) {
      searchConditions.push('l.name LIKE ?');
      searchParams.push(`%${q}%`);
    }
    
    if (searchFields.includes('company')) {
      searchConditions.push('l.company LIKE ?');
      searchParams.push(`%${q}%`);
    }
    
    if (searchFields.includes('email')) {
      searchConditions.push('l.email LIKE ?');
      searchParams.push(`%${q}%`);
    }
    
    if (searchFields.includes('phone')) {
      searchConditions.push('l.phone LIKE ?');
      searchParams.push(`%${q}%`);
    }

    // Build WHERE clause
    const whereConditions = [`(${searchConditions.join(' OR ')})`];
    
    if (status) {
      whereConditions.push('l.status = ?');
      searchParams.push(status);
    }
    
    if (source) {
      whereConditions.push('l.source = ?');
      searchParams.push(source);
    }
    
    if (priority) {
      whereConditions.push('l.priority = ?');
      searchParams.push(priority);
    }
    
    if (assigned_to) {
      whereConditions.push('l.assigned_to = ?');
      searchParams.push(assigned_to);
    }
    
    if (min_estimated_value !== undefined) {
      whereConditions.push('l.estimated_value >= ?');
      searchParams.push(parseFloat(min_estimated_value));
    }
    
    if (max_estimated_value !== undefined) {
      whereConditions.push('l.estimated_value <= ?');
      searchParams.push(parseFloat(max_estimated_value));
    }
    
    if (service_type) {
      whereConditions.push('l.service_type LIKE ?');
      searchParams.push(`%${service_type}%`);
    }

    // Exclude deleted leads
    whereConditions.push('l.status != "deleted"');

    const whereClause = whereConditions.join(' AND ');

    // Execute search
    const searchSql = `
      SELECT 
        l.id, l.name, l.company, l.status, l.source, l.priority,
        l.estimated_value, l.service_type, l.created_at
      FROM leads l
      WHERE ${whereClause}
      ORDER BY l.name ASC
      LIMIT 50
    `;

    const results = await query(searchSql, searchParams);
    const searchTime = Date.now() - startTime;

    // Format results with relevance scoring
    const formattedResults = results.map(lead => {
      let relevanceScore = 0.5; // Base score
      let matchReason = '';
      
      // Calculate relevance based on search matches
      if (lead.name.toLowerCase().includes(q.toLowerCase())) {
        relevanceScore += 0.3;
        matchReason = `Name contains '${q}'`;
      }
      
      if (lead.company && lead.company.toLowerCase().includes(q.toLowerCase())) {
        relevanceScore += 0.2;
        matchReason = `Company contains '${q}'`;
      }

      return {
        id: lead.id,
        name: lead.name,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        match_reason: matchReason,
        relevance_score: Math.min(relevanceScore, 1.0)
      };
    });

    const response = createResponse(true, 'Lead search completed successfully', {
      query: q,
      search_fields: searchFields,
      results: formattedResults,
      total_results: formattedResults.length,
      search_time_ms: searchTime
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error searching leads:', error);
    const response = createResponse(false, 'Failed to search leads', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 7. Convert Lead to Customer
const convertLead = async (req, res) => {
  try {
    const { id } = req.params;
    const conversionData = req.body;

    // Check if lead exists and is not already converted
    const checkSql = 'SELECT id, status FROM leads WHERE id = ? AND status != "deleted"';
    const existingLead = await query(checkSql, [id]);
    
    if (existingLead.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    if (existingLead[0].status === 'converted') {
      const response = createResponse(false, 'Lead is already converted', null, 'LEAD_ALREADY_CONVERTED');
      return res.status(409).json(response);
    }

    await transaction(async (connection) => {
      // Update lead status to converted
      const updateLeadSql = `
        UPDATE leads 
        SET status = 'converted', converted_at = CURRENT_TIMESTAMP, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      await connection.execute(updateLeadSql, [id]);

      // Create customer record (this would integrate with your customers API)
      const customerId = uuidv4();
      const customerSql = `
        INSERT INTO customers (
          id, name, email, phone, address, city, state, zip_code, 
          country, customer_type, status, source, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'lead_conversion', ?, NOW())
      `;
      
      await connection.execute(customerSql, [
        customerId,
        conversionData.customer_name,
        existingLead[0].email,
        existingLead[0].phone,
        existingLead[0].address,
        existingLead[0].city,
        existingLead[0].state,
        existingLead[0].zip_code,
        existingLead[0].country,
        conversionData.customer_type,
        `Converted from lead: ${conversionData.first_job_details.notes || 'No notes'}`
      ]);

      // Create lead conversion record
      const conversionId = uuidv4();
      const conversionSql = `
        INSERT INTO lead_conversions (
          id, lead_id, customer_id, conversion_date, conversion_reason,
          conversion_value, conversion_channel, converted_by
        ) VALUES (?, ?, ?, NOW(), 'Lead qualification successful', ?, 'website', ?)
      `;
      
      await connection.execute(conversionSql, [
        conversionId,
        id,
        customerId,
        conversionData.first_job_details.estimated_value,
        req.user?.id || null
      ]);

      // Update lead with customer reference
      const updateCustomerRefSql = `
        UPDATE leads 
        SET converted_to_customer_id = ? 
        WHERE id = ?
      `;
      await connection.execute(updateCustomerRefSql, [customerId, id]);
    });

    const response = createResponse(true, 'Lead converted successfully', {
      lead_id: id,
      customer_id: customerId,
      customer_name: conversionData.customer_name,
      conversion_value: conversionData.first_job_details.estimated_value
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error converting lead:', error);
    const response = createResponse(false, 'Failed to convert lead', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Health check endpoint
const healthCheck = async (req, res) => {
  try {
    // Test database connection
    const result = await query('SELECT 1 as test');
    
    res.status(200).json({
      success: true,
      message: 'Leads API is healthy',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '1.0.0'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Leads API health check failed',
      error: 'HEALTH_CHECK_FAILED',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  searchLeads,
  convertLead,
  healthCheck
};
