const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../config/database');

/**
 * Pricing Items Controller
 * Handles all pricing item operations
 */

/**
 * Get all pricing items with filtering
 */
async function getAllPricingItems(req, res) {
  try {
    const connection = await getConnection();
    
    const {
      category,
      is_active,
      search,
      difficulty
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push('pi.category = ?');
      params.push(category);
    }

    if (is_active !== undefined) {
      conditions.push('pi.is_active = ?');
      params.push(is_active === 'true');
    }

    if (search) {
      conditions.push('(pi.name LIKE ? OR pi.description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (difficulty) {
      conditions.push('pi.difficulty = ?');
      params.push(difficulty);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        pi.id,
        pi.name,
        pi.category,
        pi.base_price,
        pi.price_per_unit,
        pi.unit_type,
        pi.estimated_time,
        pi.difficulty,
        pi.description,
        pi.volume_weight,
        pi.volume_yardage,
        pi.is_active,
        pi.sort_order,
        pi.created_at,
        pi.updated_at,
        pc.name as category_name,
        pc.color as category_color,
        pc.icon as category_icon
      FROM pricing_items pi
      LEFT JOIN pricing_categories pc ON pi.category = pc.id
      ${whereClause}
      ORDER BY pi.sort_order, pi.name
    `;

    const [pricingItems] = await connection.execute(query, params);

    const response = {
      success: true,
      message: 'Pricing items retrieved successfully',
      data: {
        pricing_items: pricingItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category_name || item.category,
          base_price: item.base_price,
          price_per_unit: item.price_per_unit,
          unit_type: item.unit_type,
          estimated_time: item.estimated_time,
          difficulty: item.difficulty,
          description: item.description,
          volume_weight: item.volume_weight,
          volume_yardage: item.volume_yardage,
          is_active: item.is_active,
          sort_order: item.sort_order,
          category_details: {
            id: item.category,
            name: item.category_name,
            color: item.category_color,
            icon: item.category_icon
          }
        }))
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting pricing items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing items',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get pricing item by ID
 */
async function getPricingItemById(req, res) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    const query = `
      SELECT 
        pi.id,
        pi.name,
        pi.category,
        pi.base_price,
        pi.price_per_unit,
        pi.unit_type,
        pi.estimated_time,
        pi.difficulty,
        pi.description,
        pi.volume_weight,
        pi.volume_yardage,
        pi.is_active,
        pi.sort_order,
        pi.created_at,
        pi.updated_at,
        pc.name as category_name,
        pc.color as category_color,
        pc.icon as category_icon
      FROM pricing_items pi
      LEFT JOIN pricing_categories pc ON pi.category = pc.id
      WHERE pi.id = ?
    `;

    const [results] = await connection.execute(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing item not found',
        error: 'PRICING_ITEM_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const pricingItem = results[0];

    const response = {
      success: true,
      message: 'Pricing item retrieved successfully',
      data: {
        pricing_item: {
          id: pricingItem.id,
          name: pricingItem.name,
          category: pricingItem.category_name || pricingItem.category,
          base_price: pricingItem.base_price,
          price_per_unit: pricingItem.price_per_unit,
          unit_type: pricingItem.unit_type,
          estimated_time: pricingItem.estimated_time,
          difficulty: pricingItem.difficulty,
          description: pricingItem.description,
          volume_weight: pricingItem.volume_weight,
          volume_yardage: pricingItem.volume_yardage,
          is_active: pricingItem.is_active,
          sort_order: pricingItem.sort_order,
          category_details: {
            id: pricingItem.category,
            name: pricingItem.category_name,
            color: pricingItem.category_color,
            icon: pricingItem.category_icon
          },
          created_at: pricingItem.created_at,
          updated_at: pricingItem.updated_at
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting pricing item by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing item',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create new pricing item
 */
async function createPricingItem(req, res) {
  try {
    const connection = await getConnection();
    const pricingItemId = uuidv4();
    
    const {
      name,
      category,
      base_price,
      price_per_unit,
      unit_type,
      estimated_time,
      difficulty = 'medium',
      description,
      volume_weight,
      volume_yardage,
      is_active = true,
      sort_order = 0
    } = req.body;

    // Check if category exists
    const categoryQuery = 'SELECT id FROM pricing_categories WHERE id = ?';
    const [categoryResult] = await connection.execute(categoryQuery, [category]);

    if (categoryResult.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing category',
        error: 'INVALID_CATEGORY',
        timestamp: new Date().toISOString()
      });
    }

    const query = `
      INSERT INTO pricing_items (
        id, name, category, base_price, price_per_unit, unit_type,
        estimated_time, difficulty, description, volume_weight,
        volume_yardage, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      pricingItemId, name, category, base_price, price_per_unit, unit_type,
      estimated_time, difficulty, description, volume_weight,
      volume_yardage, is_active, sort_order
    ];

    await connection.execute(query, params);

    const response = {
      success: true,
      message: 'Pricing item created successfully',
      data: {
        pricing_item_id: pricingItemId,
        name,
        category,
        base_price,
        price_per_unit,
        unit_type
      },
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating pricing item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pricing item',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update pricing item
 */
async function updatePricingItem(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const connection = await getConnection();

    // Check if pricing item exists
    const checkQuery = 'SELECT id FROM pricing_items WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing item not found',
        error: 'PRICING_ITEM_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Validate category if being updated
    if (updateData.category) {
      const categoryQuery = 'SELECT id FROM pricing_categories WHERE id = ?';
      const [categoryResult] = await connection.execute(categoryQuery, [updateData.category]);

      if (categoryResult.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pricing category',
          error: 'INVALID_CATEGORY',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Build dynamic UPDATE query
    const updateFields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        updateFields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'INVALID_UPDATE_DATA',
        timestamp: new Date().toISOString()
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE pricing_items SET ${updateFields.join(', ')} WHERE id = ?`;
    await connection.execute(query, params);

    const response = {
      success: true,
      message: 'Pricing item updated successfully',
      data: {
        pricing_item_id: id,
        updated_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined && updateData[key] !== null)
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error updating pricing item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing item',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete pricing item
 */
async function deletePricingItem(req, res) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    // Check if pricing item exists
    const checkQuery = 'SELECT id, name FROM pricing_items WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing item not found',
        error: 'PRICING_ITEM_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const pricingItem = checkResult[0];

    // Check if pricing item is used in any estimates
    const usageQuery = `
      SELECT COUNT(*) as usage_count
      FROM estimate_items
      WHERE name = ? OR description LIKE ?
    `;
    
    const [usageResult] = await connection.execute(usageQuery, [pricingItem.name, `%${pricingItem.name}%`]);
    const usageCount = usageResult[0].usage_count;

    if (usageCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete pricing item that is used in estimates',
        error: 'PRICING_ITEM_IN_USE',
        data: {
          usage_count: usageCount
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if pricing item is used in estimate templates
    const templateUsageQuery = `
      SELECT COUNT(*) as template_usage_count
      FROM estimate_template_items
      WHERE name = ? OR description LIKE ?
    `;
    
    const [templateUsageResult] = await connection.execute(templateUsageQuery, [pricingItem.name, `%${pricingItem.name}%`]);
    const templateUsageCount = templateUsageResult[0].template_usage_count;

    if (templateUsageCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete pricing item that is used in estimate templates',
        error: 'PRICING_ITEM_IN_TEMPLATES',
        data: {
          template_usage_count: templateUsageCount
        },
        timestamp: new Date().toISOString()
      });
    }

    // Delete the pricing item
    const deleteQuery = 'DELETE FROM pricing_items WHERE id = ?';
    await connection.execute(deleteQuery, [id]);

    const response = {
      success: true,
      message: 'Pricing item deleted successfully',
      data: {
        pricing_item_id: id,
        name: pricingItem.name
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error deleting pricing item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pricing item',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Bulk update pricing items
 */
async function bulkUpdatePricingItems(req, res) {
  try {
    const { updates } = req.body;
    const connection = await getConnection();

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required and must not be empty',
        error: 'INVALID_UPDATES_DATA',
        timestamp: new Date().toISOString()
      });
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      const results = [];
      const errors = [];

      for (const update of updates) {
        const { id, ...updateData } = update;

        if (!id) {
          errors.push({ id: 'missing', error: 'ID is required' });
          continue;
        }

        try {
          // Check if pricing item exists
          const checkQuery = 'SELECT id FROM pricing_items WHERE id = ?';
          const [checkResult] = await connection.execute(checkQuery, [id]);

          if (checkResult.length === 0) {
            errors.push({ id, error: 'Pricing item not found' });
            continue;
          }

          // Build dynamic UPDATE query
          const updateFields = [];
          const params = [];

          Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && updateData[key] !== null) {
              updateFields.push(`${key} = ?`);
              params.push(updateData[key]);
            }
          });

          if (updateFields.length > 0) {
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            const query = `UPDATE pricing_items SET ${updateFields.join(', ')} WHERE id = ?`;
            await connection.execute(query, params);

            results.push({ id, status: 'updated' });
          } else {
            results.push({ id, status: 'no_changes' });
          }

        } catch (error) {
          errors.push({ id, error: error.message });
        }
      }

      // Commit transaction
      await connection.commit();

      const response = {
        success: true,
        message: 'Bulk update completed',
        data: {
          total_items: updates.length,
          successful_updates: results.length,
          errors: errors.length,
          results,
          errors: errors.length > 0 ? errors : undefined
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
    console.error('Error in bulk update pricing items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk update',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getAllPricingItems,
  getPricingItemById,
  createPricingItem,
  updatePricingItem,
  deletePricingItem,
  bulkUpdatePricingItems
};
