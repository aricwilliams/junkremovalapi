const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../config/database');

/**
 * Estimate Templates Controller
 * Handles all estimate template operations
 */

/**
 * Get all estimate templates
 */
async function getAllEstimateTemplates(req, res) {
  try {
    const connection = await getConnection();

    const query = `
      SELECT 
        et.id,
        et.name,
        et.description,
        et.category,
        et.is_active,
        et.created_at,
        et.updated_at
      FROM estimate_templates et
      WHERE et.is_active = true
      ORDER BY et.name
    `;

    const [templates] = await connection.execute(query);

    // Get template items for each template
    const templatesWithItems = await Promise.all(
      templates.map(async (template) => {
        const itemsQuery = `
          SELECT 
            eti.id,
            eti.name,
            eti.category,
            eti.quantity,
            eti.base_price,
            eti.price_per_unit,
            eti.difficulty,
            eti.estimated_time,
            eti.volume_weight,
            eti.volume_yardage,
            eti.description,
            eti.sort_order
          FROM estimate_template_items eti
          WHERE eti.template_id = ?
          ORDER BY eti.sort_order, eti.name
        `;

        const [items] = await connection.execute(itemsQuery, [template.id]);

        return {
          ...template,
          items: items.map(item => ({
            description: item.name,
            base_price: item.base_price,
            category: item.category
          }))
        };
      })
    );

    const response = {
      success: true,
      message: 'Estimate templates retrieved successfully',
      data: {
        templates: templatesWithItems.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          service_type: template.category || 'general',
          items: template.items,
          is_default: template.name.includes('Standard') // Simple logic for default detection
        }))
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting estimate templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve estimate templates',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get estimate template by ID
 */
async function getEstimateTemplateById(req, res) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    // Get template details
    const templateQuery = `
      SELECT 
        id, name, description, category, is_active, created_at, updated_at
      FROM estimate_templates
      WHERE id = ?
    `;

    const [templateResults] = await connection.execute(templateQuery, [id]);

    if (templateResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate template not found',
        error: 'TEMPLATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const template = templateResults[0];

    // Get template items
    const itemsQuery = `
      SELECT 
        id, name, category, quantity, base_price, price_per_unit,
        difficulty, estimated_time, volume_weight, volume_yardage,
        description, sort_order
      FROM estimate_template_items
      WHERE template_id = ?
      ORDER BY sort_order, name
    `;

    const [items] = await connection.execute(itemsQuery, [id]);

    const response = {
      success: true,
      message: 'Estimate template retrieved successfully',
      data: {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          is_active: template.is_active,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            base_price: item.base_price,
            price_per_unit: item.price_per_unit,
            difficulty: item.difficulty,
            estimated_time: item.estimated_time,
            volume_weight: item.volume_weight,
            volume_yardage: item.volume_yardage,
            description: item.description,
            sort_order: item.sort_order
          })),
          created_at: template.created_at,
          updated_at: template.updated_at
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting estimate template by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve estimate template',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create new estimate template
 */
async function createEstimateTemplate(req, res) {
  try {
    const connection = await getConnection();
    const templateId = uuidv4();
    
    const {
      name,
      description,
      category,
      is_active = true,
      items
    } = req.body;

    // Start transaction
    await connection.beginTransaction();

    try {
      // Create template
      const templateQuery = `
        INSERT INTO estimate_templates (
          id, name, description, category, is_active
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const templateParams = [templateId, name, description, category, is_active];
      await connection.execute(templateQuery, templateParams);

      // Create template items if provided
      if (items && items.length > 0) {
        const itemQuery = `
          INSERT INTO estimate_template_items (
            id, template_id, name, category, quantity, base_price, price_per_unit,
            difficulty, estimated_time, volume_weight, volume_yardage, description, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemId = uuidv4();
          
          const itemParams = [
            itemId, templateId, item.name, item.category, item.quantity || 1,
            item.base_price, item.price_per_unit, item.difficulty || 'medium',
            item.estimated_time, item.volume_weight, item.volume_yardage,
            item.description, item.sort_order || i
          ];

          await connection.execute(itemQuery, itemParams);
        }
      }

      // Commit transaction
      await connection.commit();

      const response = {
        success: true,
        message: 'Estimate template created successfully',
        data: {
          template_id: templateId,
          name,
          description,
          category,
          item_count: items ? items.length : 0
        },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error creating estimate template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create estimate template',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update estimate template
 */
async function updateEstimateTemplate(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const connection = await getConnection();

    // Check if template exists
    const checkQuery = 'SELECT id FROM estimate_templates WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate template not found',
        error: 'TEMPLATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Build dynamic UPDATE query
    const updateFields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null && key !== 'items') {
        updateFields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (updateFields.length === 0 && !updateData.items) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'INVALID_UPDATE_DATA',
        timestamp: new Date().toISOString()
      });
    }

    // Update template fields
    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE estimate_templates SET ${updateFields.join(', ')} WHERE id = ?`;
      await connection.execute(query, params);
    }

    // Update template items if provided
    if (updateData.items) {
      // Start transaction for item updates
      await connection.beginTransaction();

      try {
        // Delete existing items
        const deleteItemsQuery = 'DELETE FROM estimate_template_items WHERE template_id = ?';
        await connection.execute(deleteItemsQuery, [id]);

        // Insert new items
        if (updateData.items.length > 0) {
          const itemQuery = `
            INSERT INTO estimate_template_items (
              id, template_id, name, category, quantity, base_price, price_per_unit,
              difficulty, estimated_time, volume_weight, volume_yardage, description, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          for (let i = 0; i < updateData.items.length; i++) {
            const item = updateData.items[i];
            const itemId = uuidv4();
            
            const itemParams = [
              itemId, id, item.name, item.category, item.quantity || 1,
              item.base_price, item.price_per_unit, item.difficulty || 'medium',
              item.estimated_time, item.volume_weight, item.volume_yardage,
              item.description, item.sort_order || i
            ];

            await connection.execute(itemQuery, itemParams);
          }
        }

        // Commit transaction
        await connection.commit();

      } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        throw error;
      }
    }

    const response = {
      success: true,
      message: 'Estimate template updated successfully',
      data: {
        template_id: id,
        updated_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined && updateData[key] !== null)
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error updating estimate template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update estimate template',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete estimate template
 */
async function deleteEstimateTemplate(req, res) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    // Check if template exists
    const checkQuery = 'SELECT id, name FROM estimate_templates WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate template not found',
        error: 'TEMPLATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const template = checkResult[0];

    // Check if template is used in any estimates
    const usageQuery = `
      SELECT COUNT(*) as usage_count
      FROM estimates
      WHERE notes LIKE ? OR description LIKE ?
    `;
    
    const [usageResult] = await connection.execute(usageQuery, [`%${template.name}%`, `%${template.name}%`]);
    const usageCount = usageResult[0].usage_count;

    if (usageCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete template that is used in estimates',
        error: 'TEMPLATE_IN_USE',
        data: {
          usage_count: usageCount
        },
        timestamp: new Date().toISOString()
      });
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Delete template items first (due to foreign key constraint)
      const deleteItemsQuery = 'DELETE FROM estimate_template_items WHERE template_id = ?';
      await connection.execute(deleteItemsQuery, [id]);

      // Delete the template
      const deleteTemplateQuery = 'DELETE FROM estimate_templates WHERE id = ?';
      await connection.execute(deleteTemplateQuery, [id]);

      // Commit transaction
      await connection.commit();

      const response = {
        success: true,
        message: 'Estimate template deleted successfully',
        data: {
          template_id: id,
          name: template.name
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error deleting estimate template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete estimate template',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create estimate from template
 */
async function createEstimateFromTemplate(req, res) {
  try {
    const connection = await getConnection();
    const estimateId = uuidv4();
    
    const {
      template_id,
      client_request_id,
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      state,
      zip_code,
      country = 'USA',
      customizations,
      expiry_date,
      terms_conditions,
      payment_terms,
      notes
    } = req.body;

    // Check if template exists
    const templateQuery = `
      SELECT 
        et.id, et.name, et.description, et.category,
        eti.id as item_id, eti.name, eti.category, eti.quantity,
        eti.base_price, eti.price_per_unit, eti.difficulty,
        eti.estimated_time, eti.volume_weight, eti.volume_yardage
      FROM estimate_templates et
      LEFT JOIN estimate_template_items eti ON et.id = eti.template_id
      WHERE et.id = ? AND et.is_active = true
    `;

    const [templateResults] = await connection.execute(templateQuery, [template_id]);

    if (templateResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate template not found',
        error: 'TEMPLATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const template = templateResults[0];
    const templateItems = templateResults.filter(row => row.item_id);

    // Start transaction
    await connection.beginTransaction();

    try {
      // Create estimate
      const estimateQuery = `
        INSERT INTO estimates (
          id, customer_name, customer_email, customer_phone,
          address, city, state, zip_code, country,
          labor_hours, labor_rate, subtotal, total, status, expiry_date,
          terms_conditions, payment_terms, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Calculate totals
      let subtotal = 0;
      const items = customizations?.items || templateItems.map(item => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit_price: item.price_per_unit || item.base_price
      }));

      items.forEach(item => {
        subtotal += (item.unit_price || 0) * (item.quantity || 1);
      });

      const additionalFees = customizations?.additional_fees || [];
      const feesTotal = additionalFees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
      const total = subtotal + feesTotal;

      const estimateParams = [
        estimateId, customer_name, customer_email, customer_phone,
        address, city, state, zip_code, country,
        0, 0, subtotal, total, 'draft', expiry_date,
        terms_conditions, payment_terms, notes
      ];

      await connection.execute(estimateQuery, estimateParams);

      // Create estimate items
      if (items && items.length > 0) {
        const itemQuery = `
          INSERT INTO estimate_items (
            id, estimate_id, name, category, quantity, base_price, price_per_unit,
            total, difficulty, estimated_time, volume_weight, volume_yardage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const item of items) {
          const itemId = uuidv4();
          const itemTotal = (item.unit_price || 0) * (item.quantity || 1);
          
          const itemParams = [
            itemId, estimateId, item.name, item.category, item.quantity || 1,
            item.unit_price || 0, item.unit_price || 0, itemTotal, 'medium',
            null, null, null
          ];

          await connection.execute(itemQuery, itemParams);
        }
      }

      // Create additional fees
      if (additionalFees && additionalFees.length > 0) {
        const feeQuery = `
          INSERT INTO estimate_additional_fees (
            id, estimate_id, fee_type, description, amount
          ) VALUES (?, ?, ?, ?, ?)
        `;

        for (const fee of additionalFees) {
          const feeId = uuidv4();
          
          const feeParams = [
            feeId, estimateId, 'custom', fee.description, fee.amount
          ];

          await connection.execute(feeQuery, feeParams);
        }
      }

      // Update client request if provided
      if (client_request_id) {
        const updateRequestQuery = `
          UPDATE client_requests 
          SET estimate_status = 'created', estimate_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        await connection.execute(updateRequestQuery, [estimateId, client_request_id]);
      }

      // Commit transaction
      await connection.commit();

      const response = {
        success: true,
        message: 'Estimate created from template successfully',
        data: {
          estimate_id: estimateId,
          template_used: template.name,
          total_amount: total
        },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error creating estimate from template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create estimate from template',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getAllEstimateTemplates,
  getEstimateTemplateById,
  createEstimateTemplate,
  updateEstimateTemplate,
  deleteEstimateTemplate,
  createEstimateFromTemplate
};
