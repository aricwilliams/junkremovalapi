const { query } = require('../config/database');

// Helper function to create standardized API response
const createResponse = (success, message, data = null, error = null) => ({
  success,
  message,
  data,
  error,
  timestamp: new Date().toISOString()
});

// Get lead qualification details and scoring
const getLeadQualification = async (req, res) => {
  try {
    const { id } = req.params;

    const qualificationSql = `
      SELECT 
        is_qualified, qualification_score, qualification_notes, 
        qualification_criteria, qualified_date, qualified_by, assessed_at
      FROM lead_qualifications 
      WHERE lead_id = ?
    `;
    
    const qualifications = await query(qualificationSql, [id]);
    
    if (qualifications.length === 0) {
      const response = createResponse(false, 'Lead qualification not found', null, 'QUALIFICATION_NOT_FOUND');
      return res.status(404).json(response);
    }

    const qualification = qualifications[0];

    const response = createResponse(true, 'Lead qualification retrieved successfully', {
      lead_id: id,
      qualification: {
        is_qualified: qualification.is_qualified,
        qualification_score: qualification.qualification_score,
        qualification_notes: qualification.qualification_notes,
        qualification_criteria: qualification.qualification_criteria,
        qualified_date: qualification.qualified_date,
        qualified_by: qualification.qualified_by,
        assessed_at: qualification.assessed_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead qualification:', error);
    const response = createResponse(false, 'Failed to retrieve lead qualification', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update lead qualification status and scoring
const updateLeadQualification = async (req, res) => {
  try {
    const { id } = req.params;
    const qualificationData = req.body;

    // Check if lead exists
    const checkLeadSql = 'SELECT id FROM leads WHERE id = ? AND status != "deleted"';
    const existingLead = await query(checkLeadSql, [id]);
    
    if (existingLead.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if qualification record exists
    const checkQualificationSql = `
      SELECT id FROM lead_qualifications WHERE lead_id = ?
    `;
    const existingQualification = await query(checkQualificationSql, [id]);

    if (existingQualification.length === 0) {
      // Create new qualification record
      const createQualificationSql = `
        INSERT INTO lead_qualifications (
          id, lead_id, is_qualified, qualification_score, qualification_notes,
          qualification_criteria, qualified_date, qualified_by, assessed_by
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await query(createQualificationSql, [
        id,
        qualificationData.is_qualified || false,
        qualificationData.qualification_score || 0,
        qualificationData.qualification_notes || null,
        qualificationData.qualification_criteria ? JSON.stringify(qualificationData.qualification_criteria) : null,
        qualificationData.is_qualified ? new Date() : null,
        req.user?.id || null,
        req.user?.id || null
      ]);
    } else {
      // Update existing qualification record
      const updateQualificationSql = `
        UPDATE lead_qualifications 
        SET is_qualified = ?, qualification_score = ?, qualification_notes = ?,
            qualification_criteria = ?, qualified_date = ?, qualified_by = ?,
            assessed_at = CURRENT_TIMESTAMP
        WHERE lead_id = ?
      `;
      
      await query(updateQualificationSql, [
        qualificationData.is_qualified || false,
        qualificationData.qualification_score || 0,
        qualificationData.qualification_notes || null,
        qualificationData.qualification_criteria ? JSON.stringify(qualificationData.qualification_criteria) : null,
        qualificationData.is_qualified ? new Date() : null,
        req.user?.id || null,
        id
      ]);
    }

    // Update lead status if qualified
    if (qualificationData.is_qualified) {
      const updateLeadSql = `
        UPDATE leads 
        SET status = 'qualified', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      await query(updateLeadSql, [id]);
    }

    const response = createResponse(true, 'Lead qualification updated successfully', {
      lead_id: id,
      is_qualified: qualificationData.is_qualified || false,
      qualification_score: qualificationData.qualification_score || 0,
      updated_fields: Object.keys(qualificationData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating lead qualification:', error);
    const response = createResponse(false, 'Failed to update lead qualification', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getLeadQualification,
  updateLeadQualification
};
