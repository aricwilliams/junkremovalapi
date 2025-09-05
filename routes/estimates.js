const express = require('express');
const router = express.Router();
const { 
  getEstimates, 
  getEstimate, 
  createEstimate, 
  updateEstimate, 
  deleteEstimate 
} = require('../controllers/estimateController');
const { auth } = require('../middleware/auth');
const { validateEstimate } = require('../middleware/estimateValidation');

// All routes require authentication
router.use(auth);

// Estimate routes
router.get('/', getEstimates);
router.get('/:id', getEstimate);
router.post('/', validateEstimate, createEstimate);
router.put('/:id', validateEstimate, updateEstimate);
router.delete('/:id', deleteEstimate);

module.exports = router;
