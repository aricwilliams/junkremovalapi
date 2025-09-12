const UploadService = require('../services/uploadService');
const Upload = require('../models/Upload');

/**
 * Upload single file
 */
const uploadFile = async (req, res, next) => {
  try {
    const file = req.file;
    const body = req.body;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Check if AWS S3 is configured
    if (!UploadService.isS3Configured()) {
      return res.status(500).json({
        success: false,
        message: 'AWS S3 not configured. Please contact administrator.'
      });
    }

    // Process upload
    const { safeParseJSON } = require('../utils/safeJson');
    const upload = await UploadService.processFileUpload(file, req.user.id, {
      title: body.title || file.originalname,
      description: body.description || '',
      tags: safeParseJSON(body.tags, []),
      is_public: body.is_public === 'true',
      metadata: safeParseJSON(body.metadata, {})
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: upload
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload file',
      error: error.message 
    });
  }
};

/**
 * Upload multiple files
 */
const uploadMultipleFiles = async (req, res, next) => {
  try {
    const files = req.files;
    const body = req.body;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    // Check if AWS S3 is configured
    if (!UploadService.isS3Configured()) {
      return res.status(500).json({
        success: false,
        message: 'AWS S3 not configured. Please contact administrator.'
      });
    }

    // Process multiple uploads
    const { safeParseJSON } = require('../utils/safeJson');
    const result = await UploadService.processMultipleFileUploads(files, req.user.id, {
      title: body.title || 'Multiple Files',
      description: body.description || '',
      tags: safeParseJSON(body.tags, []),
      is_public: body.is_public === 'true',
      metadata: safeParseJSON(body.metadata, {})
    });

    res.status(201).json({
      success: true,
      message: `Processed ${result.total} files: ${result.successful} successful, ${result.failed} failed`,
      data: result
    });

  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload files',
      error: error.message 
    });
  }
};

/**
 * Get user's uploads
 */
const getUserUploads = async (req, res, next) => {
  try {
    // Parse and validate inputs
    const businessId = Number(req.user?.id);
    const pageRaw = Number(req.query.page ?? 1);
    const limitRaw = Number(req.query.limit ?? 20);
    
    const page = Math.min(Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1), 1000);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const offset = (page - 1) * limit;

    if (!Number.isFinite(businessId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid business_id' 
      });
    }

    const {
      file_type,
      is_public,
      search,
      sort_field = 'created_at',
      sort_order = 'DESC',
      start_date,
      end_date
    } = req.query;

    const uploads = await Upload.findByBusinessId(businessId, {
      file_type,
      is_public: is_public !== undefined ? is_public === 'true' : undefined,
      search,
      sort_field,
      sort_order,
      start_date,
      end_date,
      limit,
      ...(offset > 0 && { offset })
    });

    // Generate signed URLs for private files
    const uploadsWithUrls = await Promise.all(uploads.map(async (upload) => {
      let fileUrl = upload.file_url;
      
      // If file is private and not already a full URL, generate signed URL
      if (!upload.is_public && !/^https?:\/\//i.test(fileUrl)) {
        try {
          fileUrl = await UploadService.getSignedUrl(upload.file_path, 3600); // 1 hour expiry
        } catch (error) {
          console.error('Error generating signed URL:', error);
        }
      }
      
      return {
        ...upload.toJSON(),
        file_url: fileUrl
      };
    }));

    res.json({
      success: true,
      data: uploadsWithUrls,
      pagination: {
        page,
        limit,
        total: uploads.length,
        has_more: uploads.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch uploads',
      error: error.message 
    });
  }
};

/**
 * Get public uploads
 */
const getPublicUploads = async (req, res, next) => {
  try {
    // Parse and validate inputs
    const pageRaw = Number(req.query.page ?? 1);
    const limitRaw = Number(req.query.limit ?? 20);
    
    const page = Math.min(Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1), 1000);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const offset = (page - 1) * limit;

    const {
      file_type,
      search,
      sort_field = 'created_at',
      sort_order = 'DESC',
      start_date,
      end_date
    } = req.query;

    const uploads = await Upload.findPublic({
      file_type,
      search,
      sort_field,
      sort_order,
      start_date,
      end_date,
      limit,
      ...(offset > 0 && { offset })
    });

    res.json({
      success: true,
      data: uploads.map(upload => upload.toJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: uploads.length,
        has_more: uploads.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching public uploads:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch public uploads',
      error: error.message 
    });
  }
};

/**
 * Get single upload by ID
 */
const getUploadById = async (req, res, next) => {
  try {
    const uploadId = req.params.id;
    const userId = req.user.id;

    const upload = await Upload.findById(uploadId, userId);

    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    // Generate signed URL if needed
    let fileUrl = upload.file_url;
    if (!upload.is_public && !/^https?:\/\//i.test(fileUrl)) {
      try {
        fileUrl = await UploadService.getSignedUrl(upload.file_path, 3600);
      } catch (error) {
        console.error('Error generating signed URL:', error);
      }
    }

    res.json({
      success: true,
      data: {
        ...upload.toJSON(),
        file_url: fileUrl
      }
    });
  } catch (error) {
    console.error('Error fetching upload:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch upload',
      error: error.message 
    });
  }
};

/**
 * Update upload
 */
const updateUpload = async (req, res, next) => {
  try {
    const uploadId = req.params.id;
    const userId = req.user.id;
    const updateData = req.body;

    const updatedUpload = await Upload.update(uploadId, userId, updateData);

    res.json({
      success: true,
      message: 'Upload updated successfully',
      data: updatedUpload.toJSON()
    });
  } catch (error) {
    console.error('Error updating upload:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update upload',
      error: error.message 
    });
  }
};

/**
 * Delete upload
 */
const deleteUpload = async (req, res, next) => {
  try {
    const uploadId = req.params.id;
    const userId = req.user.id;

    const upload = await Upload.delete(uploadId, userId);

    // Delete from S3
    try {
      await UploadService.deleteFromS3(upload.file_path);
      
      // Also delete thumbnail if it exists
      if (upload.thumbnail_url) {
        const thumbnailKey = upload.thumbnail_url.split('/').slice(-2).join('/');
        await UploadService.deleteFromS3(thumbnailKey);
      }
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
      // Continue even if S3 deletion fails
    }

    res.json({
      success: true,
      message: 'Upload deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete upload',
      error: error.message 
    });
  }
};

/**
 * Get upload statistics
 */
const getUploadStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    const stats = await Upload.getStats(userId, {
      start_date,
      end_date
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching upload stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch upload statistics',
      error: error.message 
    });
  }
};

/**
 * Search uploads
 */
const searchUploads = async (req, res, next) => {
  try {
    // Parse and validate inputs
    const businessId = Number(req.user?.id);
    const pageRaw = Number(req.query.page ?? 1);
    const limitRaw = Number(req.query.limit ?? 20);
    
    const page = Math.min(Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1), 1000);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const offset = (page - 1) * limit;

    if (!Number.isFinite(businessId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid business_id' 
      });
    }

    const { q: searchTerm, file_type, is_public, sort_field = 'created_at', sort_order = 'DESC' } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const uploads = await Upload.search(businessId, searchTerm, {
      file_type,
      is_public: is_public !== undefined ? is_public === 'true' : undefined,
      sort_field,
      sort_order,
      limit,
      ...(offset > 0 && { offset })
    });

    // Generate signed URLs for private files
    const uploadsWithUrls = await Promise.all(uploads.map(async (upload) => {
      let fileUrl = upload.file_url;
      
      if (!upload.is_public && !/^https?:\/\//i.test(fileUrl)) {
        try {
          fileUrl = await UploadService.getSignedUrl(upload.file_path, 3600);
        } catch (error) {
          console.error('Error generating signed URL:', error);
        }
      }
      
      return {
        ...upload.toJSON(),
        file_url: fileUrl
      };
    }));

    res.json({
      success: true,
      data: uploadsWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: uploads.length,
        has_more: uploads.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error searching uploads:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search uploads',
      error: error.message 
    });
  }
};

/**
 * Get recent uploads
 */
const getRecentUploads = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const uploads = await Upload.getRecent(userId, parseInt(limit));

    // Generate signed URLs for private files
    const uploadsWithUrls = await Promise.all(uploads.map(async (upload) => {
      let fileUrl = upload.file_url;
      
      if (!upload.is_public && !/^https?:\/\//i.test(fileUrl)) {
        try {
          fileUrl = await UploadService.getSignedUrl(upload.file_path, 3600);
        } catch (error) {
          console.error('Error generating signed URL:', error);
        }
      }
      
      return {
        ...upload.toJSON(),
        file_url: fileUrl
      };
    }));

    res.json({
      success: true,
      data: uploadsWithUrls
    });
  } catch (error) {
    console.error('Error fetching recent uploads:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch recent uploads',
      error: error.message 
    });
  }
};

/**
 * View upload (increment view count)
 */
const viewUpload = async (req, res, next) => {
  try {
    const uploadId = req.params.id;
    const userId = req.user.id;

    // Check if business has access to this upload
    const upload = await Upload.findById(uploadId, userId);
    
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    // Increment view count
    await Upload.incrementViewCount(uploadId);

    // Generate signed URL if needed
    let fileUrl = upload.file_url;
    if (!upload.is_public && !/^https?:\/\//i.test(fileUrl)) {
      try {
        fileUrl = await UploadService.getSignedUrl(upload.file_path, 3600);
      } catch (error) {
        console.error('Error generating signed URL:', error);
      }
    }

    res.json({
      success: true,
      data: {
        ...upload.toJSON(),
        file_url: fileUrl
      }
    });
  } catch (error) {
    console.error('Error viewing upload:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to view upload',
      error: error.message 
    });
  }
};

/**
 * Download upload (increment download count)
 */
const downloadUpload = async (req, res, next) => {
  try {
    const uploadId = req.params.id;
    const userId = req.user.id;

    // Check if business has access to this upload
    const upload = await Upload.findById(uploadId, userId);
    
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    // Increment download count
    await Upload.incrementDownloadCount(uploadId);

    // Generate signed URL for download
    let downloadUrl = upload.file_url;
    if (!/^https?:\/\//i.test(downloadUrl)) {
      try {
        downloadUrl = await UploadService.getSignedUrl(upload.file_path, 3600);
      } catch (error) {
        console.error('Error generating signed URL:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate download URL'
        });
      }
    }

    res.json({
      success: true,
      data: {
        download_url: downloadUrl,
        filename: upload.original_name,
        file_size: upload.file_size,
        mime_type: upload.mime_type
      }
    });
  } catch (error) {
    console.error('Error downloading upload:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to download upload',
      error: error.message 
    });
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  getUserUploads,
  getPublicUploads,
  getUploadById,
  updateUpload,
  deleteUpload,
  getUploadStats,
  searchUploads,
  getRecentUploads,
  viewUpload,
  downloadUpload
};
