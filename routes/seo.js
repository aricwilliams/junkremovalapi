const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const { validateAnalysis } = require('../middleware/seoValidation');

/**
 * SEO Rankings API Routes
 * 
 * Single endpoint for complete SEO ranking analysis:
 * - Geocodes business address using OpenCage Data API
 * - Generates search grid around business location
 * - Runs SerpApi ranking analysis for each grid point
 * - Returns simplified results with rankings
 */

/**
 * @route   POST /api/seo/analyze
 * @desc    Complete SEO ranking analysis (geocoding + grid + rankings)
 * @access  Public
 * @body    { 
 *   business_address: string,
 *   keyword: string,
 *   target_business_name: string,
 *   grid_size: string
 * }
 * @returns { query: string, center: {lat, lng}, points: array }
 */
router.post('/analyze', validateAnalysis, seoController.runSEOAnalysis);

/**
 * @route   GET /api/seo/grid-sizes
 * @desc    Get available grid sizes and their configurations
 * @access  Public
 * @returns { success: boolean, grid_sizes: array }
 */
router.get('/grid-sizes', seoController.getGridSizes);

/**
 * @route   POST /api/seo/add-key
 * @desc    Add a new SerpApi key to rotation
 * @access  Public
 * @body    { api_key: string }
 * @returns { success: boolean, message: string }
 */
router.post('/add-key', seoController.addApiKey);

/**
 * @route   GET /api/seo/usage-stats
 * @desc    Get API key usage statistics
 * @access  Public
 * @returns { success: boolean, stats: array }
 */
router.get('/usage-stats', seoController.getUsageStats);

module.exports = router;
