const mysql = require('mysql2/promise');
require('dotenv').config();

const updateUploadsTableBusinessId = async () => {
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

    // Check if uploads table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'uploads'"
    );

    if (tables.length === 0) {
      console.log('📋 Creating uploads table with business_id...');
      
      // Create uploads table with business_id
      const createTableQuery = `
        CREATE TABLE uploads (
          id INT AUTO_INCREMENT PRIMARY KEY,
          business_id INT NOT NULL,
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
          
          INDEX idx_business_id (business_id),
          INDEX idx_file_type (file_type),
          INDEX idx_is_public (is_public),
          INDEX idx_created_at (created_at),
          INDEX idx_title (title),
          INDEX idx_business_file_type (business_id, file_type),
          INDEX idx_business_public (business_id, is_public),
          
          FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await connection.execute(createTableQuery);
      console.log('✅ Uploads table created successfully with business_id');
    } else {
      console.log('📋 Uploads table exists, checking for business_id column...');
      
      // Check if business_id column exists
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM uploads LIKE 'business_id'"
      );

      if (columns.length === 0) {
        console.log('🔄 Adding business_id column and updating foreign key...');
        
        // Add business_id column
        await connection.execute(
          'ALTER TABLE uploads ADD COLUMN business_id INT NOT NULL AFTER id'
        );
        
        // Add foreign key constraint
        await connection.execute(
          'ALTER TABLE uploads ADD CONSTRAINT fk_uploads_business_id FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE'
        );
        
        // Add indexes
        await connection.execute(
          'ALTER TABLE uploads ADD INDEX idx_business_id (business_id)'
        );
        await connection.execute(
          'ALTER TABLE uploads ADD INDEX idx_business_file_type (business_id, file_type)'
        );
        await connection.execute(
          'ALTER TABLE uploads ADD INDEX idx_business_public (business_id, is_public)'
        );
        
        console.log('✅ business_id column and constraints added successfully');
      } else {
        console.log('✅ business_id column already exists');
      }
    }

    // Check if upload_views table exists
    const [viewsTables] = await connection.execute(
      "SHOW TABLES LIKE 'upload_views'"
    );

    if (viewsTables.length === 0) {
      console.log('📋 Creating upload_views table...');
      
      const createViewsTableQuery = `
        CREATE TABLE upload_views (
          id INT AUTO_INCREMENT PRIMARY KEY,
          upload_id INT NOT NULL,
          viewer_id VARCHAR(100) NULL COMMENT 'Anonymous viewer ID or business ID',
          viewer_ip VARCHAR(45) NULL,
          user_agent TEXT NULL,
          viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_upload_id (upload_id),
          INDEX idx_viewer_id (viewer_id),
          INDEX idx_viewed_at (viewed_at),
          
          FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await connection.execute(createViewsTableQuery);
      console.log('✅ Upload_views table created successfully');
    }

    // Check if upload_downloads table exists
    const [downloadsTables] = await connection.execute(
      "SHOW TABLES LIKE 'upload_downloads'"
    );

    if (downloadsTables.length === 0) {
      console.log('📋 Creating upload_downloads table...');
      
      const createDownloadsTableQuery = `
        CREATE TABLE upload_downloads (
          id INT AUTO_INCREMENT PRIMARY KEY,
          upload_id INT NOT NULL,
          downloader_id VARCHAR(100) NULL COMMENT 'Anonymous downloader ID or business ID',
          downloader_ip VARCHAR(45) NULL,
          user_agent TEXT NULL,
          downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_upload_id (upload_id),
          INDEX idx_downloader_id (downloader_id),
          INDEX idx_downloaded_at (downloaded_at),
          
          FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await connection.execute(createDownloadsTableQuery);
      console.log('✅ Upload_downloads table created successfully');
    }

    console.log('🎉 All upload tables updated successfully!');
    
    // Show table structure
    console.log('\n📊 Uploads table structure:');
    const [columns] = await connection.execute('DESCRIBE uploads');
    console.table(columns);

  } catch (error) {
    console.error('❌ Error updating upload tables:', error);
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
  updateUploadsTableBusinessId()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = updateUploadsTableBusinessId;
