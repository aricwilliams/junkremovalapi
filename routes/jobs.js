const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { uploadMultiplePhotos, handleUploadError } = require('../middleware/upload');
const { validateRequest } = require('../middleware/validation');
const {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
  assignCrewSchema,
  addItemToJobSchema,
  uploadPhotosSchema,
  startTimeLogSchema,
  stopTimeLogSchema,
  sendNotificationSchema,
  getJobsQuerySchema
} = require('../validations/jobValidation');

const {
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
} = require('../controllers/jobController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all jobs with filtering, sorting, and pagination
router.get('/', validateRequest(getJobsQuerySchema, 'query'), getAllJobs);

// Get job summary report
router.get('/reports/summary', requireRole(['admin', 'manager']), getJobSummaryReport);

// Get specific job by ID
router.get('/:id', getJobById);

// Create new job
router.post('/', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(createJobSchema), createJob);

// Update job
router.put('/:id', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(updateJobSchema), updateJob);

// Delete job (soft delete - sets status to cancelled)
router.delete('/:id', requireRole(['admin', 'manager']), deleteJob);

// Update job status
router.patch('/:id/status', requireRole(['admin', 'manager', 'crew_leader']), validateRequest(updateJobStatusSchema), updateJobStatus);

// Assign crew to job
router.post('/:id/crew', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(assignCrewSchema), assignCrewToJob);

// Get job progress
router.get('/:id/progress', getJobProgress);

// Job items routes
router.get('/:id/items', getJobItems);
router.post('/:id/items', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(addItemToJobSchema), addItemToJob);

// Job photos routes
router.get('/:id/photos', getJobPhotos);
router.post('/:id/photos', 
  requireRole(['admin', 'manager', 'crew_leader', 'crew_member']),
  uploadMultiplePhotos,
  handleUploadError,
  validateRequest(uploadPhotosSchema, 'body'),
  uploadJobPhotos
);

// Job time logs routes
router.post('/:id/time-logs/start', requireRole(['admin', 'manager', 'crew_leader', 'crew_member']), validateRequest(startTimeLogSchema), startJobTimeLog);
router.post('/:id/time-logs/:logId/stop', requireRole(['admin', 'manager', 'crew_leader', 'crew_member']), validateRequest(stopTimeLogSchema), stopJobTimeLog);

// Job notifications
router.post('/:id/notifications', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(sendNotificationSchema), sendJobNotification);

module.exports = router;
