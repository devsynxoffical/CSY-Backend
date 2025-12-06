const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find admin in User table (assuming shared table with Role)
        // Or Admin table
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect email or password'
            });
        }

        const token = signToken(user.id);

        // Remove password from output
        user.password = undefined;

        res.status(200).json({
            success: true,
            token,
            data: {
                user
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

exports.getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            user: req.user
        }
    });
};

exports.updateActiveStatus = async (req, res) => {
    // Toggle own active status? Usually meaningless for self, but placeholder
    res.status(200).json({ success: true, message: "Status updated" });
};

exports.updatePassword = async (req, res) => {
    // Implement password update logic
    res.status(200).json({ success: true, message: "Password updated" });
}
