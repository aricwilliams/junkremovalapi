const mysql = require('mysql2/promise');
require('dotenv').config();

const createUploadsTable = async () => {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'switchyard.proxy.rlwy.net',
      port: Number(process.env.DB_PORT) || 20553,
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'mmmGPUfMVK...',
      database: process.env.DB_DATABASE || 'junkremoval',
      ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      }
    });

    console.log('✅ Connected to database successfully');

    // Create uploads table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS uploads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_type ENUM('video', 'image', 'audio', 'other') NOT NULL,
        duration INT DEFAULT 0 COMMENT 'Duration in seconds for videos',
        thumbnail_url VARCHAR(500) NULL COMMENT 'Thumbnail URL for videos',
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        tags JSON NULL COMMENT 'Array of tags',
        is_public BOOLEAN DEFAULT FALSE,
        metadata JSON NULL COMMENT 'Additional metadata',
        view_count INT DEFAULT 0,
        download_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_file_type (file_type),
        INDEX idx_is_public (is_public),
        INDEX idx_created_at (created_at),
        INDEX idx_title (title),
        INDEX idx_user_file_type (user_id, file_type),
        INDEX idx_user_public (user_id, is_public),
        
        FOREIGN KEY (user_id) REFERENCES businesses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('📋 Creating uploads table...');
    await connection.execute(createTableQuery);
    console.log('✅ Uploads table created successfully');

    // Create upload_views table for tracking views
    const createViewsTableQuery = `
      CREATE TABLE IF NOT EXISTS upload_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        upload_id INT NOT NULL,
        viewer_id VARCHAR(100) NULL COMMENT 'Anonymous viewer ID or user ID',
        viewer_ip VARCHAR(45) NULL,
        user_agent TEXT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_upload_id (upload_id),
        INDEX idx_viewer_id (viewer_id),
        INDEX idx_viewed_at (viewed_at),
        
        FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('📋 Creating upload_views table...');
    await connection.execute(createViewsTableQuery);
    console.log('✅ Upload_views table created successfully');

    // Create upload_downloads table for tracking downloads
    const createDownloadsTableQuery = `
      CREATE TABLE IF NOT EXISTS upload_downloads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        upload_id INT NOT NULL,
        downloader_id VARCHAR(100) NULL COMMENT 'Anonymous downloader ID or user ID',
        downloader_ip VARCHAR(45) NULL,
        user_agent TEXT NULL,
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_upload_id (upload_id),
        INDEX idx_downloader_id (downloader_id),
        INDEX idx_downloaded_at (downloaded_at),
        
        FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('📋 Creating upload_downloads table...');
    await connection.execute(createDownloadsTableQuery);
    console.log('✅ Upload_downloads table created successfully');

    console.log('🎉 All upload tables created successfully!');
    
    // Show table structure
    console.log('\n📊 Uploads table structure:');
    const [columns] = await connection.execute('DESCRIBE uploads');
    console.table(columns);

  } catch (error) {
    console.error('❌ Error creating upload tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the migration
if (require.main === module) {
  createUploadsTable()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createUploadsTable;
