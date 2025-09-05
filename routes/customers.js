const express = require('express');
const router = express.Router();
const { 
  getCustomers, 
  getCustomer, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} = require('../controllers/customerController');
const { auth } = require('../middleware/auth');
const { validateCustomer } = require('../middleware/customerValidation');

// All routes require authentication
router.use(auth);

// Customer routes
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', validateCustomer, createCustomer);
router.put('/:id', validateCustomer, updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
