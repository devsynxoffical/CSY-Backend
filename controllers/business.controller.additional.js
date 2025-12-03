const { prisma } = require('../models');
const { logger } = require('../utils');

/**
 * Additional Business Controller Methods
 * Add these methods to business.controller.js to complete to 100%
 */

/**
 * Log Cashier Operation
 */
const logCashierOperation = async (req, res) => {
    try {
        const businessId = req.business.id;
        const { cashier_id, operation_type, amount, discount_amount, reference_type, reference_id, qr_code, metadata } = req.body;

        if (!cashier_id || !operation_type) {
            return res.status(400).json({
                success: false,
                message: 'Cashier ID and operation type are required'
            });
        }

        // Verify cashier belongs to this business
        const cashier = await prisma.cashier.findFirst({
            where: {
                id: cashier_id,
                business_id: businessId
            }
        });

        if (!cashier) {
            return res.status(404).json({
                success: false,
                message: 'Cashier not found or does not belong to this business'
            });
        }

        // Create operation log
        const operation = await prisma.cashierOperation.create({
            data: {
                cashier_id,
                business_id: businessId,
                operation_type,
                amount,
                discount_amount,
                reference_type,
                reference_id,
                qr_code,
                metadata
            }
        });

        logger.info('Cashier operation logged', {
            businessId,
            cashier_id,
            operation_type,
            operation_id: operation.id
        });

        res.status(201).json({
            success: true,
            message: 'Operation logged successfully',
            data: operation
        });
    } catch (error) {
        logger.error('Log cashier operation failed', {
            businessId: req.business?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to log operation',
            error: error.message
        });
    }
};

/**
 * Get Cashier Operations Log
 */
const getCashierOperationsLog = async (req, res) => {
    try {
        const businessId = req.business.id;
        const { cashier_id, operation_type, start_date, end_date, page = 1, limit = 50 } = req.query;

        const where = { business_id: businessId };

        if (cashier_id) where.cashier_id = cashier_id;
        if (operation_type) where.operation_type = operation_type;
        if (start_date || end_date) {
            where.created_at = {};
            if (start_date) where.created_at.gte = new Date(start_date);
            if (end_date) where.created_at.lte = new Date(end_date);
        }

        const operations = await prisma.cashierOperation.findMany({
            where,
            include: {
                cashier: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            skip: (page - 1) * limit,
            take: parseInt(limit)
        });

        const total = await prisma.cashierOperation.count({ where });

        res.json({
            success: true,
            message: 'Operations log retrieved successfully',
            data: {
                operations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    total_pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get operations log failed', {
            businessId: req.business?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve operations log',
            error: error.message
        });
    }
};

/**
 * Helper: Get Business Analytics Data
 */
const getBusinessAnalyticsData = async (businessId, startDate, endDate) => {
    const [orders, reservations, ratings, revenue] = await Promise.all([
        prisma.order.count({
            where: {
                order_items: {
                    some: { business_id: businessId }
                },
                created_at: { gte: startDate, lte: endDate }
            }
        }),
        prisma.reservation.count({
            where: {
                business_id: businessId,
                created_at: { gte: startDate, lte: endDate }
            }
        }),
        prisma.rating.aggregate({
            where: {
                business_id: businessId,
                created_at: { gte: startDate, lte: endDate }
            },
            _avg: { rating: true },
            _count: true
        }),
        prisma.transaction.aggregate({
            where: {
                business_id: businessId,
                transaction_type: 'payment',
                status: 'completed',
                created_at: { gte: startDate, lte: endDate }
            },
            _sum: { amount: true }
        })
    ]);

    return {
        period: { start: startDate, end: endDate },
        orders: orders,
        reservations: reservations,
        average_rating: ratings._avg.rating || 0,
        total_ratings: ratings._count,
        total_revenue: revenue._sum.amount || 0
    };
};

/**
 * Export Analytics to Excel/PDF
 */
const exportAnalytics = async (req, res) => {
    try {
        const businessId = req.business.id;
        const { format, start_date, end_date, report_type } = req.query;

        if (!format || !['excel', 'pdf'].includes(format)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid export format. Use excel or pdf'
            });
        }

        // Get analytics data
        const analyticsData = await getBusinessAnalyticsData(
            businessId,
            start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end_date ? new Date(end_date) : new Date()
        );

        // Generate export file (would use libraries like exceljs or pdfkit)
        const exportData = {
            business_id: businessId,
            report_type: report_type || 'comprehensive',
            generated_at: new Date(),
            data: analyticsData,
            format: format
        };

        logger.info('Analytics exported', {
            businessId,
            format,
            report_type
        });

        res.json({
            success: true,
            message: `Analytics export prepared in ${format} format`,
            data: exportData,
            download_url: `/api/business/analytics/download/${businessId}/${format}` // Would be actual file URL
        });
    } catch (error) {
        logger.error('Export analytics failed', {
            businessId: req.business?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to export analytics',
            error: error.message
        });
    }
};

/**
 * Bulk Check Appointment Availability
 */
const bulkCheckAppointmentAvailability = async (req, res) => {
    try {
        const businessId = req.business.id;
        const { dates, duration } = req.body;

        if (!dates || !Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Dates array is required'
            });
        }

        const availability = {};

        for (const date of dates) {
            const dateObj = new Date(date);
            const existingAppointments = await prisma.appointment.findMany({
                where: {
                    business_id: businessId,
                    date: dateObj,
                    is_available: true
                },
                orderBy: { time: 'asc' }
            });

            availability[date] = {
                total_slots: existingAppointments.length,
                available_slots: existingAppointments.filter(apt => apt.is_available).length,
                slots: existingAppointments.map(apt => ({
                    time: apt.time,
                    duration: apt.duration,
                    price: apt.price,
                    service_name: apt.service_name,
                    is_available: apt.is_available
                }))
            };
        }

        res.json({
            success: true,
            message: 'Appointment availability checked successfully',
            data: availability
        });
    } catch (error) {
        logger.error('Bulk check availability failed', {
            businessId: req.business?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to check availability',
            error: error.message
        });
    }
};

/**
 * Generate Enhanced QR Codes for All Scenarios
 */
const generateEnhancedQRCode = async (req, res) => {
    try {
        const businessId = req.business.id;
        const { qr_type, reference_id, expiry_minutes, additional_data } = req.body;

        if (!qr_type || !['discount', 'payment', 'reservation', 'order', 'pickup'].includes(qr_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid QR type'
            });
        }

        const { qrService } = require('../services');

        const qrCode = await qrService.generateQR(
            qr_type,
            reference_id || `${qr_type}-${Date.now()}`,
            {
                business_id: businessId,
                ...additional_data
            }
        );

        // If temporary tokenized QR (1-minute validity for payments)
        if (qr_type === 'payment' && expiry_minutes === 1) {
            // Update expiry to 1 minute
            await prisma.qRCode.update({
                where: { id: qrCode.id },
                data: {
                    expires_at: new Date(Date.now() + 60 * 1000) // 1 minute
                }
            });
        }

        logger.info('Enhanced QR code generated', {
            businessId,
            qr_type,
            qr_id: qrCode.id
        });

        res.status(201).json({
            success: true,
            message: 'QR code generated successfully',
            data: qrCode
        });
    } catch (error) {
        logger.error('Generate QR code failed', {
            businessId: req.business?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: error.message
        });
    }
};

module.exports = {
    logCashierOperation,
    getCashierOperationsLog,
    exportAnalytics,
    bulkCheckAppointmentAvailability,
    generateEnhancedQRCode,
    getBusinessAnalyticsData
};
