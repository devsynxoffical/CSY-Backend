const multer = require('multer');
const path = require('path');
const { API_LIMITS } = require('../config/constants');

// Local storage configuration (for development)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');

    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `${basename}-${uniqueSuffix}${extension}`);
  }
});

// File filter for different types
const createFileFilter = (allowedMimes, allowedExtensions = []) => {
  return (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) ||
        (allowedExtensions.length > 0 && allowedExtensions.includes(fileExtension))) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
    }
  };
};

// Image upload configuration
const imageFilter = createFileFilter([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/jpg'
], ['.jpeg', '.jpg', '.png', '.gif', '.webp']);

const uploadImage = multer({
  storage: process.env.NODE_ENV === 'production'
    ? require('../config').multerS3Storage
    : localStorage,
  limits: {
    fileSize: API_LIMITS.MAX_FILE_UPLOAD_SIZE_MB * 1024 * 1024, // Convert MB to bytes
    files: 1
  },
  fileFilter: imageFilter
}).single('image');

// Multiple images upload
const uploadImages = multer({
  storage: process.env.NODE_ENV === 'production'
    ? require('../config').multerS3Storage
    : localStorage,
  limits: {
    fileSize: API_LIMITS.MAX_FILE_UPLOAD_SIZE_MB * 1024 * 1024,
    files: API_LIMITS.MAX_FILES_PER_UPLOAD
  },
  fileFilter: imageFilter
}).array('images', API_LIMITS.MAX_FILES_PER_UPLOAD);

// Video upload configuration
const videoFilter = createFileFilter([
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/quicktime',
  'video/x-msvideo'
], ['.mp4', '.avi', '.mov', '.qt', '.av']);

const uploadVideo = multer({
  storage: process.env.NODE_ENV === 'production'
    ? require('../config').multerS3Storage
    : localStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for videos
    files: 1
  },
  fileFilter: videoFilter
}).single('video');

// Document upload configuration
const documentFilter = createFileFilter([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
], ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx']);

const uploadDocument = multer({
  storage: process.env.NODE_ENV === 'production'
    ? require('../config').multerS3Storage
    : localStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for documents
    files: 1
  },
  fileFilter: documentFilter
}).single('document');

// Profile picture upload
const uploadProfilePicture = multer({
  storage: process.env.NODE_ENV === 'production'
    ? require('../config').multerS3Storage
    : localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  }
}).single('profile_picture');

// Business photos upload
const uploadBusinessPhotos = multer({
  storage: process.env.NODE_ENV === 'production'
    ? require('../config').multerS3Storage
    : localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10 // Max 10 photos
  },
  fileFilter: imageFilter
}).array('photos', 10);

// Business videos upload
const uploadBusinessVideos = multer({
  storage: process.env.NODE_ENV === 'production'
    ? require('../config').multerS3Storage
    : localStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per video
    files: 5 // Max 5 videos
  },
  fileFilter: videoFilter
}).array('videos', 5);

// General file upload with dynamic folder
const createDynamicUpload = (fieldName, maxFiles = 1, maxSize = 5 * 1024 * 1024) => {
  const dynamicStorage = process.env.NODE_ENV === 'production'
    ? require('../config').multerS3Storage
    : localStorage;

  return multer({
    storage: dynamicStorage,
    limits: {
      fileSize: maxSize,
      files: maxFiles
    },
    fileFilter: (req, file, cb) => {
      // Allow all file types for dynamic upload
      cb(null, true);
    }
  })[maxFiles === 1 ? 'single' : 'array'](fieldName, maxFiles);
};

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size allowed: ${API_LIMITS.MAX_FILE_UPLOAD_SIZE_MB}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = `Too many files. Maximum allowed: ${API_LIMITS.MAX_FILES_PER_UPLOAD}`;
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = 'File upload failed';
    }

    return res.status(400).json({
      success: false,
      message,
      error: error.message
    });
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'Unsupported file format'
    });
  }

  next(error);
};

// File URL generator for local files
const getFileUrl = (filename, folder = 'uploads') => {
  if (process.env.NODE_ENV === 'production') {
    // S3 URL will be returned by multer-s3
    return null;
  }

  // Local file URL
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3119}`;
  return `${baseUrl}/${folder}/${filename}`;
};

// File deletion helper
const deleteFile = async (filename, folder = 'uploads') => {
  try {
    if (process.env.NODE_ENV === 'production') {
      const { s3Helpers } = require('../config');
      await s3Helpers.deleteFile(`${folder}/${filename}`);
    } else {
      const fs = require('fs').promises;
      const filePath = path.join(__dirname, `../${folder}`, filename);
      await fs.unlink(filePath);
    }
    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
};

module.exports = {
  uploadImage,
  uploadImages,
  uploadVideo,
  uploadDocument,
  uploadProfilePicture,
  uploadBusinessPhotos,
  uploadBusinessVideos,
  createDynamicUpload,
  handleMulterError,
  getFileUrl,
  deleteFile
};
