// Utility functions for localStorage persistence

const STORAGE_KEYS = {
    USERS: 'coresy_admin_users',
    BUSINESSES: 'coresy_admin_businesses',
    DRIVERS: 'coresy_admin_drivers',
    SUBSCRIPTIONS: 'coresy_admin_subscriptions',
    SUBSCRIPTION_PLANS: 'coresy_admin_subscription_plans',
    SYSTEM_SETTINGS: 'coresy_admin_system_settings',
    PROFILE: 'coresy_admin_profile',
    NOTIFICATIONS: 'coresy_admin_notifications',
    TRANSACTIONS: 'coresy_admin_transactions',
} as const;

export const storage = {
    // Generic get/set functions
    get: <T>(key: string, defaultValue: T): T => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage key "${key}":`, error);
            return defaultValue;
        }
    },

    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
        }
    },

    remove: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    },

    // Specific getters/setters for each data type
    getUsers: <T>(defaultValue: T): T => storage.get(STORAGE_KEYS.USERS, defaultValue),
    setUsers: <T>(value: T): void => storage.set(STORAGE_KEYS.USERS, value),

    getBusinesses: <T>(defaultValue: T): T => storage.get(STORAGE_KEYS.BUSINESSES, defaultValue),
    setBusinesses: <T>(value: T): void => storage.set(STORAGE_KEYS.BUSINESSES, value),

    getDrivers: <T>(defaultValue: T): T => storage.get(STORAGE_KEYS.DRIVERS, defaultValue),
    setDrivers: <T>(value: T): void => storage.set(STORAGE_KEYS.DRIVERS, value),

    getSubscriptions: <T>(defaultValue: T): T => storage.get(STORAGE_KEYS.SUBSCRIPTIONS, defaultValue),
    setSubscriptions: <T>(value: T): void => storage.set(STORAGE_KEYS.SUBSCRIPTIONS, value),

    getSubscriptionPlans: <T>(defaultValue: T): T => storage.get(STORAGE_KEYS.SUBSCRIPTION_PLANS, defaultValue),
    setSubscriptionPlans: <T>(value: T): void => storage.set(STORAGE_KEYS.SUBSCRIPTION_PLANS, value),

    getSystemSettings: <T>(defaultValue: T): T => storage.get(STORAGE_KEYS.SYSTEM_SETTINGS, defaultValue),
    setSystemSettings: <T>(value: T): void => storage.set(STORAGE_KEYS.SYSTEM_SETTINGS, value),

    getProfile: <T>(defaultValue: T): T => storage.get(STORAGE_KEYS.PROFILE, defaultValue),
    setProfile: <T>(value: T): void => storage.set(STORAGE_KEYS.PROFILE, value),

    getNotifications: <T>(defaultValue: T): T => storage.get(STORAGE_KEYS.NOTIFICATIONS, defaultValue),
    setNotifications: <T>(value: T): void => storage.set(STORAGE_KEYS.NOTIFICATIONS, value),

    getTransactions: <T>(defaultValue: T): T => storage.get(STORAGE_KEYS.TRANSACTIONS, defaultValue),
    setTransactions: <T>(value: T): void => storage.set(STORAGE_KEYS.TRANSACTIONS, value),
};

