const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

// ✨ origins should be only scheme + host (+ optional port), no paths
const allowlist = [
  'https://junkremovalappplanner.com',
  'https://www.junkremovalappplanner.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

// Import only the routes that exist
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const employeeRoutes = require('./routes/employees');
const estimateRoutes = require('./routes/estimates');
const jobRoutes = require('./routes/jobs');
const twilioRoutes = require('./routes/twilio');
const callForwardingRoutes = require('./routes/callForwarding');
const smsRoutes = require('./routes/sms');
const smsWebhookRoutes = require('./routes/smsWebhooks');

const app = express();
const PORT = process.env.PORT || 3000;

// Log environment configuration
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Environment Configuration:', {
    appName: process.env.APP_NAME || 'Node Lead API',
    appEnv: process.env.APP_ENV || 'development',
    appDebug: process.env.APP_DEBUG || 'false',
    appUrl: process.env.APP_URL || 'http://localhost',
    port: PORT,
    dbHost: process.env.DB_HOST || 'switchyard.proxy.rlwy.net',
    dbPort: process.env.DB_PORT || 20553,
    dbDatabase: process.env.DB_DATABASE || 'junkremoval'
  });
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 CORS check - Origin:', origin, 'Type:', typeof origin);
    
    // Always allow requests with no origin (API tools, direct calls, etc.)
    if (!origin || origin === 'null' || origin === null) {
      console.log('🔓 Allowing request with no origin (API tool/direct call)');
      return callback(null, true);
    }

    // In development, allow all origins for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 Development mode - allowing all origins');
      return callback(null, true);
    }

    // Check allowlist for production
    if (allowlist.includes(origin)) {
      console.log('✅ Allowing request from:', origin);
      return callback(null, true);
    }
    
    console.log('❌ Blocking request from:', origin);
    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  optionsSuccessStatus: 204
};

// 👉 CORS FIRST
app.use(cors(corsOptions));
// allow Express to answer preflight automatically for all routes
app.options('*', cors(corsOptions));

// Additional CORS middleware for API endpoints (more permissive)
app.use('/api', (req, res, next) => {
  // Set CORS headers for API endpoints
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

// THEN security headers
app.use(helmet({
  crossOriginResourcePolicy: false, // don't block cross-origin fetches for APIs
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    appName: process.env.APP_NAME || 'Node Lead API',
    environment: process.env.APP_ENV || 'development',
    debug: process.env.APP_DEBUG === 'true',
    database: {
      host: process.env.DB_HOST || 'switchyard.proxy.rlwy.net',
      port: process.env.DB_PORT || 20553,
      database: process.env.DB_DATABASE || 'junkremoval'
    }
  });
});

// API routes - only include what exists
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/estimates', estimateRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/call-forwarding', callForwardingRoutes);
app.use('/api/sms', smsRoutes);
app.use('/webhooks/twilio', smsWebhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: process.env.APP_NAME || 'Node Lead API v1.0',
    environment: process.env.APP_ENV || 'development',
    documentation: '/api/v1/docs',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 ${process.env.APP_NAME || 'Node Lead API'} running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.APP_ENV || 'development'}`);
      console.log(`🔧 Debug Mode: ${process.env.APP_DEBUG === 'true' ? 'ON' : 'OFF'}`);
      console.log(`📖 API Documentation: ${process.env.APP_URL || 'http://localhost'}:${PORT}/api/v1/docs`);
      console.log(`🔍 Health Check: ${process.env.APP_URL || 'http://localhost'}:${PORT}/health`);
      console.log(`🔐 Authentication: ${process.env.APP_URL || 'http://localhost'}:${PORT}/api/v1/auth`);
      console.log(`👥 Customers: ${process.env.APP_URL || 'http://localhost'}:${PORT}/api/v1/customers`);
      console.log(`👷 Employees: ${process.env.APP_URL || 'http://localhost'}:${PORT}/api/v1/employees`);
      console.log(`💰 Estimates: ${process.env.APP_URL || 'http://localhost'}:${PORT}/api/v1/estimates`);
      console.log(`💼 Jobs: ${process.env.APP_URL || 'http://localhost'}:${PORT}/api/v1/jobs`);
      console.log(`📞 Twilio: ${process.env.APP_URL || 'http://localhost'}:${PORT}/api/twilio`);
      console.log(`📱 Call Forwarding: ${process.env.APP_URL || 'http://localhost'}:${PORT}/api/call-forwarding`);
      console.log(`💬 SMS: ${process.env.APP_URL || 'http://localhost'}:${PORT}/api/sms`);
      console.log(`📨 SMS Webhooks: ${process.env.APP_URL || 'http://localhost'}:${PORT}/webhooks/twilio`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
