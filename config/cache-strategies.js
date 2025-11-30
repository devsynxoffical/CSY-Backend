const { cacheHelpers } = require('./redis');

/**
 * Cache Strategy Configuration
 * Defines TTL (Time To Live) and cache keys for different data types
 */

const CACHE_TTL = {
    USER_SESSION: 24 * 60 * 60,        // 24 hours
    USER_PROFILE: 30 * 60,              // 30 minutes
    BUSINESS_LISTING: 60 * 60,          // 1 hour
    BUSINESS_DETAIL: 30 * 60,           // 30 minutes
    QR_CODE: 5 * 60,                    // 5 minutes
    WALLET_BALANCE: 30 * 60,            // 30 minutes
    POINTS_BALANCE: 30 * 60,            // 30 minutes
    ORDER_STATUS: 2 * 60,               // 2 minutes
    DRIVER_LOCATION: 1 * 60,            // 1 minute
    RATING_AVERAGE: 60 * 60,            // 1 hour
    RESERVATION_LIST: 10 * 60,          // 10 minutes
};

/**
 * Generate cache keys
 */
const cacheKeys = {
    userSession: (userId) => `user:session:${userId}`,
    userProfile: (userId) => `user:profile:${userId}`,
    businessListing: (filters) => `business:list:${JSON.stringify(filters)}`,
    businessDetail: (businessId) => `business:detail:${businessId}`,
    qrCode: (code) => `qr:${code}`,
    walletBalance: (userId) => `wallet:${userId}`,
    pointsBalance: (userId) => `points:${userId}`,
    orderStatus: (orderId) => `order:status:${orderId}`,
    driverLocation: (driverId) => `driver:location:${driverId}`,
    ratingAverage: (entityType, entityId) => `rating:${entityType}:${entityId}`,
    reservationList: (userId) => `reservation:list:${userId}`,
};

/**
 * Cache invalidation patterns
 */
const invalidateCache = {
    // Invalidate user-related caches
    user: async (userId) => {
        await Promise.all([
            cacheHelpers.del(cacheKeys.userProfile(userId)),
            cacheHelpers.del(cacheKeys.walletBalance(userId)),
            cacheHelpers.del(cacheKeys.pointsBalance(userId)),
            cacheHelpers.del(cacheKeys.reservationList(userId)),
        ]);
    },

    // Invalidate business-related caches
    business: async (businessId) => {
        await cacheHelpers.del(cacheKeys.businessDetail(businessId));
        // Note: Business listings cache will expire naturally or can be cleared on major updates
    },

    // Invalidate order-related caches
    order: async (orderId) => {
        await cacheHelpers.del(cacheKeys.orderStatus(orderId));
    },

    // Invalidate QR code cache
    qrCode: async (code) => {
        await cacheHelpers.del(cacheKeys.qrCode(code));
    },

    // Invalidate driver location cache
    driver: async (driverId) => {
        await cacheHelpers.del(cacheKeys.driverLocation(driverId));
    },

    // Invalidate rating cache
    rating: async (entityType, entityId) => {
        await cacheHelpers.del(cacheKeys.ratingAverage(entityType, entityId));
    },
};

/**
 * Caching helper functions with automatic TTL
 */
const cache = {
    // User session cache
    setUserSession: async (userId, sessionData) => {
        return await cacheHelpers.set(
            cacheKeys.userSession(userId),
            sessionData,
            CACHE_TTL.USER_SESSION
        );
    },

    getUserSession: async (userId) => {
        return await cacheHelpers.get(cacheKeys.userSession(userId));
    },

    // User profile cache
    setUserProfile: async (userId, profileData) => {
        return await cacheHelpers.set(
            cacheKeys.userProfile(userId),
            profileData,
            CACHE_TTL.USER_PROFILE
        );
    },

    getUserProfile: async (userId) => {
        return await cacheHelpers.get(cacheKeys.userProfile(userId));
    },

    // Business listing cache
    setBusinessListing: async (filters, businesses) => {
        return await cacheHelpers.set(
            cacheKeys.businessListing(filters),
            businesses,
            CACHE_TTL.BUSINESS_LISTING
        );
    },

    getBusinessListing: async (filters) => {
        return await cacheHelpers.get(cacheKeys.businessListing(filters));
    },

    // Business detail cache
    setBusinessDetail: async (businessId, businessData) => {
        return await cacheHelpers.set(
            cacheKeys.businessDetail(businessId),
            businessData,
            CACHE_TTL.BUSINESS_DETAIL
        );
    },

    getBusinessDetail: async (businessId) => {
        return await cacheHelpers.get(cacheKeys.businessDetail(businessId));
    },

    // QR code cache
    setQRCode: async (code, qrData) => {
        return await cacheHelpers.set(
            cacheKeys.qrCode(code),
            qrData,
            CACHE_TTL.QR_CODE
        );
    },

    getQRCode: async (code) => {
        return await cacheHelpers.get(cacheKeys.qrCode(code));
    },

    // Wallet balance cache
    setWalletBalance: async (userId, balance) => {
        return await cacheHelpers.set(
            cacheKeys.walletBalance(userId),
            balance,
            CACHE_TTL.WALLET_BALANCE
        );
    },

    getWalletBalance: async (userId) => {
        return await cacheHelpers.get(cacheKeys.walletBalance(userId));
    },

    // Points balance cache
    setPointsBalance: async (userId, points) => {
        return await cacheHelpers.set(
            cacheKeys.pointsBalance(userId),
            points,
            CACHE_TTL.POINTS_BALANCE
        );
    },

    getPointsBalance: async (userId) => {
        return await cacheHelpers.get(cacheKeys.pointsBalance(userId));
    },

    // Order status cache
    setOrderStatus: async (orderId, status) => {
        return await cacheHelpers.set(
            cacheKeys.orderStatus(orderId),
            status,
            CACHE_TTL.ORDER_STATUS
        );
    },

    getOrderStatus: async (orderId) => {
        return await cacheHelpers.get(cacheKeys.orderStatus(orderId));
    },

    // Driver location cache
    setDriverLocation: async (driverId, location) => {
        return await cacheHelpers.set(
            cacheKeys.driverLocation(driverId),
            location,
            CACHE_TTL.DRIVER_LOCATION
        );
    },

    getDriverLocation: async (driverId) => {
        return await cacheHelpers.get(cacheKeys.driverLocation(driverId));
    },

    // Rating average cache
    setRatingAverage: async (entityType, entityId, ratingData) => {
        return await cacheHelpers.set(
            cacheKeys.ratingAverage(entityType, entityId),
            ratingData,
            CACHE_TTL.RATING_AVERAGE
        );
    },

    getRatingAverage: async (entityType, entityId) => {
        return await cacheHelpers.get(cacheKeys.ratingAverage(entityType, entityId));
    },

    // Reservation list cache
    setReservationList: async (userId, reservations) => {
        return await cacheHelpers.set(
            cacheKeys.reservationList(userId),
            reservations,
            CACHE_TTL.RESERVATION_LIST
        );
    },

    getReservationList: async (userId) => {
        return await cacheHelpers.get(cacheKeys.reservationList(userId));
    },
};

module.exports = {
    CACHE_TTL,
    cacheKeys,
    invalidateCache,
    cache,
};
