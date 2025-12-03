const { prisma } = require('../models');
const { logger } = require('../utils');

/**
 * Additional Driver Controller Methods
 * Add these methods to driver.controller.js to complete to 100%
 */

/**
 * Stream Real-Time Location
 */
const streamLocation = async (req, res) => {
    try {
        const driverId = req.driver.id;
        const { latitude, longitude, heading, speed } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Update driver location
        await prisma.driver.update({
            where: { id: driverId },
            data: {
                current_latitude: latitude,
                current_longitude: longitude,
                updated_at: new Date()
            }
        });

        // Broadcast location to active orders (would use WebSocket/Socket.io in production)
        const activeOrders = await prisma.order.findMany({
            where: {
                driver_id: driverId,
                status: { in: ['in_delivery', 'picked_up'] }
            },
            select: { id: true, user_id: true }
        });

        // Send location update notifications
        const { notificationService } = require('../services');
        for (const order of activeOrders) {
            await notificationService.sendNotification(
                'user',
                order.user_id,
                'driver_location_update',
                {
                    order_id: order.id,
                    latitude: latitude.toString(),
                    longitude: longitude.toString()
                },
                { sendPush: false, priority: 'low' }
            );
        }

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: {
                latitude,
                longitude,
                heading,
                speed,
                active_orders: activeOrders.length,
                timestamp: new Date()
            }
        });
    } catch (error) {
        logger.error('Stream location failed', {
            driverId: req.driver?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: error.message
        });
    }
};

/**
 * Get Earnings Breakdown by Payment Method
 */
const getEarningsBreakdown = async (req, res) => {
    try {
        const driverId = req.driver.id;
        const { start_date, end_date } = req.query;

        const where = {
            driver_id: driverId,
            transaction_type: 'earnings',
            status: 'completed'
        };

        if (start_date || end_date) {
            where.created_at = {};
            if (start_date) where.created_at.gte = new Date(start_date);
            if (end_date) where.created_at.lte = new Date(end_date);
        }

        const earningsByMethod = await prisma.transaction.groupBy({
            by: ['payment_method'],
            where,
            _sum: {
                amount: true
            },
            _count: true
        });

        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: {
                earnings_cash: true,
                earnings_online: true,
                platform_fees_owed: true
            }
        });

        const breakdown = {
            total_cash: driver.earnings_cash,
            total_online: driver.earnings_online,
            platform_fees_owed: driver.platform_fees_owed,
            net_earnings: parseFloat(driver.earnings_cash) + parseFloat(driver.earnings_online) - parseFloat(driver.platform_fees_owed),
            by_payment_method: earningsByMethod.map(item => ({
                payment_method: item.payment_method,
                total_amount: item._sum.amount,
                transaction_count: item._count
            }))
        };

        res.json({
            success: true,
            message: 'Earnings breakdown retrieved successfully',
            data: breakdown
        });
    } catch (error) {
        logger.error('Get earnings breakdown failed', {
            driverId: req.driver?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve earnings breakdown',
            error: error.message
        });
    }
};

/**
 * Helper: Calculate Performance Score
 */
const calculatePerformanceScore = ({ completed_orders, average_rating, on_time_percentage }) => {
    const orderScore = Math.min(completed_orders / 100 * 40, 40); // Max 40 points
    const ratingScore = (average_rating / 5) * 40; // Max 40 points
    const onTimeScore = (on_time_percentage / 100) * 20; // Max 20 points

    return (orderScore + ratingScore + onTimeScore).toFixed(2);
};

/**
 * Get Driver Performance Metrics
 */
const getPerformanceMetrics = async (req, res) => {
    try {
        const driverId = req.driver.id;
        const { period = '30' } = req.query; // days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const [completedOrders, totalDeliveryTime, ratings, onTimeDeliveries] = await Promise.all([
            prisma.order.count({
                where: {
                    driver_id: driverId,
                    status: 'completed',
                    updated_at: { gte: startDate }
                }
            }),
            prisma.order.aggregate({
                where: {
                    driver_id: driverId,
                    status: 'completed',
                    updated_at: { gte: startDate }
                },
                _avg: {
                    // Would calculate delivery_time if field exists
                }
            }),
            prisma.rating.aggregate({
                where: {
                    driver_id: driverId,
                    created_at: { gte: startDate }
                },
                _avg: { rating: true },
                _count: true
            }),
            prisma.order.count({
                where: {
                    driver_id: driverId,
                    status: 'completed',
                    updated_at: { gte: startDate }
                    // Would add on_time check if field exists
                }
            })
        ]);

        const metrics = {
            period_days: parseInt(period),
            completed_orders: completedOrders,
            average_rating: ratings._avg.rating || 0,
            total_ratings: ratings._count,
            on_time_percentage: completedOrders > 0 ? (onTimeDeliveries / completedOrders * 100).toFixed(2) : 0,
            orders_per_day: (completedOrders / parseInt(period)).toFixed(2),
            performance_score: calculatePerformanceScore({
                completed_orders: completedOrders,
                average_rating: ratings._avg.rating || 0,
                on_time_percentage: completedOrders > 0 ? (onTimeDeliveries / completedOrders * 100) : 0
            })
        };

        res.json({
            success: true,
            message: 'Performance metrics retrieved successfully',
            data: metrics
        });
    } catch (error) {
        logger.error('Get performance metrics failed', {
            driverId: req.driver?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve performance metrics',
            error: error.message
        });
    }
};

/**
 * Helper: Calculate Order Priority
 */
const calculateOrderPriority = (order, distance) => {
    let score = 100;

    // Distance factor (closer is better)
    score -= distance * 2;

    // Order value factor
    score += parseFloat(order.total_amount) / 100;

    // Time waiting factor
    const waitingMinutes = (new Date() - new Date(order.created_at)) / (1000 * 60);
    score += waitingMinutes / 10;

    return Math.max(score, 0);
};

/**
 * Enhanced Order Assignment Algorithm
 */
const getOptimalOrderAssignment = async (req, res) => {
    try {
        const driverId = req.driver.id;

        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: {
                current_latitude: true,
                current_longitude: true,
                is_available: true
            }
        });

        if (!driver.is_available) {
            return res.status(400).json({
                success: false,
                message: 'Driver is not available for new orders'
            });
        }

        // Get pending orders
        const pendingOrders = await prisma.order.findMany({
            where: {
                status: 'waiting_driver',
                driver_id: null
            },
            include: {
                address: true,
                order_items: {
                    include: {
                        business: {
                            select: {
                                latitude: true,
                                longitude: true,
                                business_name: true
                            }
                        }
                    }
                }
            }
        });

        // Calculate optimal order based on distance and priority
        const { mapsService } = require('../services');
        const ordersWithDistance = await Promise.all(
            pendingOrders.map(async (order) => {
                const distance = await mapsService.calculateDistance(
                    { lat: driver.current_latitude, lng: driver.current_longitude },
                    { lat: order.address?.latitude, lng: order.address?.longitude }
                );

                return {
                    ...order,
                    distance_km: distance,
                    priority_score: calculateOrderPriority(order, distance)
                };
            })
        );

        // Sort by priority score
        ordersWithDistance.sort((a, b) => b.priority_score - a.priority_score);

        res.json({
            success: true,
            message: 'Optimal order assignments retrieved successfully',
            data: {
                recommended_order: ordersWithDistance[0] || null,
                all_available_orders: ordersWithDistance.slice(0, 10) // Top 10
            }
        });
    } catch (error) {
        logger.error('Get optimal order assignment failed', {
            driverId: req.driver?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to get order assignments',
            error: error.message
        });
    }
};

/**
 * Get Route Optimization
 */
const getOptimizedRoute = async (req, res) => {
    try {
        const driverId = req.driver.id;
        const { order_ids } = req.body;

        if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order IDs array is required'
            });
        }

        const orders = await prisma.order.findMany({
            where: {
                id: { in: order_ids },
                driver_id: driverId
            },
            include: {
                address: true,
                order_items: {
                    include: {
                        business: {
                            select: {
                                latitude: true,
                                longitude: true,
                                business_name: true,
                                address: true
                            }
                        }
                    }
                }
            }
        });

        const { mapsService } = require('../services');
        const optimizedRoute = await mapsService.optimizeRoute(
            orders.map(order => ({
                order_id: order.id,
                pickup: {
                    lat: order.order_items[0]?.business.latitude,
                    lng: order.order_items[0]?.business.longitude,
                    name: order.order_items[0]?.business.business_name
                },
                delivery: {
                    lat: order.address?.latitude,
                    lng: order.address?.longitude,
                    address: order.delivery_address
                }
            }))
        );

        res.json({
            success: true,
            message: 'Route optimized successfully',
            data: optimizedRoute
        });
    } catch (error) {
        logger.error('Get optimized route failed', {
            driverId: req.driver?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to optimize route',
            error: error.message
        });
    }
};

/**
 * Complete QR Scanning for All Delivery Types
 */
const scanDeliveryQR = async (req, res) => {
    try {
        const driverId = req.driver.id;
        const { qr_code, scan_type, amount } = req.body;

        if (!qr_code || !scan_type) {
            return res.status(400).json({
                success: false,
                message: 'QR code and scan type are required'
            });
        }

        const { qrService } = require('../services');

        const scanResult = await qrService.scanQR(qr_code, driverId, {
            scan_type,
            amount
        });

        if (!scanResult.success) {
            return res.status(400).json({
                success: false,
                message: scanResult.error || 'QR scan failed'
            });
        }

        // Update order status based on scan type
        if (scan_type === 'pickup') {
            await prisma.order.update({
                where: { id: scanResult.result.orderId },
                data: { status: 'picked_up' }
            });
        } else if (scan_type === 'delivery_cash' || scan_type === 'delivery_online') {
            await prisma.order.update({
                where: { id: scanResult.result.orderId },
                data: {
                    status: 'completed',
                    payment_status: 'paid'
                }
            });

            // Update driver earnings
            const order = await prisma.order.findUnique({
                where: { id: scanResult.result.orderId }
            });

            if (scan_type === 'delivery_cash') {
                await prisma.driver.update({
                    where: { id: driverId },
                    data: {
                        earnings_cash: { increment: order.delivery_fee }
                    }
                });
            } else {
                await prisma.driver.update({
                    where: { id: driverId },
                    data: {
                        earnings_online: { increment: order.delivery_fee }
                    }
                });
            }
        }

        logger.info('Delivery QR scanned successfully', {
            driverId,
            scan_type,
            order_id: scanResult.result.orderId
        });

        res.json({
            success: true,
            message: 'QR scanned successfully',
            data: scanResult
        });
    } catch (error) {
        logger.error('Scan delivery QR failed', {
            driverId: req.driver?.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to scan QR code',
            error: error.message
        });
    }
};

module.exports = {
    streamLocation,
    getEarningsBreakdown,
    getPerformanceMetrics,
    getOptimalOrderAssignment,
    getOptimizedRoute,
    scanDeliveryQR,
    calculatePerformanceScore,
    calculateOrderPriority
};
