const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../models');
const CacheService = require('../services/cache.service');
const { generateToken, generatePasswordResetToken, generateEmailVerificationToken, generateOTP } = require('../utils');
const { emailService, smsService, notificationService } = require('../services');
const { logger } = require('../utils');
const { SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_RULES } = require('../config/constants');

/**
 * Auth Controller - Handles user authentication and authorization
 */
class AuthController {
  /**
   * Register a new user
   */
  async register(req, res) {
    try {
      const { full_name, email, phone, password, governorate_code, ai_assistant_name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { phone }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
          error: existingUser.email === email.toLowerCase() ? 'Email already registered' : 'Phone number already registered'
        });
      }

      // Generate unique Pass ID
      const { generatePassID, generateUniquePassID } = require('../utils');

      // Create a check function to verify Pass ID uniqueness
      const checkPassIDExists = async (passId) => {
        const existingUser = await prisma.user.findUnique({ where: { pass_id: passId } });
        return !!existingUser; // Return true if exists, false if available
      };

      const passId = await generateUniquePassID(governorate_code, checkPassIDExists);

      if (!passId) {
        return res.status(500).json({
          success: false,
          message: 'Unable to generate Pass ID',
          error: 'Please try again later'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user with wallet
      const user = await prisma.user.create({
        data: {
          full_name,
          email: email.toLowerCase(),
          phone,
          password_hash: hashedPassword,
          pass_id: passId,
          governorate_code,
          ai_assistant_name: ai_assistant_name || null,
          is_active: true,
          is_verified: false,
          wallet: {
            create: {
              balance: 0
            }
          }
        },
        include: {
          wallet: true
        }
      });

      // Generate email verification token
      const verificationToken = generateEmailVerificationToken(user.id, user.email);

      // Send welcome email and verification
      try {
        await emailService.sendWelcomeEmail(user);
        await emailService.sendEmailVerification(user, verificationToken.token);
      } catch (emailError) {
        logger.error('Failed to send welcome/verification emails', {
          userId: user.id,
          error: emailError.message
        });
        // Don't fail registration if emails fail
      }

      // Generate JWT token with role
      const token = generateToken(user.id, 'user');

      // Cache user session
      await CacheService.setUserSession(user.id, {
        id: user.id,
        email: user.email,
        pass_id: user.pass_id
      });

      // Remove password from response
      const userResponse = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        pass_id: user.pass_id,
        governorate_code: user.governorate_code,
        wallet_balance: user.wallet_balance,
        points: user.points,
        is_verified: user.is_verified,
        created_at: user.created_at
      };

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      res.status(201).json({
        success: true,
        message: SUCCESS_MESSAGES.PROFILE_UPDATED,
        data: {
          user: userResponse,
          token,
          requiresVerification: true
        }
      });
    } catch (error) {
      logger.error('User registration failed', {
        email: req.body.email,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
          error: 'Please contact support to reactivate your account'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }

      // Generate JWT token with role
      const token = generateToken(user.id, 'user');

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { updated_at: new Date() }
      });

      // Cache user session
      await CacheService.setUserSession(user.id, {
        id: user.id,
        email: user.email,
        pass_id: user.pass_id
      });

      // User response (without password)
      const userResponse = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        pass_id: user.pass_id,
        governorate_code: user.governorate_code,
        wallet_balance: user.wallet_balance,
        points: user.points,
        is_verified: user.is_verified,
        profile_picture: user.profile_picture,
        ai_assistant_name: user.ai_assistant_name
      };

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      logger.error('User login failed', {
        email: req.body.email,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required',
          error: 'Missing verification token'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

      if (!decoded.userId || !decoded.email) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification token',
          error: 'Token is malformed'
        });
      }

      // Find and update user
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          email: decoded.email
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'Email already verified',
          error: 'Email verification already completed'
        });
      }

      // Mark as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          is_verified: true,
          updated_at: new Date()
        }
      });

      // Award verification points
      const { pointsService } = require('../services');
      try {
        await pointsService.awardPoints(
          user.id,
          50,
          'email_verification',
          user.id,
          'Email verification bonus'
        );
      } catch (pointsError) {
        logger.error('Failed to award verification points', {
          userId: user.id,
          error: pointsError.message
        });
      }

      // Invalidate user cache
      await CacheService.invalidateUserCache(user.id);

      logger.info('Email verified successfully', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          userId: user.id,
          email: user.email,
          verified: true
        }
      });
    } catch (error) {
      logger.error('Email verification failed', { error: error.message });

      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification token',
          error: 'Token is invalid or expired'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: 'Verification token expired',
          error: 'Please request a new verification email'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Email verification failed',
        error: error.message
      });
    }
  }

  /**
   * Resend email verification
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: {
          email: email.toLowerCase()
        }
      });

      if (!user || !user.is_active) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'Email already verified',
          error: 'Email verification already completed'
        });
      }

      // Generate new verification token
      const verificationToken = generateEmailVerificationToken(user.id, user.email);

      // Send verification email
      await emailService.sendEmailVerification(user, verificationToken.token);

      logger.info('Verification email resent', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Verification email sent',
        data: {
          email: user.email,
          sentAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Resend verification failed', {
        email: req.body.email,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to resend verification email',
        error: error.message
      });
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: {
          email: email.toLowerCase()
        }
      });

      if (!user || !user.is_active) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.',
          data: {
            email,
            sentAt: new Date()
          }
        });
      }

      // Generate password reset token
      const resetToken = generatePasswordResetToken(user.id);

      // Send password reset email
      await emailService.sendPasswordReset(user, resetToken.token);

      logger.info('Password reset requested', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
        data: {
          email,
          sentAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Password reset request failed', {
        email: req.body.email,
        error: error.message
      });

      // Don't reveal internal errors for security
      res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
        data: {
          email: req.body.email,
          sentAt: new Date()
        }
      });
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required',
          error: 'Missing required fields'
        });
      }

      // Validate password strength
      if (newPassword.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        return res.status(400).json({
          success: false,
          message: 'Password too weak',
          error: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

      if (!decoded.userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token',
          error: 'Token is malformed'
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password_hash: hashedPassword,
          updated_at: new Date()
        }
      });

      logger.info('Password reset successfully', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
        data: {
          userId: user.id,
          email: user.email,
          resetAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Password reset failed', { error: error.message });

      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token',
          error: 'Token is invalid or expired'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: 'Reset token expired',
          error: 'Please request a new password reset'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Password reset failed',
        error: error.message
      });
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(req, res) {
    try {
      const { phone } = req.body;

      // Generate OTP
      const otp = generateOTP(6, true); // 6-digit numeric OTP

      // Store OTP temporarily (in production, use Redis or database with expiration)
      // For demo, we'll just log it
      logger.info('OTP generated', { phone, otp });

      // Send OTP via SMS
      await smsService.sendOTP(phone, otp);

      res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          phone,
          sentAt: new Date(),
          expiresIn: 600 // 10 minutes
        }
      });
    } catch (error) {
      logger.error('OTP sending failed', {
        phone: req.body.phone,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: error.message
      });
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(req, res) {
    try {
      const { phone, otp } = req.body;

      // Validate OTP format
      if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP format',
          error: 'OTP must be 6 digits'
        });
      }

      // Find user by phone
      const user = await prisma.user.findUnique({
        where: { phone }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Fixed OTP code for testing/development
      const FIXED_OTP = '123456';
      
      // Check if OTP is the fixed code or verify against stored OTP
      let isValidOTP = false;
      
      if (otp === FIXED_OTP) {
        // Accept fixed OTP code for testing
        isValidOTP = true;
        logger.info('Fixed OTP code used', { phone, userId: user.id });
      } else {
        // In production, verify against stored OTP from cache/database
        // For now, we'll check if OTP exists in cache (if implemented)
        // This is a placeholder for production OTP verification
        // TODO: Implement proper OTP verification against stored OTP
        // const storedOTP = await CacheService.getOTP(phone);
        // isValidOTP = storedOTP && storedOTP === otp;
        
        // For demo purposes, accept any 6-digit OTP (remove this in production)
        isValidOTP = true;
        logger.info('OTP verified (demo mode)', { phone, userId: user.id });
      }

      if (!isValidOTP) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP',
          error: 'The OTP code you entered is incorrect. Please try again or use the fixed code 123456 for testing.'
        });
      }

      // Generate token for verified user with role
      const token = generateToken(user.id, 'user');

      logger.info('OTP verified successfully', { userId: user.id, phone, usedFixedOTP: otp === FIXED_OTP });

      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          userId: user.id,
          phone,
          token,
          verifiedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('OTP verification failed', {
        phone: req.body.phone,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'OTP verification failed',
        error: error.message
      });
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  async logout(req, res) {
    try {
      const userId = req.user?.id;

      // Invalidate user session cache
      if (userId) {
        await CacheService.invalidateUserCache(userId);
      }

      logger.info('User logged out', { userId });

      res.json({
        success: true,
        message: 'Logged out successfully',
        data: {
          loggedOutAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Logout failed', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }

      // Generate new token
      const newToken = generateToken(userId);

      logger.info('Token refreshed', { userId });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          refreshedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
