/**
 * Mongoose to Prisma Migration Script
 * This script provides conversion patterns for migrating controllers
 */

// Common Mongoose to Prisma conversions:

// 1. IMPORTS
// OLD: const { User, Address } = require('../models');
// NEW: const { prisma } = require('../models');
//      const CacheService = require('../services/cache.service');

// 2. FIND ONE
// OLD: await User.findOne({ email })
// NEW: await prisma.user.findUnique({ where: { email } })
// OLD: await User.findOne({ id: userId })
// NEW: await prisma.user.findUnique({ where: { id: userId } })

// 3. FIND MANY
// OLD: await User.find({ is_active: true })
// NEW: await prisma.user.findMany({ where: { is_active: true } })
// OLD: await User.find({ is_active: true }).sort({ created_at: -1 }).limit(10)
// NEW: await prisma.user.findMany({ 
//        where: { is_active: true },
//        orderBy: { created_at: 'desc' },
//        take: 10
//      })

// 4. CREATE
// OLD: await User.create({ email, password_hash })
// NEW: await prisma.user.create({ data: { email, password_hash } })
// OLD: const user = new User({ email }); await user.save();
// NEW: await prisma.user.create({ data: { email } })

// 5. UPDATE
// OLD: await User.findByIdAndUpdate(userId, { full_name }, { new: true })
// NEW: await prisma.user.update({ 
//        where: { id: userId },
//        data: { full_name }
//      })
// OLD: user.full_name = 'New Name'; await user.save();
// NEW: await prisma.user.update({
//        where: { id: user.id },
//        data: { full_name: 'New Name' }
//      })

// 6. DELETE
// OLD: await User.deleteOne({ id: userId })
// NEW: await prisma.user.delete({ where: { id: userId } })
// OLD: await User.deleteMany({ is_active: false })
// NEW: await prisma.user.deleteMany({ where: { is_active: false } })

// 7. COUNT
// OLD: await User.countDocuments({ is_active: true })
// NEW: await prisma.user.count({ where: { is_active: true } })

// 8. AGGREGATION
// OLD: await Points.aggregate([...])
// NEW: await prisma.points.aggregate({
//        _sum: { points_earned: true },
//        _count: true,
//        where: { user_id: userId }
//      })

// 9. RELATIONS
// OLD: await User.findOne({ id }).populate('addresses')
// NEW: await prisma.user.findUnique({
//        where: { id },
//        include: { addresses: true }
//      })

// 10. COMPLEX QUERIES
// OLD: await User.findOne({ $or: [{ email }, { phone }] })
// NEW: await prisma.user.findFirst({
//        where: {
//          OR: [
//            { email },
//            { phone }
//          ]
//        }
//      })

// 11. UPDATE MANY
// OLD: await Address.updateMany({ user_id: userId }, { is_default: false })
// NEW: await prisma.address.updateMany({
//        where: { user_id: userId },
//        data: { is_default: false }
//      })

// 12. FIELD SELECTION
// OLD: await User.findOne({ id }).select('email full_name')
// NEW: await prisma.user.findUnique({
//        where: { id },
//        select: { email: true, full_name: true }
//      })

// 13. CACHING INTEGRATION
// Before database query:
// const cached = await CacheService.getUserProfile(userId);
// if (cached) return cached;

// After database query:
// await CacheService.setUserProfile(userId, user);

// On update/delete:
// await CacheService.invalidateUserCache(userId);

module.exports = {
    note: 'Use these patterns to convert Mongoose queries to Prisma'
};
