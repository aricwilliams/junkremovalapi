-- Create heatmap table for SEO API key management
-- This table tracks SerpApi key usage to manage 250 calls/month limit

CREATE TABLE IF NOT EXISTS heatmap (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key VARCHAR(255) NOT NULL,
  count INT NOT NULL DEFAULT 0,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_api_key (api_key),
  INDEX idx_date_created (date_created)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert your initial SerpApi key (replace 'your_serpapi_key_here' with your actual key)
-- INSERT INTO heatmap (api_key, count) VALUES ('your_serpapi_key_here', 0);

-- Add additional API keys as needed
-- INSERT INTO heatmap (api_key, count) VALUES ('your_second_serpapi_key_here', 0);
-- INSERT INTO heatmap (api_key, count) VALUES ('your_third_serpapi_key_here', 0);

-- View current records
SELECT * FROM heatmap ORDER BY date_created DESC;

-- Check usage stats for last 30 days
SELECT 
  api_key,
  count,
  date_created,
  date_updated,
  CASE 
    WHEN count >= 249 THEN 'LIMIT_REACHED'
    WHEN count >= 200 THEN 'HIGH_USAGE'
    WHEN count >= 100 THEN 'MEDIUM_USAGE'
    ELSE 'LOW_USAGE'
  END as status
FROM heatmap 
WHERE date_created >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY count DESC;
