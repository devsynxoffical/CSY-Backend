const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

exports.protectAdmin = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check for Admin in Admin table
        const currentAdmin = await prisma.admin.findUnique({
            where: { id: decoded.id }
        });

        if (!currentAdmin) {
            return res.status(401).json({
                success: false,
                message: 'The user belonging to this token does not exist'
            });
        }

        // Check if admin is active
        if (!currentAdmin.is_active) {
            return res.status(401).json({
                success: false,
                message: 'This admin account is deactivated.'
            });
        }

        req.user = currentAdmin;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // Modify based on your specific role structure
        // If roles are ['admin', 'super_admin']
        if (!roles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
