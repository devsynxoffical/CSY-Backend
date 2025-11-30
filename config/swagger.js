const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger Configuration for CSY Pro API
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CSY Pro API',
    version: '1.0.0',
    description: 'Comprehensive API for CSY Pro - Food Delivery, Reservations & Business Management Platform',
    contact: {
      name: 'CSY Pro Support',
      email: 'support@csypro.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3119',
      description: 'Development server'
    },
    {
      url: 'https://api.csypro.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme. Enter your JWT token in the text input below.'
      }
    },
    schemas: {
      // User Schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique user identifier'
          },
          full_name: {
            type: 'string',
            description: 'User full name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          phone: {
            type: 'string',
            description: 'User phone number'
          },
          pass_id: {
            type: 'string',
            description: 'Unique Pass ID (format: XX-XXXXXX)',
            example: 'DM-123456'
          },
          governorate_code: {
            type: 'string',
            enum: ['DM', 'HS', 'HM'],
            description: 'Governorate code'
          },
          profile_picture: {
            type: 'string',
            description: 'Profile picture URL'
          },
          ai_assistant_name: {
            type: 'string',
            description: 'AI assistant name'
          },
          wallet_balance: {
            type: 'number',
            description: 'Wallet balance in piastres'
          },
          points: {
            type: 'integer',
            description: 'Loyalty points'
          },
          is_active: {
            type: 'boolean',
            description: 'Account active status'
          },
          is_verified: {
            type: 'boolean',
            description: 'Email verification status'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account update timestamp'
          }
        }
      },

      // Address Schema
      Address: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique address identifier'
          },
          recipient_name: {
            type: 'string',
            description: 'Recipient full name'
          },
          area: {
            type: 'string',
            description: 'Area/Neighborhood'
          },
          street: {
            type: 'string',
            description: 'Street address'
          },
          city: {
            type: 'string',
            description: 'City name'
          },
          floor: {
            type: 'string',
            description: 'Floor/Apartment number'
          },
          phone: {
            type: 'string',
            description: 'Contact phone number'
          },
          latitude: {
            type: 'number',
            description: 'GPS latitude'
          },
          longitude: {
            type: 'number',
            description: 'GPS longitude'
          },
          is_default: {
            type: 'boolean',
            description: 'Default address flag'
          }
        }
      },

      // Error Schema
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            description: 'Error message'
          },
          error: {
            type: 'string',
            description: 'Detailed error description'
          }
        }
      },

      // Success Response Schema
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            description: 'Success message'
          },
          data: {
            type: 'object',
            description: 'Response data'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  // Swagger UI options
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  };

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerOptions));

  // Serve Swagger JSON
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation available at /api-docs');
};

module.exports = {
  swaggerSpec,
  setupSwagger
};
