const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const {
  validateUpload,
  validateUpdateUpload,
  validateSearch,
  validateGetUploads,
  validateUploadId,
  validateStats
} = require('../middleware/uploadValidation');
const {
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
} = require('../controllers/uploadController');

// Configure multer for file uploads
const getUploadMiddleware = () => {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedVideoMimeTypes = [
        'video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo',
        'video/ogg', 'video/mpeg', 'video/3gpp', 'video/avi', 'video/mov'
      ];
      
      const allowedImageMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
      ];
      
      const allAllowedMimeTypes = [...allowedVideoMimeTypes, ...allowedImageMimeTypes];
      const allowedExtensions = ['.webm', '.mp4', '.avi', '.mov', '.ogg', '.mpeg', '.3gp', '.wmv', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allAllowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: videos and images`), false);
      }
    },
    limits: {
      fileSize: 500 * 1024 * 1024 // 500MB limit per file
    }
  });
};

/**
 * @route   POST /api/v1/uploads
 * @desc    Upload single file
 * @access  Private
 */
router.post('/', 
  auth, 
  (req, res, next) => {
    const uploadMiddleware = getUploadMiddleware();
    return uploadMiddleware.single('file')(req, res, next);
  },
  (req, res, next) => {
    console.log('Upload middleware passed');
    next();
  },
  uploadFile
);

/**
 * @route   POST /api/v1/uploads/multiple
 * @desc    Upload multiple files
 * @access  Private
 */
router.post('/multiple',
  auth,
  (req, res, next) => {
    const uploadMiddleware = getUploadMiddleware();
    return uploadMiddleware.array('files', 10)(req, res, next);
  },
  validateUpload,
  uploadMultipleFiles
);

/**
 * @route   GET /api/v1/uploads
 * @desc    Get user's uploads
 * @access  Private
 */
router.get('/',
  auth,
  validateGetUploads,
  getUserUploads
);

/**
 * @route   GET /api/v1/uploads/public
 * @desc    Get public uploads
 * @access  Public
 */
router.get('/public',
  validateGetUploads,
  getPublicUploads
);

/**
 * @route   GET /api/v1/uploads/recent
 * @desc    Get recent uploads for user
 * @access  Private
 */
router.get('/recent',
  auth,
  getRecentUploads
);

/**
 * @route   GET /api/v1/uploads/stats
 * @desc    Get upload statistics for user
 * @access  Private
 */
router.get('/stats',
  auth,
  validateStats,
  getUploadStats
);

/**
 * @route   GET /api/v1/uploads/search
 * @desc    Search user's uploads
 * @access  Private
 */
router.get('/search',
  auth,
  validateSearch,
  searchUploads
);

/**
 * @route   GET /api/v1/uploads/:id
 * @desc    Get single upload by ID
 * @access  Private
 */
router.get('/:id',
  auth,
  validateUploadId,
  getUploadById
);

/**
 * @route   PUT /api/v1/uploads/:id
 * @desc    Update upload
 * @access  Private
 */
router.put('/:id',
  auth,
  validateUploadId,
  validateUpdateUpload,
  updateUpload
);

/**
 * @route   DELETE /api/v1/uploads/:id
 * @desc    Delete upload
 * @access  Private
 */
router.delete('/:id',
  auth,
  validateUploadId,
  deleteUpload
);

/**
 * @route   GET /api/v1/uploads/:id/view
 * @desc    View upload (increment view count)
 * @access  Private
 */
router.get('/:id/view',
  auth,
  validateUploadId,
  viewUpload
);

/**
 * @route   GET /api/v1/uploads/:id/download
 * @desc    Download upload (increment download count)
 * @access  Private
 */
router.get('/:id/download',
  auth,
  validateUploadId,
  downloadUpload
);

module.exports = router;
