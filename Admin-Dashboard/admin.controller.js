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

// --- Users ---
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await prisma.user.findMany({
            skip,
            take: limit,
            orderBy: { created_at: 'desc' } // Note: schema says created_at, not createdAt
        });
        const total = await prisma.user.count();

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } }); // ID is String (UUID)
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { is_active } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { is_active }
        });
        res.status(200).json({ success: true, message: "User status updated", data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- Businesses ---
exports.getAllBusinesses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const businesses = await prisma.business.findMany({
            skip,
            take: limit,
            orderBy: { created_at: 'desc' }
        });
        const total = await prisma.business.count();

        res.status(200).json({
            success: true,
            count: businesses.length,
            total,
            data: businesses
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBusinessById = async (req, res) => {
    try {
        const business = await prisma.business.findUnique({
            where: { id: req.params.id },
            include: { reservations: true, orders: true } // Optional: include related data
        });
        if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
        res.status(200).json({ success: true, data: business });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateBusinessStatus = async (req, res) => {
    try {
        const { is_active } = req.body; // or 'status' if you add an approval status enum
        const business = await prisma.business.update({
            where: { id: req.params.id },
            data: { is_active }
        });
        res.status(200).json({ success: true, message: "Business status updated", data: business });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteBusiness = async (req, res) => {
    try {
        await prisma.business.delete({ where: { id: req.params.id } });
        res.status(200).json({ success: true, message: "Business deleted" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- Drivers ---
exports.getAllDrivers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const drivers = await prisma.driver.findMany({
            skip,
            take: limit,
            orderBy: { created_at: 'desc' }
        });
        const total = await prisma.driver.count();

        res.status(200).json({
            success: true,
            count: drivers.length,
            total,
            data: drivers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getDriverById = async (req, res) => {
    try {
        const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
        if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
        res.status(200).json({ success: true, data: driver });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateDriverStatus = async (req, res) => {
    try {
        const { is_active } = req.body;
        const driver = await prisma.driver.update({
            where: { id: req.params.id },
            data: { is_active }
        });
        res.status(200).json({ success: true, message: "Driver status updated", data: driver });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getSystemHealth = (req, res) => {
    res.status(200).json({
        success: true,
        status: 'UP',
        timestamp: new Date(),
        uptime: process.uptime()
    });
};

// Analytics placeholders (You can implement logic here later)
exports.getRevenueChartData = (req, res) => res.json({ success: true, data: [] });
exports.getUserGrowthData = (req, res) => res.json({ success: true, data: [] });

// --- Transactions ---
exports.getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { type, status, paymentMethod } = req.query;
        const where = {};
        if (type && type !== 'all') where.transaction_type = type;
        if (status && status !== 'all') where.status = status;
        if (paymentMethod && paymentMethod !== 'all') where.payment_method = paymentMethod;

        const transactions = await prisma.transaction.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                user: { select: { full_name: true, email: true } },
                business: { select: { business_name: true } },
                driver: { select: { full_name: true } }
            }
        });
        const total = await prisma.transaction.count({ where });

        res.status(200).json({
            success: true,
            count: transactions.length,
            total,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                business: true,
                driver: true,
                order: true,
                reservation: true
            }
        });
        if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
        res.status(200).json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
