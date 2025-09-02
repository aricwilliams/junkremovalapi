const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

// Ensure upload directory exists
const uploadDir = config.upload.path;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const jobId = req.params.id;
    const jobUploadDir = path.join(uploadDir, 'jobs', jobId);
    
    // Create job-specific directory if it doesn't exist
    if (!fs.existsSync(jobUploadDir)) {
      fs.mkdirSync(jobUploadDir, { recursive: true });
    }
    
    cb(null, jobUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!config.upload.allowedTypes.includes(file.mimetype)) {
    const error = new Error('Invalid file type. Only images are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.fileLimits.maxFilesPerJob
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      error.message = `File too large. Maximum size is ${config.upload.maxFileSize / (1024 * 1024)}MB`;
      error.code = 'FILE_TOO_LARGE';
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      error.message = `Too many files. Maximum is ${config.fileLimits.maxFilesPerJob} files`;
      error.code = 'TOO_MANY_FILES';
    }
    error.statusCode = 400;
  }
  next(error);
};

// Middleware for single photo upload
const uploadSinglePhoto = upload.single('photo');

// Middleware for multiple photo uploads
const uploadMultiplePhotos = upload.array('photos', config.fileLimits.maxFilesPerJob);

// Helper function to get file URL
const getFileUrl = (req, filename) => {
  const baseUrl = config.server.baseUrl;
  const jobId = req.params.id;
  return `${baseUrl}/uploads/jobs/${jobId}/${filename}`;
};

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  uploadSinglePhoto,
  uploadMultiplePhotos,
  handleUploadError,
  getFileUrl,
  deleteFile
};
