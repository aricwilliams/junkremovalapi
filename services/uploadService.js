const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');

// AWS SDK v3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'junkremoval-uploads';

class UploadService {
  // Configure multer for file uploads
  static getUploadMiddleware() {
    const fileFilter = (req, file, cb) => {
      // Comprehensive video MIME types
      const allowedVideoMimeTypes = [
        'video/webm',
        'video/webm;codecs=vp8',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/mp4', 
        'video/mp4;codecs=h264',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/ogg',
        'video/mpeg',
        'video/3gpp',
        'video/3gpp2',
        'video/avi',
        'video/mov'
      ];
      
      // Image MIME types
      const allowedImageMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];
      
      const allAllowedMimeTypes = [...allowedVideoMimeTypes, ...allowedImageMimeTypes];
      
      // File extension fallback
      const allowedExtensions = ['.webm', '.mp4', '.avi', '.mov', '.ogg', '.mpeg', '.3gp', '.wmv', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allAllowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: videos and images`), false);
      }
    };

    return multer({
      storage: multer.memoryStorage(), // Use memory storage
      fileFilter: fileFilter,
      limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit per file
      }
    });
  }

  // Configure multer for multiple file uploads
  static getMultipleUploadMiddleware() {
    const fileFilter = (req, file, cb) => {
      const allowedVideoMimeTypes = [
        'video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo',
        'video/ogg', 'video/mpeg', 'video/3gpp', 'video/avi', 'video/mov'
      ];
      
      const allowedImageMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
      ];
      
      const allAllowedMimeTypes = [...allowedVideoMimeTypes, ...allowedImageMimeTypes];
      const allowedExtensions = ['.webm', '.mp4', '.avi', '.mov', '.ogg', '.mpeg', '.3gp', '.wmv', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allAllowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`), false);
      }
    };

    return multer({
      storage: multer.memoryStorage(),
      fileFilter: fileFilter,
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB per file
        files: 10 // Max 10 files at once
      }
    });
  }

  // Upload file to S3
  static async uploadToS3(filePath, fileName, contentType, folder = 'uploads') {
    try {
      const fileContent = await fs.readFile(filePath);
      const key = `${folder}/${Date.now()}-${fileName}`;
      
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: contentType
      };

      const result = await s3Client.send(new PutObjectCommand(params));
      
      // Clean up temp file
      await fs.unlink(filePath);
      
      return {
        key: key,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
        etag: result.ETag
      };
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  }

  // Generate thumbnail from video
  static async generateThumbnail(videoPath, outputPath) {
    try {
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: ['50%'],
            filename: path.basename(outputPath),
            folder: path.dirname(outputPath),
            size: '320x240'
          })
          .on('end', () => {
            console.log('✅ Thumbnail generated successfully');
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.log('⚠️ FFmpeg thumbnail generation failed:', err.message);
            resolve(null); // Return null instead of rejecting
          });
      });
    } catch (error) {
      console.log('⚠️ FFmpeg error, skipping thumbnail:', error.message);
      return null;
    }
  }

  // Get video duration
  static async getVideoDuration(videoPath) {
    try {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err) {
            console.log('⚠️ FFmpeg not available, using default duration');
            resolve(0);
          } else {
            resolve(Math.round(metadata.format.duration));
          }
        });
      });
    } catch (error) {
      console.log('⚠️ FFmpeg error, using default duration:', error.message);
      return 0;
    }
  }

  // Process uploaded file
  static async processFileUpload(file, userId, metadata = {}) {
    try {
      console.log('📁 Processing file upload for user:', userId);
      console.log('📄 File details:', {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${uuidv4()}${fileExtension}`;
      const tempPath = path.join(__dirname, '..', 'uploads', 'temp', fileName);
      
      // Ensure temp directory exists
      await fs.mkdir(path.dirname(tempPath), { recursive: true });
      
      // Write buffer to temp file
      await fs.writeFile(tempPath, file.buffer);
      
      // Determine file type
      const isVideo = file.mimetype.startsWith('video/');
      const isImage = file.mimetype.startsWith('image/');
      
      let duration = 0;
      let thumbnailPath = null;
      let thumbnailUrl = null;
      
      // Process video files
      if (isVideo) {
        console.log('🎬 Processing video file...');
        
        // Get video duration
        duration = await this.getVideoDuration(tempPath);
        
        // Generate thumbnail
        try {
          const thumbnailFileName = `${path.parse(fileName).name}-thumb.jpg`;
          const thumbnailOutputPath = path.join(__dirname, '..', 'uploads', 'temp', thumbnailFileName);
          thumbnailPath = await this.generateThumbnail(tempPath, thumbnailOutputPath);
        } catch (thumbnailError) {
          console.log('⚠️ Thumbnail generation failed, continuing without thumbnail');
        }
      }
      
      // Upload main file to S3
      console.log('☁️ Uploading to S3...');
      const folder = isVideo ? 'videos' : 'images';
      const s3Result = await this.uploadToS3(tempPath, fileName, file.mimetype, folder);
      console.log('✅ S3 upload successful:', s3Result.url);
      
      // Upload thumbnail if generated
      if (thumbnailPath) {
        try {
          const thumbnailS3Result = await this.uploadToS3(thumbnailPath, path.basename(thumbnailPath), 'image/jpeg', 'thumbnails');
          thumbnailUrl = thumbnailS3Result.url;
          await fs.unlink(thumbnailPath);
        } catch (thumbnailUploadError) {
          console.log('⚠️ Thumbnail upload failed');
        }
      }
      
      // Create database record
      console.log('💾 Creating database record...');
      const uploadRecord = await this.createUploadRecord({
        business_id: userId,
        original_name: file.originalname,
        file_name: fileName,
        file_path: s3Result.key,
        file_url: s3Result.url,
        file_size: file.size,
        mime_type: file.mimetype,
        file_type: isVideo ? 'video' : 'image',
        duration: duration,
        thumbnail_url: thumbnailUrl,
        title: metadata.title || path.parse(file.originalname).name,
        description: metadata.description || '',
        tags: metadata.tags || [],
        is_public: metadata.is_public || false,
        metadata: metadata.metadata || {}
      });
      
      console.log('✅ File upload processing completed successfully');
      return uploadRecord;
    } catch (error) {
      console.error('❌ Error processing file upload:', error);
      throw error;
    }
  }

  // Process multiple file uploads
  static async processMultipleFileUploads(files, userId, metadata = {}) {
    try {
      console.log(`📁 Processing ${files.length} file uploads for user:`, userId);
      
      const uploadResults = [];
      
      for (const file of files) {
        try {
          const result = await this.processFileUpload(file, userId, metadata);
          uploadResults.push({
            success: true,
            file: result,
            originalName: file.originalname
          });
        } catch (error) {
          console.error(`❌ Error processing file ${file.originalname}:`, error);
          uploadResults.push({
            success: false,
            error: error.message,
            originalName: file.originalname
          });
        }
      }
      
      const successful = uploadResults.filter(r => r.success);
      const failed = uploadResults.filter(r => !r.success);
      
      console.log(`✅ Processed ${successful.length} files successfully, ${failed.length} failed`);
      
      return {
        total: files.length,
        successful: successful.length,
        failed: failed.length,
        results: uploadResults
      };
    } catch (error) {
      console.error('❌ Error processing multiple file uploads:', error);
      throw error;
    }
  }

  // Get signed URL for private files
  static async getSignedUrl(s3Key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
      });
      
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  // Delete file from S3
  static async deleteFromS3(s3Key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: s3Key
      };

      await s3Client.send(new DeleteObjectCommand(params));
      return true;
    } catch (error) {
      console.error('Error deleting from S3:', error);
      return false;
    }
  }

  // Create upload record in database
  static async createUploadRecord(data) {
    try {
      const db = require('../config/database');
      
      const query = `
        INSERT INTO uploads (
          business_id, original_name, file_name, file_path, file_url, 
          file_size, mime_type, file_type, duration, thumbnail_url,
          title, description, tags, is_public, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        data.business_id,
        data.original_name,
        data.file_name,
        data.file_path,
        data.file_url,
        data.file_size,
        data.mime_type,
        data.file_type,
        data.duration || 0,
        data.thumbnail_url,
        data.title,
        data.description,
        JSON.stringify(data.tags),
        data.is_public,
        JSON.stringify(data.metadata)
      ];
      
      const result = await db.query(query, values);
      const uploadId = result.insertId;
      
      // Get the created upload record
      const uploadRecord = await db.query(
        'SELECT * FROM uploads WHERE id = ?',
        [uploadId]
      );
      
      return uploadRecord[0];
    } catch (error) {
      console.error('Error creating upload record:', error);
      throw error;
    }
  }

  // Check if AWS S3 is configured
  static isS3Configured() {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);
  }

  // Get file type from MIME type
  static getFileType(mimeType) {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
  }

  // Validate file size
  static validateFileSize(fileSize, maxSize = 500 * 1024 * 1024) {
    return fileSize <= maxSize;
  }

  // Get file extension from filename
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  // Generate unique filename
  static generateUniqueFilename(originalName) {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const uuid = uuidv4();
    return `${timestamp}-${uuid}${extension}`;
  }
}

module.exports = UploadService;
