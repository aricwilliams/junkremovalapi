const express = require('express');
const router = express.Router();
const { createPublicEstimate } = require('../controllers/estimateController');
const { validateEstimate } = require('../middleware/estimateValidation');

/**
 * @route   POST /api/v1/public/estimates
 * @desc    Create a new estimate without authentication (public endpoint)
 * @access  Public
 * @body    {
 *   "full_name": "John Doe",
 *   "phone_number": "5551234567",
 *   "email_address": "john@example.com",
 *   "service_address": "123 Main St, City, State 12345",
 *   "location_on_property": "Garage",
 *   "approximate_volume": "Small truck load",
 *   "material_types": ["furniture", "electronics"],
 *   "additional_notes": "Please call before coming"
 * }
 */
router.post('/', validateEstimate, createPublicEstimate);

module.exports = router;
