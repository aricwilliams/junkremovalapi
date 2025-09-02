const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../config/database');

/**
 * Pricing Categories Controller
 * Handles all pricing category operations
 */

/**
 * Get all pricing categories
 */
async function getAllPricingCategories(req, res) {
  try {
    const connection = await getConnection();

    const query = `
      SELECT 
        pc.id,
        pc.name,
        pc.description,
        pc.color,
        pc.icon,
        pc.is_active,
        pc.sort_order,
        pc.created_at,
        pc.updated_at,
        COUNT(pi.id) as item_count
      FROM pricing_categories pc
      LEFT JOIN pricing_items pi ON pc.id = pi.category AND pi.is_active = true
      WHERE pc.is_active = true
      GROUP BY pc.id, pc.name, pc.description, pc.color, pc.icon, pc.is_active, pc.sort_order
      ORDER BY pc.sort_order, pc.name
    `;

    const [categories] = await connection.execute(query);

    const response = {
      success: true,
      message: 'Pricing categories retrieved successfully',
      data: {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          is_active: cat.is_active,
          sort_order: cat.sort_order,
          item_count: cat.item_count,
          created_at: cat.created_at,
          updated_at: cat.updated_at
        }))
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting pricing categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing categories',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get pricing category by ID
 */
async function getPricingCategoryById(req, res) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    const query = `
      SELECT 
        pc.id,
        pc.name,
        pc.description,
        pc.color,
        pc.icon,
        pc.is_active,
        pc.sort_order,
        pc.created_at,
        pc.updated_at,
        COUNT(pi.id) as item_count
      FROM pricing_categories pc
      LEFT JOIN pricing_items pi ON pc.id = pi.category AND pi.is_active = true
      WHERE pc.id = ? AND pc.is_active = true
      GROUP BY pc.id, pc.name, pc.description, pc.color, pc.icon, pc.is_active, pc.sort_order
    `;

    const [results] = await connection.execute(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing category not found',
        error: 'CATEGORY_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const category = results[0];

    // Get pricing items in this category
    const itemsQuery = `
      SELECT 
        id, name, base_price, price_per_unit, unit_type, estimated_time,
        difficulty, description, volume_weight, volume_yardage, is_active, sort_order
      FROM pricing_items
      WHERE category = ? AND is_active = true
      ORDER BY sort_order, name
    `;

    const [items] = await connection.execute(itemsQuery, [id]);

    const response = {
      success: true,
      message: 'Pricing category retrieved successfully',
      data: {
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          is_active: category.is_active,
          sort_order: category.sort_order,
          item_count: category.item_count,
          pricing_items: items.map(item => ({
            id: item.id,
            name: item.name,
            base_price: item.base_price,
            price_per_unit: item.price_per_unit,
            unit_type: item.unit_type,
            estimated_time: item.estimated_time,
            difficulty: item.difficulty,
            description: item.description,
            volume_weight: item.volume_weight,
            volume_yardage: item.volume_yardage,
            is_active: item.is_active,
            sort_order: item.sort_order
          })),
          created_at: category.created_at,
          updated_at: category.updated_at
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting pricing category by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing category',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create new pricing category
 */
async function createPricingCategory(req, res) {
  try {
    const connection = await getConnection();
    const categoryId = uuidv4();
    
    const {
      name,
      description,
      color,
      icon,
      is_active = true,
      sort_order = 0
    } = req.body;

    // Check if category name already exists
    const checkQuery = 'SELECT id FROM pricing_categories WHERE name = ?';
    const [checkResult] = await connection.execute(checkQuery, [name]);

    if (checkResult.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Pricing category with this name already exists',
        error: 'DUPLICATE_CATEGORY_NAME',
        timestamp: new Date().toISOString()
      });
    }

    const query = `
      INSERT INTO pricing_categories (
        id, name, description, color, icon, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [categoryId, name, description, color, icon, is_active, sort_order];
    await connection.execute(query, params);

    const response = {
      success: true,
      message: 'Pricing category created successfully',
      data: {
        category_id: categoryId,
        name,
        description,
        color,
        icon,
        is_active,
        sort_order
      },
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating pricing category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pricing category',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update pricing category
 */
async function updatePricingCategory(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const connection = await getConnection();

    // Check if category exists
    const checkQuery = 'SELECT id, name FROM pricing_categories WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing category not found',
        error: 'CATEGORY_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const category = checkResult[0];

    // Check if name is being updated and if it conflicts with existing names
    if (updateData.name && updateData.name !== category.name) {
      const nameCheckQuery = 'SELECT id FROM pricing_categories WHERE name = ? AND id != ?';
      const [nameCheckResult] = await connection.execute(nameCheckQuery, [updateData.name, id]);

      if (nameCheckResult.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Pricing category with this name already exists',
          error: 'DUPLICATE_CATEGORY_NAME',
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

    const query = `UPDATE pricing_categories SET ${updateFields.join(', ')} WHERE id = ?`;
    await connection.execute(query, params);

    const response = {
      success: true,
      message: 'Pricing category updated successfully',
      data: {
        category_id: id,
        updated_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined && updateData[key] !== null)
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error updating pricing category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing category',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete pricing category
 */
async function deletePricingCategory(req, res) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    // Check if category exists
    const checkQuery = 'SELECT id, name FROM pricing_categories WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing category not found',
        error: 'CATEGORY_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const category = checkResult[0];

    // Check if category has pricing items
    const itemsQuery = 'SELECT COUNT(*) as item_count FROM pricing_items WHERE category = ?';
    const [itemsResult] = await connection.execute(itemsQuery, [id]);
    const itemCount = itemsResult[0].item_count;

    if (itemCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete category that has pricing items',
        error: 'CATEGORY_HAS_ITEMS',
        data: {
          item_count: itemCount
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if category is used in estimate templates
    const templateUsageQuery = `
      SELECT COUNT(*) as template_usage_count
      FROM estimate_template_items
      WHERE category = ?
    `;
    
    const [templateUsageResult] = await connection.execute(templateUsageQuery, [id]);
    const templateUsageCount = templateUsageResult[0].template_usage_count;

    if (templateUsageCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete category that is used in estimate templates',
        error: 'CATEGORY_IN_TEMPLATES',
        data: {
          template_usage_count: templateUsageCount
        },
        timestamp: new Date().toISOString()
      });
    }

    // Delete the category
    const deleteQuery = 'DELETE FROM pricing_categories WHERE id = ?';
    await connection.execute(deleteQuery, [id]);

    const response = {
      success: true,
      message: 'Pricing category deleted successfully',
      data: {
        category_id: id,
        name: category.name
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error deleting pricing category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pricing category',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Reorder pricing categories
 */
async function reorderPricingCategories(req, res) {
  try {
    const { category_orders } = req.body;
    const connection = await getConnection();

    if (!Array.isArray(category_orders) || category_orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category orders array is required and must not be empty',
        error: 'INVALID_ORDERS_DATA',
        timestamp: new Date().toISOString()
      });
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      const results = [];
      const errors = [];

      for (const order of category_orders) {
        const { id, sort_order } = order;

        if (!id || sort_order === undefined) {
          errors.push({ id: id || 'missing', error: 'ID and sort_order are required' });
          continue;
        }

        try {
          // Check if category exists
          const checkQuery = 'SELECT id FROM pricing_categories WHERE id = ?';
          const [checkResult] = await connection.execute(checkQuery, [id]);

          if (checkResult.length === 0) {
            errors.push({ id, error: 'Category not found' });
            continue;
          }

          // Update sort order
          const updateQuery = 'UPDATE pricing_categories SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          await connection.execute(updateQuery, [sort_order, id]);

          results.push({ id, sort_order, status: 'updated' });

        } catch (error) {
          errors.push({ id, error: error.message });
        }
      }

      // Commit transaction
      await connection.commit();

      const response = {
        success: true,
        message: 'Category reordering completed',
        data: {
          total_categories: category_orders.length,
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
    console.error('Error reordering pricing categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder categories',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getAllPricingCategories,
  getPricingCategoryById,
  createPricingCategory,
  updatePricingCategory,
  deletePricingCategory,
  reorderPricingCategories
};
