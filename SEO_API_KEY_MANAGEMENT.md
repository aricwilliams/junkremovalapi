# SEO API Key Management System

## Overview
This system manages SerpApi keys with automatic rotation based on usage limits. Each key is limited to 250 calls per month, so the system tracks usage and automatically switches to the next available key when the limit is reached.

## Database Table: `heatmap`

### Table Structure
```sql
CREATE TABLE heatmap (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key VARCHAR(255) NOT NULL,
  count INT NOT NULL DEFAULT 0,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_api_key (api_key),
  INDEX idx_date_created (date_created)
);
```

### Fields
- **id**: Auto-incrementing primary key
- **api_key**: The SerpApi key string
- **count**: Number of API calls made with this key (incremented after each call)
- **date_created**: When the key was first used
- **date_updated**: Last time the count was updated

## Setup Instructions

### 1. Create the Database Table
```bash
# Option 1: Run the migration script
npm run migrate:heatmap

# Option 2: Run SQL manually
mysql -u your_username -p your_database < sql/create-heatmap-table.sql
```

### 2. Add Your API Keys
```bash
# Add your first API key
curl -X POST http://localhost:3000/api/seo/add-key \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your_serpapi_key_here"}'

# Add additional keys
curl -X POST http://localhost:3000/api/seo/add-key \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your_second_serpapi_key_here"}'
```

### 3. Verify Setup
```bash
# Check usage stats
curl http://localhost:3000/api/seo/usage-stats
```

## How It Works

### Automatic Key Rotation
1. **Before each SEO analysis**: System checks for available keys
2. **Key selection**: Chooses the key with the lowest usage count in the last 30 days
3. **Usage tracking**: After each SerpApi call, increments the count for that key
4. **Limit enforcement**: Once a key reaches 249 calls, it's no longer used until next month

### Key Selection Logic
```javascript
// Gets keys that haven't exceeded 249 calls in last 30 days
SELECT api_key, count 
FROM heatmap 
WHERE date_created >= DATE_SUB(NOW(), INTERVAL 30 DAY)
AND count < 249
ORDER BY count ASC, id ASC
LIMIT 1
```

## API Endpoints

### 1. Add API Key
**POST** `/api/seo/add-key`
```json
{
  "api_key": "your_serpapi_key_here"
}
```

### 2. Get Usage Statistics
**GET** `/api/seo/usage-stats`
```json
{
  "success": true,
  "stats": [
    {
      "api_key": "key1...",
      "count": 45,
      "date_created": "2025-01-19T15:30:00.000Z",
      "date_updated": "2025-01-19T16:45:00.000Z",
      "status": "LOW_USAGE"
    }
  ]
}
```

### 3. SEO Analysis (with automatic key rotation)
**POST** `/api/seo/analyze`
```json
{
  "business_address": "618 South 7th Street, Wilmington, NC 28401",
  "keyword": "junk removal",
  "target_business_name": "Hancock Hauling",
  "grid_size": "0.7x0.7"
}
```

## Usage Status Levels
- **LOW_USAGE**: 0-99 calls
- **MEDIUM_USAGE**: 100-199 calls
- **HIGH_USAGE**: 200-248 calls
- **LIMIT_REACHED**: 249+ calls

## Error Handling

### No Keys Available
```json
{
  "success": false,
  "error": "No available SerpApi keys. All keys have reached their monthly limit (249 calls)."
}
```

### Database Connection Issues
- Falls back to environment variable `SERPAPI_KEY`
- Logs errors for debugging

## Monitoring and Maintenance

### Check Usage Stats
```bash
curl http://localhost:3000/api/seo/usage-stats
```

### Clean Up Old Records
```javascript
// The service automatically cleans up records older than 30 days
await seoApiKeyService.cleanupOldRecords();
```

### Manual Database Queries
```sql
-- View all keys and their usage
SELECT * FROM heatmap ORDER BY count DESC;

-- Check keys approaching limit
SELECT * FROM heatmap WHERE count >= 200;

-- Reset a key's count (if needed)
UPDATE heatmap SET count = 0 WHERE api_key = 'your_key_here';
```

## Testing

### Run API Key Tests
```bash
node test-seo-api-keys.js
```

### Test Full SEO Analysis
```bash
node test-seo-api.js
```

## Best Practices

### 1. Multiple API Keys
- Add at least 2-3 API keys for redundancy
- Monitor usage regularly to avoid hitting limits

### 2. Key Management
- Store keys securely (not in code)
- Rotate keys periodically for security
- Monitor usage patterns

### 3. Error Handling
- Always handle "no keys available" errors gracefully
- Implement fallback mechanisms
- Log API usage for monitoring

## Environment Variables
```env
# Database connection (required)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=your_database

# Fallback API key (optional)
SERPAPI_KEY=your_fallback_key
```

## Troubleshooting

### Common Issues

1. **"No available SerpApi keys"**
   - Add more API keys to the rotation
   - Check if keys have reached monthly limit
   - Verify database connection

2. **Database connection errors**
   - Check database credentials
   - Ensure MySQL server is running
   - Verify database exists

3. **API key not being used**
   - Check if key was added correctly
   - Verify key hasn't reached limit
   - Check database records

### Debug Commands
```bash
# Check server health
curl http://localhost:3000/health

# Check database health
curl http://localhost:3000/db/health

# View usage stats
curl http://localhost:3000/api/seo/usage-stats

# Test API key addition
curl -X POST http://localhost:3000/api/seo/add-key \
  -H "Content-Type: application/json" \
  -d '{"api_key": "test_key"}'
```

This system ensures you never exceed your SerpApi monthly limits while providing automatic failover and usage tracking.
