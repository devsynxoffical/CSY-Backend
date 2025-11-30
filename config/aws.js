const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

// AWS Configuration
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// S3 Configuration
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4'
});

const s3BucketName = process.env.AWS_S3_BUCKET_NAME || 'csy-pro-bucket';

// S3 Helper Functions
const s3Helpers = {
  // Upload file to S3
  uploadFile: async (fileBuffer, fileName, contentType, folder = '') => {
    try {
      const key = folder ? `${folder}/${fileName}` : fileName;

      const uploadParams = {
        Bucket: s3BucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read'
      };

      const result = await s3.upload(uploadParams).promise();
      return {
        success: true,
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket
      };
    } catch (error) {
      console.error('❌ S3 upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete file from S3
  deleteFile: async (key) => {
    try {
      const deleteParams = {
        Bucket: s3BucketName,
        Key: key
      };

      await s3.deleteObject(deleteParams).promise();
      return { success: true };
    } catch (error) {
      console.error('❌ S3 delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get signed URL for private files
  getSignedUrl: (key, expiresIn = 3600) => {
    try {
      const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: s3BucketName,
        Key: key,
        Expires: expiresIn
      });
      return signedUrl;
    } catch (error) {
      console.error('❌ S3 signed URL error:', error);
      return null;
    }
  },

  // Generate presigned URL for upload
  getPresignedUrl: (key, contentType, expiresIn = 3600) => {
    try {
      const presignedUrl = s3.getSignedUrl('putObject', {
        Bucket: s3BucketName,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn,
        ACL: 'public-read'
      });
      return presignedUrl;
    } catch (error) {
      console.error('❌ S3 presigned URL error:', error);
      return null;
    }
  }
};

// Multer S3 storage configuration
const multerS3Storage = multerS3({
  s3: s3,
  bucket: s3BucketName,
  acl: 'public-read',
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const folder = req.body.folder || 'uploads';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    const filename = `${folder}/${uniqueSuffix}.${extension}`;
    cb(null, filename);
  }
});

// Multer upload configurations
const uploadSingle = multer({
  storage: multerS3Storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
}).single('file');

const uploadMultiple = multer({
  storage: multerS3Storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Max 10 files
  }
}).array('files', 10);

// SNS Configuration
const sns = new AWS.SNS();

// SNS Helper Functions
const snsHelpers = {
  // Send SMS
  sendSMS: async (phoneNumber, message) => {
    try {
      const params = {
        Message: message,
        PhoneNumber: phoneNumber,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      };

      const result = await sns.publish(params).promise();
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error) {
      console.error('❌ SNS SMS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send Push Notification
  sendPushNotification: async (endpointArn, title, body, data = {}) => {
    try {
      const params = {
        TargetArn: endpointArn,
        MessageStructure: 'json',
        Message: JSON.stringify({
          default: body,
          GCM: JSON.stringify({
            notification: {
              title: title,
              body: body,
              sound: 'default'
            },
            data: data
          }),
          APNS: JSON.stringify({
            aps: {
              alert: {
                title: title,
                body: body
              },
              sound: 'default',
              badge: 1
            },
            data: data
          })
        })
      };

      const result = await sns.publish(params).promise();
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error) {
      console.error('❌ SNS Push notification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// SES Configuration
const ses = new AWS.SES();

// SES Helper Functions
const sesHelpers = {
  // Send email
  sendEmail: async (to, subject, htmlBody, textBody = null, from = null) => {
    try {
      const params = {
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to]
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: htmlBody
            },
            ...(textBody && {
              Text: {
                Charset: 'UTF-8',
                Data: textBody
              }
            })
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject
          }
        },
        Source: from || process.env.AWS_SES_FROM_EMAIL || 'noreply@csypro.com'
      };

      const result = await ses.sendEmail(params).promise();
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error) {
      console.error('❌ SES email error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send template email
  sendTemplateEmail: async (to, templateName, templateData, from = null) => {
    try {
      const params = {
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to]
        },
        Source: from || process.env.AWS_SES_FROM_EMAIL || 'noreply@csypro.com',
        Template: templateName,
        TemplateData: JSON.stringify(templateData)
      };

      const result = await ses.sendTemplatedEmail(params).promise();
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error) {
      console.error('❌ SES template email error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = {
  AWS,
  s3,
  sns,
  ses,
  s3Helpers,
  snsHelpers,
  sesHelpers,
  uploadSingle,
  uploadMultiple,
  s3BucketName
};
