const nodemailer = require('nodemailer');
const { sesHelpers } = require('../config');
const { logger } = require('../utils');

/**
 * Email Service for sending emails via SES or SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.useSES = process.env.USE_SES === 'true';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@csypro.com';
    this.templates = this.loadTemplates();
  }

  /**
   * Initialize email service
   */
  async initialize() {
    if (this.useSES) {
      // Using AWS SES
      logger.info('Email service initialized with AWS SES');
    } else {
      // Using SMTP
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      try {
        await this.transporter.verify();
        logger.info('Email service initialized with SMTP');
      } catch (error) {
        logger.error('SMTP connection failed', { error: error.message });
        throw error;
      }
    }
  }

  /**
   * Load email templates
   */
  loadTemplates() {
    return {
      welcome: {
        subject: 'Welcome to CSY Pro! 🎉',
        html: this.getWelcomeTemplate(),
        text: 'Welcome to CSY Pro! Your account has been created successfully.'
      },
      email_verification: {
        subject: 'Verify Your Email - CSY Pro',
        html: this.getEmailVerificationTemplate(),
        text: 'Please verify your email address to complete your registration.'
      },
      password_reset: {
        subject: 'Reset Your Password - CSY Pro',
        html: this.getPasswordResetTemplate(),
        text: 'Click the link below to reset your password.'
      },
      order_confirmation: {
        subject: 'Order Confirmation - CSY Pro',
        html: this.getOrderConfirmationTemplate(),
        text: 'Your order has been confirmed.'
      },
      order_status: {
        subject: 'Order Status Update - CSY Pro',
        html: this.getOrderStatusTemplate(),
        text: 'Your order status has been updated.'
      },
      reservation_confirmation: {
        subject: 'Reservation Confirmed - CSY Pro',
        html: this.getReservationConfirmationTemplate(),
        text: 'Your reservation has been confirmed.'
      },
      payment_receipt: {
        subject: 'Payment Receipt - CSY Pro',
        html: this.getPaymentReceiptTemplate(),
        text: 'Thank you for your payment.'
      }
    };
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, htmlContent, textContent = null, options = {}) {
    try {
      const emailData = {
        to,
        subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent),
        from: options.from || this.fromEmail,
        ...options
      };

      let result;
      if (this.useSES) {
        result = await sesHelpers.sendEmail(
          emailData.to,
          emailData.subject,
          emailData.html,
          emailData.text,
          emailData.from
        );
      } else {
        result = await this.transporter.sendMail(emailData);
      }

      logger.info('Email sent successfully', {
        to: emailData.to,
        subject: emailData.subject,
        provider: this.useSES ? 'SES' : 'SMTP'
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: this.useSES ? 'SES' : 'SMTP'
      };
    } catch (error) {
      logger.error('Email sending failed', {
        to,
        subject,
        error: error.message,
        provider: this.useSES ? 'SES' : 'SMTP'
      });

      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Send templated email
   */
  async sendTemplateEmail(to, templateName, templateData, options = {}) {
    try {
      const template = this.templates[templateName];
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      // Replace placeholders in template
      let subject = template.subject;
      let htmlContent = template.html;
      let textContent = template.text;

      // Replace template variables
      Object.keys(templateData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, templateData[key]);
        htmlContent = htmlContent.replace(regex, templateData[key]);
        textContent = textContent.replace(regex, templateData[key]);
      });

      return await this.sendEmail(to, subject, htmlContent, textContent, options);
    } catch (error) {
      logger.error('Template email sending failed', {
        to,
        template: templateName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    return await this.sendTemplateEmail(user.email, 'welcome', {
      name: user.full_name,
      passId: user.pass_id
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    return await this.sendTemplateEmail(user.email, 'email_verification', {
      name: user.full_name,
      verificationUrl
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return await this.sendTemplateEmail(user.email, 'password_reset', {
      name: user.full_name,
      resetUrl
    });
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(user, order) {
    return await this.sendTemplateEmail(user.email, 'order_confirmation', {
      name: user.full_name,
      orderNumber: order.order_number,
      orderTotal: (order.final_amount / 100).toFixed(2) // Convert from piastres to EGP
    });
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(user, order) {
    return await this.sendTemplateEmail(user.email, 'order_status', {
      name: user.full_name,
      orderNumber: order.order_number,
      status: order.status,
      estimatedTime: order.estimated_delivery_time ?
        new Date(order.estimated_delivery_time).toLocaleString() : 'N/A'
    });
  }

  /**
   * Send reservation confirmation
   */
  async sendReservationConfirmation(user, reservation) {
    return await this.sendTemplateEmail(user.email, 'reservation_confirmation', {
      name: user.full_name,
      date: new Date(reservation.date).toLocaleDateString(),
      time: reservation.time,
      businessName: reservation.business_name || 'Business'
    });
  }

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(user, payment) {
    return await this.sendTemplateEmail(user.email, 'payment_receipt', {
      name: user.full_name,
      amount: (payment.amount / 100).toFixed(2),
      reference: payment.reference_id || 'N/A'
    });
  }

  /**
   * Strip HTML tags for text version
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Email Templates
  getWelcomeTemplate() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to CSY Pro! 🎉</h1>
        <p>Hi {{name}},</p>
        <p>Welcome to CSY Pro! Your account has been successfully created.</p>
        <p><strong>Your Pass ID:</strong> {{passId}}</p>
        <p>You can now start ordering food, making reservations, and enjoying all our services.</p>
        <p>Best regards,<br>The CSY Pro Team</p>
      </div>
    `;
  }

  getEmailVerificationTemplate() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Verify Your Email</h1>
        <p>Hi {{name}},</p>
        <p>Please verify your email address to complete your registration.</p>
        <a href="{{verificationUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:<br>{{verificationUrl}}</p>
        <p>This link will expire in 48 hours.</p>
        <p>Best regards,<br>The CSY Pro Team</p>
      </div>
    `;
  }

  getPasswordResetTemplate() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Password</h1>
        <p>Hi {{name}},</p>
        <p>You requested a password reset. Click the link below to reset your password.</p>
        <a href="{{resetUrl}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:<br>{{resetUrl}}</p>
        <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The CSY Pro Team</p>
      </div>
    `;
  }

  getOrderConfirmationTemplate() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmed! ✅</h1>
        <p>Hi {{name}},</p>
        <p>Your order has been confirmed and is being prepared.</p>
        <p><strong>Order Number:</strong> {{orderNumber}}</p>
        <p><strong>Total Amount:</strong> EGP {{orderTotal}}</p>
        <p>You will receive updates on your order status. Track your order in the app.</p>
        <p>Best regards,<br>The CSY Pro Team</p>
      </div>
    `;
  }

  getOrderStatusTemplate() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Status Update</h1>
        <p>Hi {{name}},</p>
        <p>Your order status has been updated.</p>
        <p><strong>Order Number:</strong> {{orderNumber}}</p>
        <p><strong>Status:</strong> {{status}}</p>
        <p><strong>Estimated Time:</strong> {{estimatedTime}}</p>
        <p>Track your order in the app for real-time updates.</p>
        <p>Best regards,<br>The CSY Pro Team</p>
      </div>
    `;
  }

  getReservationConfirmationTemplate() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reservation Confirmed! 📅</h1>
        <p>Hi {{name}},</p>
        <p>Your reservation has been confirmed.</p>
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Time:</strong> {{time}}</p>
        <p><strong>Business:</strong> {{businessName}}</p>
        <p>Please arrive 10 minutes before your reservation time. Don't forget to bring your QR code!</p>
        <p>Best regards,<br>The CSY Pro Team</p>
      </div>
    `;
  }

  getPaymentReceiptTemplate() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Payment Receipt 💳</h1>
        <p>Hi {{name}},</p>
        <p>Thank you for your payment!</p>
        <p><strong>Amount:</strong> EGP {{amount}}</p>
        <p><strong>Reference:</strong> {{reference}}</p>
        <p>Your payment has been processed successfully.</p>
        <p>Best regards,<br>The CSY Pro Team</p>
      </div>
    `;
  }
}

module.exports = new EmailService();
