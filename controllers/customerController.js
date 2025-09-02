

// Health check endpoint
const healthCheck = async (req, res) => {
  try {
    // Test database connection
    const result = await query('SELECT 1 as test');
    
    res.status(200).json({
      success: true,
      message: 'Customers API is healthy',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '1.0.0'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Customers API health check failed',
      error: 'HEALTH_CHECK_FAILED',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  healthCheck
};
