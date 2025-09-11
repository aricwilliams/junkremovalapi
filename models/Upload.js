const db = require('../config/database');
const { safeParseTags, safeParseMetadata } = require('../utils/safeJson');

class Upload {
  constructor(data) {
    this.id = data.id;
    this.business_id = data.business_id;
    this.original_name = data.original_name;
    this.file_name = data.file_name;
    this.file_path = data.file_path;
    this.file_url = data.file_url;
    this.file_size = data.file_size;
    this.mime_type = data.mime_type;
    this.file_type = data.file_type;
    this.duration = data.duration;
    this.thumbnail_url = data.thumbnail_url;
    this.title = data.title;
    this.description = data.description;
    this.tags = data.tags;
    this.is_public = data.is_public;
    this.metadata = data.metadata;
    this.view_count = data.view_count;
    this.download_count = data.download_count;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new upload record
   */
  static async create(data) {
    try {
      const query = `
        INSERT INTO uploads (
          business_id, original_name, file_name, file_path, file_url, 
          file_size, mime_type, file_type, duration, thumbnail_url,
          title, description, tags, is_public, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        data.business_id,
        data.original_name,
        data.file_name,
        data.file_path,
        data.file_url,
        data.file_size,
        data.mime_type,
        data.file_type,
        data.duration || 0,
        data.thumbnail_url,
        data.title,
        data.description,
        JSON.stringify(data.tags || []),
        data.is_public || false,
        JSON.stringify(data.metadata || {})
      ];
      
      const result = await db.query(query, values);
      return result.insertId;
    } catch (error) {
      console.error('Error creating upload record:', error);
      throw error;
    }
  }

  /**
   * Find upload by ID
   */
  static async findById(id, businessId = null) {
    try {
      let query = 'SELECT * FROM uploads WHERE id = ?';
      const values = [id];
      
      if (businessId) {
        query += ' AND business_id = ?';
        values.push(businessId);
      }
      
      const rows = await db.query(query, values);
      
      if (rows.length === 0) {
        return null;
      }
      
      const upload = rows[0];
      
      // Safe JSON parsing for tags and metadata
      const safeUpload = {
        ...upload,
        tags: safeParseTags(upload.tags),
        metadata: safeParseMetadata(upload.metadata)
      };
      
      return new Upload(safeUpload);
    } catch (error) {
      console.error('Error finding upload by ID:', error);
      throw error;
    }
  }

  /**
   * Find uploads by business ID
   */
  static async findByBusinessId(businessId, options = {}) {
    try {
      // Ensure integers
      const bid = Number(businessId);
      const lim = Math.min(Math.max(1, Number(options.limit) || 20), 100);
      const off = Math.max(0, Number(options.offset) || 0);

      let query = 'SELECT * FROM uploads WHERE business_id = ?';
      const values = [bid];
      
      // Add filters
      if (options.file_type) {
        query += ' AND file_type = ?';
        values.push(options.file_type);
      }
      
      if (options.is_public !== undefined) {
        query += ' AND is_public = ?';
        values.push(options.is_public);
      }
      
      if (options.search) {
        query += ' AND (title LIKE ? OR description LIKE ? OR original_name LIKE ?)';
        const searchTerm = `%${options.search}%`;
        values.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (options.tags && options.tags.length > 0) {
        query += ' AND JSON_CONTAINS(tags, ?)';
        values.push(JSON.stringify(options.tags));
      }
      
      if (options.start_date && options.end_date) {
        query += ' AND created_at BETWEEN ? AND ?';
        values.push(options.start_date, options.end_date);
      }
      
      // Add ordering
      const sortField = options.sort_field || 'created_at';
      const sortOrder = options.sort_order || 'DESC';
      query += ` ORDER BY ${sortField} ${sortOrder}`;
      
      // Add pagination - inline sanitized integers (safest approach)
      if (lim > 0) {
        query += ` LIMIT ${lim}`;
        if (off > 0) {
          query += ` OFFSET ${off}`;
        }
      }
      
      const rows = await db.query(query, values);
      
      return rows.map(row => {
        // Safe JSON parsing for tags and metadata
        const safeRow = {
          ...row,
          tags: safeParseTags(row.tags),
          metadata: safeParseMetadata(row.metadata)
        };
        return new Upload(safeRow);
      });
    } catch (error) {
      console.error('Error finding uploads by business ID:', error);
      throw error;
    }
  }

  /**
   * Find public uploads
   */
  static async findPublic(options = {}) {
    try {
      // Ensure integers
      const lim = Math.min(Math.max(1, Number(options.limit) || 20), 100);
      const off = Math.max(0, Number(options.offset) || 0);

      let query = 'SELECT * FROM uploads WHERE is_public = true';
      const values = [];
      
      // Add filters
      if (options.file_type) {
        query += ' AND file_type = ?';
        values.push(options.file_type);
      }
      
      if (options.search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        const searchTerm = `%${options.search}%`;
        values.push(searchTerm, searchTerm);
      }
      
      if (options.tags && options.tags.length > 0) {
        query += ' AND JSON_CONTAINS(tags, ?)';
        values.push(JSON.stringify(options.tags));
      }
      
      if (options.start_date && options.end_date) {
        query += ' AND created_at BETWEEN ? AND ?';
        values.push(options.start_date, options.end_date);
      }
      
      // Add ordering
      const sortField = options.sort_field || 'created_at';
      const sortOrder = options.sort_order || 'DESC';
      query += ` ORDER BY ${sortField} ${sortOrder}`;
      
      // Add pagination - inline sanitized integers (safest approach)
      if (lim > 0) {
        query += ` LIMIT ${lim}`;
        if (off > 0) {
          query += ` OFFSET ${off}`;
        }
      }
      
      const rows = await db.query(query, values);
      
      return rows.map(row => {
        // Safe JSON parsing for tags and metadata
        const safeRow = {
          ...row,
          tags: safeParseTags(row.tags),
          metadata: safeParseMetadata(row.metadata)
        };
        return new Upload(safeRow);
      });
    } catch (error) {
      console.error('Error finding public uploads:', error);
      throw error;
    }
  }

  /**
   * Update upload record
   */
  static async update(id, businessId, updateData) {
    try {
      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.business_id;
      delete updateData.created_at;
      delete updateData.file_path;
      delete updateData.file_url;
      delete updateData.file_size;
      delete updateData.mime_type;
      delete updateData.file_type;
      
      // Build dynamic update query
      const allowedFields = [
        'title', 'description', 'tags', 'is_public', 'metadata'
      ];
      
      const updateFields = [];
      const updateValues = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          if (key === 'tags' || key === 'metadata') {
            updateFields.push(`${key} = ?`);
            updateValues.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
          }
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id, businessId);
      
      const query = `
        UPDATE uploads 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND business_id = ?
      `;
      
      const result = await db.query(query, updateValues);
      
      if (result.affectedRows === 0) {
        throw new Error('Upload not found or access denied');
      }
      
      return await this.findById(id, businessId);
    } catch (error) {
      console.error('Error updating upload:', error);
      throw error;
    }
  }

  /**
   * Delete upload record
   */
  static async delete(id, businessId) {
    try {
      // First get the upload to get the S3 key
      const upload = await this.findById(id, businessId);
      if (!upload) {
        throw new Error('Upload not found or access denied');
      }
      
      // Delete from database
      const query = 'DELETE FROM uploads WHERE id = ? AND business_id = ?';
      const result = await db.query(query, [id, businessId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Upload not found or access denied');
      }
      
      return upload; // Return the upload object for S3 cleanup
    } catch (error) {
      console.error('Error deleting upload:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(id) {
    try {
      const query = 'UPDATE uploads SET view_count = view_count + 1 WHERE id = ?';
      await db.query(query, [id]);
      return true;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return false;
    }
  }

  /**
   * Increment download count
   */
  static async incrementDownloadCount(id) {
    try {
      const query = 'UPDATE uploads SET download_count = download_count + 1 WHERE id = ?';
      await db.query(query, [id]);
      return true;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
  }

  /**
   * Get upload statistics for business
   */
  static async getStats(businessId, options = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_uploads,
          COUNT(CASE WHEN file_type = 'video' THEN 1 END) as video_count,
          COUNT(CASE WHEN file_type = 'image' THEN 1 END) as image_count,
          COUNT(CASE WHEN is_public = true THEN 1 END) as public_count,
          COUNT(CASE WHEN is_public = false THEN 1 END) as private_count,
          COALESCE(SUM(file_size), 0) as total_size,
          COALESCE(SUM(view_count), 0) as total_views,
          COALESCE(SUM(download_count), 0) as total_downloads,
          AVG(CASE WHEN file_size > 0 THEN file_size END) as avg_file_size
        FROM uploads 
        WHERE business_id = ?
      `;
      
      const values = [businessId];
      
      if (options.start_date && options.end_date) {
        query += ' AND created_at BETWEEN ? AND ?';
        values.push(options.start_date, options.end_date);
      }
      
      const rows = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error getting upload stats:', error);
      throw error;
    }
  }

  /**
   * Get recent uploads
   */
  static async getRecent(businessId, limit = 10) {
    try {
      const query = `
        SELECT * FROM uploads 
        WHERE business_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      const rows = await db.query(query, [businessId, limit]);
      
      return rows.map(row => {
        // Safe JSON parsing for tags and metadata
        const safeRow = {
          ...row,
          tags: safeParseTags(row.tags),
          metadata: safeParseMetadata(row.metadata)
        };
        return new Upload(safeRow);
      });
    } catch (error) {
      console.error('Error getting recent uploads:', error);
      throw error;
    }
  }

  /**
   * Search uploads
   */
  static async search(businessId, searchTerm, options = {}) {
    try {
      // Ensure integers
      const bid = Number(businessId);
      const lim = Math.min(Math.max(1, Number(options.limit) || 20), 100);
      const off = Math.max(0, Number(options.offset) || 0);

      let query = `
        SELECT * FROM uploads 
        WHERE business_id = ? 
        AND (title LIKE ? OR description LIKE ? OR original_name LIKE ?)
      `;
      
      const values = [bid, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
      
      // Add additional filters
      if (options.file_type) {
        query += ' AND file_type = ?';
        values.push(options.file_type);
      }
      
      if (options.is_public !== undefined) {
        query += ' AND is_public = ?';
        values.push(options.is_public);
      }
      
      // Add ordering
      const sortField = options.sort_field || 'created_at';
      const sortOrder = options.sort_order || 'DESC';
      query += ` ORDER BY ${sortField} ${sortOrder}`;
      
      // Add pagination - inline sanitized integers (safest approach)
      if (lim > 0) {
        query += ` LIMIT ${lim}`;
        if (off > 0) {
          query += ` OFFSET ${off}`;
        }
      }
      
      const rows = await db.query(query, values);
      
      return rows.map(row => {
        // Safe JSON parsing for tags and metadata
        const safeRow = {
          ...row,
          tags: safeParseTags(row.tags),
          metadata: safeParseMetadata(row.metadata)
        };
        return new Upload(safeRow);
      });
    } catch (error) {
      console.error('Error searching uploads:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      business_id: this.business_id,
      original_name: this.original_name,
      file_name: this.file_name,
      file_path: this.file_path,
      file_url: this.file_url,
      file_size: this.file_size,
      mime_type: this.mime_type,
      file_type: this.file_type,
      duration: this.duration,
      thumbnail_url: this.thumbnail_url,
      title: this.title,
      description: this.description,
      tags: this.tags,
      is_public: this.is_public,
      metadata: this.metadata,
      view_count: this.view_count,
      download_count: this.download_count,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Upload;
