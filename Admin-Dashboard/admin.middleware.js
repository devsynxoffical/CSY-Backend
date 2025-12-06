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

        // Check if admin still exists
        // Assuming you have an Admin model, or utilizing User model with role
        // For this implementation, we'll assume a 'User' model with role 'ADMIN' or specific Admin model
        // Let's assume User model with role for now to be safe, or separate Admin table if created

        // Check for Admin in User table (if using single table inheritance)
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        // Alternatively check separate Admin table if it exists
        // const currentAdmin = await prisma.admin.findUnique({ where: { id: decoded.id } });

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'The user belonging to this token does not exist'
            });
        }

        // specific role check if needed
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
            // fallback if role isn't distinct in token
            return res.status(403).json({
                success: false,
                message: 'Access restricted to admins only'
            });
        }

        req.user = currentUser;
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
