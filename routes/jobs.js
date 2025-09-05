const express = require('express');
const router = express.Router();
const { 
  getJobs, 
  getJob, 
  createJob, 
  updateJob, 
  deleteJob,
  getJobStats,
  addJobItem,
  updateJobItem,
  deleteJobItem,
  addJobNote,
  updateJobNote,
  deleteJobNote,
  getJobStatusHistory
} = require('../controllers/jobController');
const { auth } = require('../middleware/auth');
const { validateJob, validateJobItem, validateJobNote } = require('../middleware/jobValidation');
const { upload } = require('../middleware/upload');

// All routes require authentication
router.use(auth);

// Job routes
router.get('/', getJobs);
router.get('/stats', getJobStats);
router.get('/:id', getJob);
router.get('/:id/status-history', getJobStatusHistory);
router.post('/', validateJob, createJob);
router.put('/:id', validateJob, updateJob);
router.delete('/:id', deleteJob);

// Job items routes
router.post('/:id/items', validateJobItem, addJobItem);
router.put('/:jobId/items/:itemId', validateJobItem, updateJobItem);
router.delete('/:jobId/items/:itemId', deleteJobItem);

// Job notes routes
router.post('/:id/notes', validateJobNote, addJobNote);
router.put('/:jobId/notes/:noteId', validateJobNote, updateJobNote);
router.delete('/:jobId/notes/:noteId', deleteJobNote);

// Job photos routes (will be implemented with file upload)
// router.post('/:id/photos', upload.single('photo'), addJobPhoto);
// router.delete('/:jobId/photos/:photoId', deleteJobPhoto);

module.exports = router;
