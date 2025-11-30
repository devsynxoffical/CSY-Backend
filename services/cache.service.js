const { cache, invalidateCache } = require('../config/cache-strategies');

/**
 * Centralized caching service for the application
 * Provides high-level caching operations with automatic invalidation
 */

class CacheService {
    /**
     * User-related caching operations
     */
    static async getUserProfile(userId, fetchFunction) {
        // Try to get from cache first
        let user = await cache.getUserProfile(userId);

        if (!user) {
            // If not in cache, fetch from database
            user = await fetchFunction();

            if (user) {
                // Store in cache
                await cache.setUserProfile(userId, user);
            }
        }

        return user;
    }

    static async invalidateUserCache(userId) {
        await invalidateCache.user(userId);
    }

    /**
     * Business-related caching operations
     */
    static async getBusinessListing(filters, fetchFunction) {
        let businesses = await cache.getBusinessListing(filters);

        if (!businesses) {
            businesses = await fetchFunction();

            if (businesses) {
                await cache.setBusinessListing(filters, businesses);
            }
        }

        return businesses;
    }

    static async getBusinessDetail(businessId, fetchFunction) {
        let business = await cache.getBusinessDetail(businessId);

        if (!business) {
            business = await fetchFunction();

            if (business) {
                await cache.setBusinessDetail(businessId, business);
            }
        }

        return business;
    }

    static async invalidateBusinessCache(businessId) {
        await invalidateCache.business(businessId);
    }

    /**
     * QR Code caching operations
     */
    static async getQRCode(code, fetchFunction) {
        let qrData = await cache.getQRCode(code);

        if (!qrData) {
            qrData = await fetchFunction();

            if (qrData) {
                await cache.setQRCode(code, qrData);
            }
        }

        return qrData;
    }

    static async invalidateQRCode(code) {
        await invalidateCache.qrCode(code);
    }

    /**
     * Wallet and Points caching operations
     */
    static async getWalletBalance(userId, fetchFunction) {
        let balance = await cache.getWalletBalance(userId);

        if (balance === null) {
            balance = await fetchFunction();

            if (balance !== null) {
                await cache.setWalletBalance(userId, balance);
            }
        }

        return balance;
    }

    static async getPointsBalance(userId, fetchFunction) {
        let points = await cache.getPointsBalance(userId);

        if (points === null) {
            points = await fetchFunction();

            if (points !== null) {
                await cache.setPointsBalance(userId, points);
            }
        }

        return points;
    }

    /**
     * Order caching operations
     */
    static async getOrderStatus(orderId, fetchFunction) {
        let status = await cache.getOrderStatus(orderId);

        if (!status) {
            status = await fetchFunction();

            if (status) {
                await cache.setOrderStatus(orderId, status);
            }
        }

        return status;
    }

    static async invalidateOrderCache(orderId) {
        await invalidateCache.order(orderId);
    }

    /**
     * Driver location caching operations
     */
    static async getDriverLocation(driverId, fetchFunction) {
        let location = await cache.getDriverLocation(driverId);

        if (!location) {
            location = await fetchFunction();

            if (location) {
                await cache.setDriverLocation(driverId, location);
            }
        }

        return location;
    }

    static async invalidateDriverCache(driverId) {
        await invalidateCache.driver(driverId);
    }

    /**
     * Rating caching operations
     */
    static async getRatingAverage(entityType, entityId, fetchFunction) {
        let rating = await cache.getRatingAverage(entityType, entityId);

        if (!rating) {
            rating = await fetchFunction();

            if (rating) {
                await cache.setRatingAverage(entityType, entityId, rating);
            }
        }

        return rating;
    }

    static async invalidateRatingCache(entityType, entityId) {
        await invalidateCache.rating(entityType, entityId);
    }

    /**
     * Reservation list caching operations
     */
    static async getReservationList(userId, fetchFunction) {
        let reservations = await cache.getReservationList(userId);

        if (!reservations) {
            reservations = await fetchFunction();

            if (reservations) {
                await cache.setReservationList(userId, reservations);
            }
        }

        return reservations;
    }

    /**
     * Session management
     */
    static async setUserSession(userId, sessionData) {
        return await cache.setUserSession(userId, sessionData);
    }

    static async getUserSession(userId) {
        return await cache.getUserSession(userId);
    }
}

module.exports = CacheService;
