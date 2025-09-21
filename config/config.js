// Helper function to get the correct URL based on environment
const getServerUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.SERVER_URL || 'https://junkremovalapi.onrender.com';
  }
  return process.env.DEV_URL || 'http://localhost:3000';
};

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: getServerUrl(),
    devUrl: process.env.DEV_URL || 'http://localhost:3000',
    serverUrl: process.env.SERVER_URL || 'https://junkremovalapi.onrender.com'
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3000,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD,
    name: process.env.DB_DATABASE,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // File upload configuration
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif').split(',')
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Job statuses
  jobStatuses: {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Job priorities
  jobPriorities: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  // Time slot configuration
  timeSlots: [
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM'
  ],

  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100
  },

  // File size limits
  fileLimits: {
    photo: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    maxFilesPerJob: 20
  },

  // Notification types
  notificationTypes: {
    STATUS_UPDATE: 'status_update',
    CREW_ASSIGNMENT: 'crew_assignment',
    PHOTO_UPLOAD: 'photo_upload',
    TIME_LOG_UPDATE: 'time_log_update',
    CUSTOM: 'custom'
  },

  // Delivery methods
  deliveryMethods: {
    SMS: 'sms',
    EMAIL: 'email',
    PUSH: 'push'
  },

  // Twilio configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    apiKey: process.env.TWILIO_API_KEY,
    apiSecret: process.env.TWILIO_API_SECRET,
    appSid: process.env.TWILIO_APP_SID,
    twimlAppSid: process.env.TWILIO_TWIML_APP_SID,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    serverUrl: getServerUrl()
  },

  // SEO Rankings configuration
  seo: {
    opencageApiKey: process.env.OPENCAGE_API_KEY,
    // serpapiKey is now managed through the database via seoApiKeyService
    rateLimitDelay: parseInt(process.env.SEO_RATE_LIMIT_DELAY) || 250, // milliseconds between API calls
    maxGridSize: process.env.SEO_MAX_GRID_SIZE || '21x21',
    timeout: parseInt(process.env.SEO_API_TIMEOUT) || 30000 // 30 seconds
  }
};
