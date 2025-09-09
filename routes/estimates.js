const express = require('express');
const router = express.Router();
const { 
  getEstimates, 
  getEstimate, 
  createEstimate, 
  updateEstimate, 
  updateEstimateStatus,
  deleteEstimate 
} = require('../controllers/estimateController');
const { auth } = require('../middleware/auth');
const { validateEstimate, validateStatusUpdate } = require('../middleware/estimateValidation');

// Unauthenticated route for status updates
router.patch('/:id/status', validateStatusUpdate, updateEstimateStatus);

// All other routes require authentication
router.use(auth);

// Estimate routes
router.get('/', getEstimates);
router.get('/:id', getEstimate);
router.post('/', validateEstimate, createEstimate);
router.put('/:id', validateEstimate, updateEstimate);
router.delete('/:id', deleteEstimate);

module.exports = router;
