const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

// Import only the routes that exist
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const employeeRoutes = require('./routes/employees');
const estimateRoutes = require('./routes/estimates');
const jobRoutes = require('./routes/jobs');

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

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://junkremovalappplanner.com',
        'https://junkremovalappplanner.com/',
        'https://www.junkremovalappplanner.com',
        'https://junkremovalappplanner.com/app',
        'https://junkremovalappplanner.com/app/',
        'https://junkremovalapi.onrender.com'
      ]
    : process.env.ALLOW_ALL_ORIGINS === 'true'
      ? true  // Allow all origins in development (use with caution)
      : [
          'http://localhost:3000',
          'http://localhost:3001', 
          'http://localhost:5173',  // Vite default
          'http://localhost:8080',  // Vue CLI default
          'http://localhost:4200',  // Angular default
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:8080',
          'http://127.0.0.1:4200'
        ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Log CORS configuration in development
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 CORS Configuration:', {
    allowAllOrigins: process.env.ALLOW_ALL_ORIGINS === 'true',
    allowedOrigins: corsOptions.origin === true ? 'ALL' : corsOptions.origin,
    credentials: corsOptions.credentials,
    methods: corsOptions.methods
  });
}

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});


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
