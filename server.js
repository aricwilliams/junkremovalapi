const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const config = require('./config/config');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

// ✨ Dynamic CORS allowlist based on environment
const getCorsAllowlist = () => {
  const baseAllowlist = [
    'https://junkremovalappplanner.com',
    'https://www.junkremovalappplanner.com'
  ];
  
  if (config.server.nodeEnv === 'development') {
    return [
      ...baseAllowlist,
      config.server.devUrl,
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
  }
  
  return [
    ...baseAllowlist,
    config.server.serverUrl
  ];
};

const allowlist = getCorsAllowlist();

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
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = config.server.port;

// Log environment configuration
if (config.server.nodeEnv !== 'production') {
  console.log('🔧 Environment Configuration:', {
    appName: process.env.APP_NAME || 'Node Lead API',
    appEnv: config.server.nodeEnv,
    appDebug: process.env.APP_DEBUG || 'false',
    baseUrl: config.server.baseUrl,
    devUrl: config.server.devUrl,
    serverUrl: config.server.serverUrl,
    port: PORT,
    dbHost: config.database.host,
    dbPort: config.database.port,
    dbDatabase: config.database.name,
    corsAllowlist: allowlist
  });
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // 1) No Origin header: allow (server-to-server, Twilio, curl/Postman)
    if (!origin) return callback(null, true);

    // 2) Literal 'null' (file://, sandboxed iframes)
    if (origin === 'null') {
      // set to true if you want to support file:// testing
      return callback(null, true);
    }

    // 3) Normal browsers: enforce allowlist
    const ok = allowlist.includes(origin);
    if (ok) return callback(null, true);

    // Don't throw; just deny CORS cleanly
    return callback(null, false);
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
if (config.server.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    appName: process.env.APP_NAME || 'Node Lead API',
    environment: config.server.nodeEnv,
    debug: process.env.APP_DEBUG === 'true',
    baseUrl: config.server.baseUrl,
    database: {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name
    }
  });
});

// Database health check endpoint
app.get('/db/health', async (req, res) => {
  try {
    const db = require('./config/database');
    const [rows] = await db.pool.query('SELECT 1 as ok');
    res.json({ 
      success: true,
      database: 'connected',
      ok: rows[0].ok === 1,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      success: false,
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes - only include what exists
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/estimates', estimateRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/call-forwarding', callForwardingRoutes);
app.use('/api/sms', smsRoutes);
app.use('/webhooks/twilio', smsWebhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: process.env.APP_NAME || 'Node Lead API v1.0',
    environment: config.server.nodeEnv,
    baseUrl: config.server.baseUrl,
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
      const baseUrl = config.server.baseUrl;
      console.log(`🚀 ${process.env.APP_NAME || 'Node Lead API'} running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.server.nodeEnv}`);
      console.log(`🔧 Debug Mode: ${process.env.APP_DEBUG === 'true' ? 'ON' : 'OFF'}`);
      console.log(`🌐 Base URL: ${baseUrl}`);
      console.log(`📖 API Documentation: ${baseUrl}/api/v1/docs`);
      console.log(`🔍 Health Check: ${baseUrl}/health`);
      console.log(`🔐 Authentication: ${baseUrl}/api/v1/auth`);
      console.log(`👥 Customers: ${baseUrl}/api/v1/customers`);
      console.log(`👷 Employees: ${baseUrl}/api/v1/employees`);
      console.log(`💰 Estimates: ${baseUrl}/api/v1/estimates`);
      console.log(`💼 Jobs: ${baseUrl}/api/v1/jobs`);
      console.log(`🔔 Notifications: ${baseUrl}/api/v1/notifications`);
      console.log(`📞 Twilio: ${baseUrl}/api/twilio`);
      console.log(`📱 Call Forwarding: ${baseUrl}/api/call-forwarding`);
      console.log(`💬 SMS: ${baseUrl}/api/sms`);
      console.log(`📨 SMS Webhooks: ${baseUrl}/webhooks/twilio`);
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
