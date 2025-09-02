const express = require('express');
const router = express.Router();

// Import controllers
const clientRequestsController = require('../controllers/clientRequestsController');
const estimatesController = require('../controllers/estimatesController');
const estimateTemplatesController = require('../controllers/estimateTemplatesController');
const pricingItemsController = require('../controllers/pricingItemsController');
const pricingCategoriesController = require('../controllers/pricingCategoriesController');
const estimateReportsController = require('../controllers/estimateReportsController');

// Import middleware
const { auth, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const {
  createClientRequest, updateClientRequest, getClientRequests, clientRequestId,
  createEstimate, updateEstimate, getEstimates, estimateId, createEstimateFromTemplate,
  sendEstimate, updateEstimateStatus, createEstimateItem, updateEstimateItem, itemId,
  createAdditionalFee, updateAdditionalFee, feeId, createPricingItem, updatePricingItem,
  getPricingItems, pricingItemId, createPricingCategory, updatePricingCategory,
  categoryId, createEstimateTemplate, updateEstimateTemplate, templateId,
  getEstimateReports
} = require('../validations/estimateValidation');

// Health check route (no authentication required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Estimates API is running',
    timestamp: new Date().toISOString()
  });
});

// Client Requests Routes
router.get('/client-requests', auth, validateRequest(getClientRequests), clientRequestsController.getAllClientRequests);
router.get('/client-requests/:id', auth, validateRequest(clientRequestId), clientRequestsController.getClientRequestById);
router.post('/client-requests', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createClientRequest), clientRequestsController.createClientRequest);
router.put('/client-requests/:id', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateClientRequest), clientRequestsController.updateClientRequest);
router.delete('/client-requests/:id', auth, requireRole(['admin', 'manager']), validateRequest(clientRequestId), clientRequestsController.deleteClientRequest);

// Estimates Routes
router.get('/', auth, validateRequest(getEstimates), estimatesController.getAllEstimates);
router.get('/:id', auth, validateRequest(estimateId), estimatesController.getEstimateById);
router.post('/', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createEstimate), estimatesController.createEstimate);
router.put('/:id', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateEstimate), estimatesController.updateEstimate);
router.post('/:id/send', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(sendEstimate), estimatesController.sendEstimate);
router.put('/:id/status', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateEstimateStatus), estimatesController.updateEstimateStatus);

// Estimate Items Routes
router.post('/:id/items', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createEstimateItem), estimatesController.addEstimateItem);
router.put('/:id/items/:itemId', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateEstimateItem), estimatesController.updateEstimateItem);
router.delete('/:id/items/:itemId', auth, requireRole(['admin', 'manager']), validateRequest(itemId), estimatesController.deleteEstimateItem);

// Estimate Additional Fees Routes
router.post('/:id/fees', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createAdditionalFee), estimatesController.addAdditionalFee);
router.put('/:id/fees/:feeId', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateAdditionalFee), estimatesController.updateAdditionalFee);
router.delete('/:id/fees/:feeId', auth, requireRole(['admin', 'manager']), validateRequest(feeId), estimatesController.deleteAdditionalFee);

// Estimate Templates Routes
router.get('/templates', auth, estimateTemplatesController.getAllEstimateTemplates);
router.get('/templates/:id', auth, validateRequest(templateId), estimateTemplatesController.getEstimateTemplateById);
router.post('/templates', auth, requireRole(['admin', 'manager']), validateRequest(createEstimateTemplate), estimateTemplatesController.createEstimateTemplate);
router.put('/templates/:id', auth, requireRole(['admin', 'manager']), validateRequest(updateEstimateTemplate), estimateTemplatesController.updateEstimateTemplate);
router.delete('/templates/:id', auth, requireRole(['admin', 'manager']), validateRequest(templateId), estimateTemplatesController.deleteEstimateTemplate);
router.post('/from-template', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createEstimateFromTemplate), estimateTemplatesController.createEstimateFromTemplate);

// Pricing Items Routes
router.get('/pricing/items', auth, validateRequest(getPricingItems), pricingItemsController.getAllPricingItems);
router.get('/pricing/items/:id', auth, validateRequest(pricingItemId), pricingItemsController.getPricingItemById);
router.post('/pricing/items', auth, requireRole(['admin', 'manager']), validateRequest(createPricingItem), pricingItemsController.createPricingItem);
router.put('/pricing/items/:id', auth, requireRole(['admin', 'manager']), validateRequest(updatePricingItem), pricingItemsController.updatePricingItem);
router.delete('/pricing/items/:id', auth, requireRole(['admin', 'manager']), validateRequest(pricingItemId), pricingItemsController.deletePricingItem);
router.put('/pricing/items/bulk-update', auth, requireRole(['admin', 'manager']), pricingItemsController.bulkUpdatePricingItems);

// Pricing Categories Routes
router.get('/pricing/categories', auth, pricingCategoriesController.getAllPricingCategories);
router.get('/pricing/categories/:id', auth, validateRequest(categoryId), pricingCategoriesController.getPricingCategoryById);
router.post('/pricing/categories', auth, requireRole(['admin', 'manager']), validateRequest(createPricingCategory), pricingCategoriesController.createPricingCategory);
router.put('/pricing/categories/:id', auth, requireRole(['admin', 'manager']), validateRequest(updatePricingCategory), pricingCategoriesController.updatePricingCategory);
router.delete('/pricing/categories/:id', auth, requireRole(['admin', 'manager']), validateRequest(categoryId), pricingCategoriesController.deletePricingCategory);
router.put('/pricing/categories/reorder', auth, requireRole(['admin', 'manager']), pricingCategoriesController.reorderPricingCategories);

// Estimate Reports Routes
router.get('/reports/summary', auth, requireRole(['admin', 'manager']), validateRequest(getEstimateReports), estimateReportsController.getEstimateSummaryReport);
router.get('/reports/performance', auth, requireRole(['admin', 'manager']), validateRequest(getEstimateReports), estimateReportsController.getEstimatePerformanceReport);
router.get('/reports/insights', auth, requireRole(['admin', 'manager']), estimateReportsController.getEstimateInsights);

module.exports = router;
