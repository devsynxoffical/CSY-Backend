const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalBusinesses = await prisma.business.count();
        const totalDrivers = await prisma.driver.count();
        // const totalReservations = await prisma.reservation.count(); // if model exists

        // Example revenue calculation (mock or real if Payment model exists)
        // const revenue = await prisma.payment.aggregate({ _sum: { amount: true } });

        res.status(200).json({
            success: true,
            data: {
                users: totalUsers,
                businesses: totalBusinesses,
                drivers: totalDrivers,
                // revenue: revenue._sum.amount || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            take: 20, // Pagination recommended
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    // Implement logic
    res.status(200).json({ success: true, message: "User status updated" });
};

exports.deleteUser = async (req, res) => {
    // Implement logic
    res.status(200).json({ success: true, message: "User deleted" });
};


exports.getAllBusinesses = async (req, res) => {
    try {
        const businesses = await prisma.business.findMany({ take: 20 });
        res.status(200).json({ success: true, count: businesses.length, data: businesses });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBusinessById = async (req, res) => {
    // Implement
    res.status(200).json({ success: true, data: {} });
};
exports.updateBusinessStatus = async (req, res) => {
    // Implement
    res.status(200).json({ success: true, message: "Business status updated" });
};
exports.deleteBusiness = async (req, res) => {
    // Implement
    res.status(200).json({ success: true, message: "Business deleted" });
};

exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await prisma.driver.findMany({ take: 20 });
        res.status(200).json({ success: true, count: drivers.length, data: drivers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getDriverById = async (req, res) => {
    // Implement
    res.status(200).json({ success: true, data: {} });
};
exports.updateDriverStatus = async (req, res) => {
    // Implement
    res.status(200).json({ success: true, message: "Driver status updated" });
};

exports.getSystemHealth = (req, res) => {
    res.status(200).json({
        success: true,
        status: 'UP',
        timestamp: new Date(),
        uptime: process.uptime()
    });
};

// Analytics placeholders
exports.getRevenueChartData = (req, res) => res.json({ success: true, data: [] });
exports.getUserGrowthData = (req, res) => res.json({ success: true, data: [] });
