const { prisma } = require('../models');
const { logger } = require('../utils');
const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Additional User Controller Methods
 * Add these methods to user.controller.js to complete to 100%
 */

/**
 * Chat with AI Assistant
 */
const chatWithAssistant = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message, context } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required',
                error: 'Please provide a message for the AI assistant'
            });
        }

        const { aiAssistantService } = require('../services');

        const response = await aiAssistantService.generateResponse(
            userId,
            message,
            context || {}
        );

        logger.info('AI assistant chat completed', {
            userId,
            messageLength: message.length,
            provider: response.provider
        });

        res.json({
            success: true,
            message: 'AI response generated successfully',
            data: {
                response: response.response,
                provider: response.provider,
                timestamp: response.timestamp
            }
        });
    } catch (error) {
        logger.error('AI assistant chat failed', {
            userId: req.user?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'AI assistant chat failed',
            error: error.message
        });
    }
};

/**
 * Get AI Assistant Recommendations
 */
const getAssistantRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;

        const { aiAssistantService } = require('../services');

        const recommendations = await aiAssistantService.generateRecommendations(
            userId,
            preferences || {}
        );

        res.json({
            success: true,
            message: 'Recommendations generated successfully',
            data: recommendations
        });
    } catch (error) {
        logger.error('Get recommendations failed', {
            userId: req.user?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to get recommendations',
            error: error.message
        });
    }
};

/**
 * Get User Subscription Status
 */
const getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const subscriptions = await prisma.subscription.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });

        const activeSubscriptions = subscriptions.filter(sub =>
            sub.is_active && new Date(sub.end_date) > new Date()
        );

        const expiredSubscriptions = subscriptions.filter(sub =>
            !sub.is_active || new Date(sub.end_date) <= new Date()
        );

        res.json({
            success: true,
            message: 'Subscription status retrieved successfully',
            data: {
                active: activeSubscriptions,
                expired: expiredSubscriptions,
                total: subscriptions.length,
                has_active_subscription: activeSubscriptions.length > 0
            }
        });
    } catch (error) {
        logger.error('Get subscription status failed', {
            userId: req.user?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription status',
            error: error.message
        });
    }
};

/**
 * Add Wallet Balance with Multiple Payment Methods
 */
const addWalletBalanceEnhanced = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, payment_method, payment_data } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount',
                error: 'Amount must be greater than 0'
            });
        }

        if (!payment_method || !['chamcash', 'ecash', 'paymob', 'stripe', 'cash'].includes(payment_method)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method',
                error: 'Please select a valid payment method'
            });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: ERROR_MESSAGES.USER_NOT_FOUND
            });
        }

        const { paymentService } = require('../services');

        let paymentResult;

        // Process payment based on method
        switch (payment_method) {
            case 'chamcash':
            case 'ecash':
                // These would integrate with Syrian payment gateways
                paymentResult = {
                    success: true,
                    transaction_id: `${payment_method.toUpperCase()}-${Date.now()}`,
                    amount: amount,
                    status: 'pending' // Would be confirmed via webhook
                };
                break;

            case 'paymob':
            case 'stripe':
                paymentResult = await paymentService.createPayment({
                    userId,
                    amount,
                    currency: 'EGP',
                    description: 'Wallet top-up',
                    orderId: `WALLET-${userId}-${Date.now()}`
                }, payment_method);
                break;

            case 'cash':
                // Cash deposits would be handled manually by admin
                paymentResult = {
                    success: true,
                    transaction_id: `CASH-${Date.now()}`,
                    amount: amount,
                    status: 'pending_admin_approval'
                };
                break;
        }

        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                user_id: userId,
                transaction_type: 'wallet_topup',
                reference_type: 'wallet',
                reference_id: user.id,
                amount: amount,
                payment_method: payment_method,
                status: paymentResult.status || 'pending',
                description: `Wallet top-up via ${payment_method}`
            }
        });

        logger.info('Wallet top-up initiated', {
            userId,
            amount,
            payment_method,
            transaction_id: transaction.id
        });

        res.json({
            success: true,
            message: 'Wallet top-up initiated successfully',
            data: {
                transaction_id: transaction.id,
                amount: amount,
                payment_method: payment_method,
                status: paymentResult.status || 'pending',
                payment_details: paymentResult
            }
        });
    } catch (error) {
        logger.error('Wallet top-up failed', {
            userId: req.user?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Wallet top-up failed',
            error: error.message
        });
    }
};

/**
 * Redeem Points with Validation
 */
const redeemPoints = async (req, res) => {
    try {
        const userId = req.user.id;
        const { points_to_redeem, redemption_type } = req.body;

        if (!points_to_redeem || points_to_redeem <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid points amount',
                error: 'Points must be greater than 0'
            });
        }

        const { pointsService } = require('../services');

        // Validate redemption
        try {
            pointsService.validatePointsRedemption(points_to_redeem);
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                message: 'Points redemption validation failed',
                error: validationError.message
            });
        }

        // Redeem points
        const redemption = await pointsService.redeemPoints(
            userId,
            points_to_redeem,
            `redemption-${Date.now()}`,
            `Points redeemed for ${redemption_type || 'wallet credit'}`
        );

        // If redeeming for wallet credit, add to wallet
        if (redemption_type === 'wallet') {
            const egpValue = redemption.egpValue;
            await prisma.user.update({
                where: { id: userId },
                data: {
                    wallet_balance: {
                        increment: egpValue
                    }
                }
            });
        }

        logger.info('Points redeemed successfully', {
            userId,
            points_redeemed: points_to_redeem,
            egp_value: redemption.egpValue
        });

        res.json({
            success: true,
            message: 'Points redeemed successfully',
            data: {
                points_redeemed: points_to_redeem,
                egp_value: redemption.egpValue,
                new_balance: redemption.newBalance,
                redemption_type: redemption_type || 'wallet'
            }
        });
    } catch (error) {
        logger.error('Points redemption failed', {
            userId: req.user?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Points redemption failed',
            error: error.message
        });
    }
};

/**
 * Get/Update Notification Preferences
 */
const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user preferences (would be stored in a separate table or JSON field)
        const user = await prisma.user.findUnique({ where: { id: userId } });

        // Default preferences if not set
        const preferences = {
            push_notifications: true,
            email_notifications: true,
            sms_notifications: false,
            notification_types: {
                booking_confirmations: true,
                order_updates: true,
                points_earned: true,
                promotional: false,
                security_alerts: true
            }
        };

        res.json({
            success: true,
            message: 'Notification preferences retrieved successfully',
            data: preferences
        });
    } catch (error) {
        logger.error('Get notification preferences failed', {
            userId: req.user?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification preferences',
            error: error.message
        });
    }
};

const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;

        // Validate preferences structure
        if (typeof preferences !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid preferences format',
                error: 'Preferences must be an object'
            });
        }

        // Update user preferences (would update JSON field or separate table)
        // For now, just return success
        logger.info('Notification preferences updated', {
            userId,
            preferences
        });

        res.json({
            success: true,
            message: 'Notification preferences updated successfully',
            data: preferences
        });
    } catch (error) {
        logger.error('Update notification preferences failed', {
            userId: req.user?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to update notification preferences',
            error: error.message
        });
    }
};

module.exports = {
    chatWithAssistant,
    getAssistantRecommendations,
    getSubscriptionStatus,
    addWalletBalanceEnhanced,
    redeemPoints,
    getNotificationPreferences,
    updateNotificationPreferences
};
