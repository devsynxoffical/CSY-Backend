const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const adminAuthController = require('./admin.auth.controller');
const { protectAdmin, restrictTo } = require('./admin.middleware');

// --- Auth Routes (Public) ---
router.post('/login', adminAuthController.login);
// Note: Register is manually handled/seeded for security, or enable temporarily
// router.post('/register', adminAuthController.register);

// --- Protected Routes ---
router.use(protectAdmin);

// Profile
router.get('/me', adminAuthController.getMe);
router.patch('/update-activestatus', adminAuthController.updateActiveStatus);
router.patch('/update-password', adminAuthController.updatePassword);

// Dashboard Overview
router.get('/dashboard/stats', adminController.getDashboardStats);
try {
    router.get('/dashboard/revenue-chart', adminController.getRevenueChartData);
    router.get('/dashboard/user-growth', adminController.getUserGrowthData);
} catch (error) {
    console.warn("Analytics endpoints not fully implemented yet");
}

// User Management
router.get('/users', restrictTo('super_admin', 'support_admin'), adminController.getAllUsers);
router.get('/users/:id', restrictTo('super_admin', 'support_admin'), adminController.getUserById);
router.patch('/users/:id/status', restrictTo('super_admin'), adminController.updateUserStatus);
router.delete('/users/:id', restrictTo('super_admin'), adminController.deleteUser); // Soft delete recommended

// Business Management
router.get('/businesses', restrictTo('super_admin', 'support_admin'), adminController.getAllBusinesses);
router.get('/businesses/:id', restrictTo('super_admin', 'support_admin'), adminController.getBusinessById);
router.patch('/businesses/:id/status', restrictTo('super_admin'), adminController.updateBusinessStatus); // Approve/Reject
router.delete('/businesses/:id', restrictTo('super_admin'), adminController.deleteBusiness);

// Driver Management
router.get('/drivers', restrictTo('super_admin', 'support_admin'), adminController.getAllDrivers);
router.get('/drivers/:id', restrictTo('super_admin', 'support_admin'), adminController.getDriverById);
router.patch('/drivers/:id/status', restrictTo('super_admin'), adminController.updateDriverStatus); // Approve/Reject

// System
router.get('/system/health', adminController.getSystemHealth);

module.exports = router;
