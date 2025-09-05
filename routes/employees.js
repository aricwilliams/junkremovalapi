const express = require('express');
const router = express.Router();
const { 
  getEmployees, 
  getEmployee, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} = require('../controllers/employeeController');
const { auth } = require('../middleware/auth');
const { validateEmployee } = require('../middleware/employeeValidation');

// All routes require authentication
router.use(auth);

// Employee routes
router.get('/', getEmployees);
router.get('/:id', getEmployee);
router.post('/', validateEmployee, createEmployee);
router.put('/:id', validateEmployee, updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
