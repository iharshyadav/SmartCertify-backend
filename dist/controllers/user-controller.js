"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismadb_1 = __importDefault(require("../databases/prismadb"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserController {
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.query.id || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                if (!userId) {
                    res.status(401).json({ success: false, message: 'User not authenticated or ID not provided' });
                    return;
                }
                const userProfile = yield prismadb_1.default.user.findUnique({
                    where: {
                        id: userId
                    }
                });
                if (!userProfile) {
                    res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    data: userProfile
                });
            }
            catch (error) {
                console.error('Error fetching user profile:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    }
    updateProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.query.id || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                if (!userId) {
                    res.status(401).json({ success: false, message: 'User not authenticated' });
                    return;
                }
                const updateData = req.body;
                if (!updateData || Object.keys(updateData).length === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'No update data provided'
                    });
                    return;
                }
                const { id, email, password, createdAt, updatedAt } = updateData, allowedUpdates = __rest(updateData, ["id", "email", "password", "createdAt", "updatedAt"]);
                if (updateData.failedLoginAttempts >= 5 && updateData.accountLocked) {
                    res.status(403).json({
                        success: false,
                        message: 'Account is locked due to too many failed login attempts. Please reset your password or contact support.'
                    });
                    return;
                }
                if (Object.keys(allowedUpdates).length === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'No valid fields to update'
                    });
                    return;
                }
                const updatedUser = yield prismadb_1.default.user.update({
                    where: {
                        id: userId
                    },
                    data: allowedUpdates
                });
                res.status(200).json({
                    success: true,
                    message: 'Profile updated successfully',
                    data: updatedUser
                });
            }
            catch (error) {
                console.error('Error updating user profile:', error);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    }
    // Admin functions
    getAllUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const currentUser = yield prismadb_1.default.user.findUnique({
                    where: { id: req.user.id },
                    select: { admin: true }
                });
                if (!currentUser || !currentUser.admin) {
                    res.status(403).json({ success: false, message: 'Not authorized' });
                    return;
                }
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;
                const users = yield prismadb_1.default.user.findMany({
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                });
                const total = yield prismadb_1.default.user.count();
                res.status(200).json({
                    success: true,
                    data: users,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    }
                });
            }
            catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    createUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const currentUser = yield prismadb_1.default.user.findUnique({
                    where: { id: req.user.id },
                    select: { admin: true }
                });
                if (!currentUser || !currentUser.admin) {
                    res.status(403).json({ success: false, message: 'Not authorized' });
                    return;
                }
                const { email, username, password, fullName, securityId, admin } = req.body;
                if (!email || !password || !username || !securityId) {
                    res.status(400).json({ success: false, message: 'Email, username, password, and securityId are required' });
                    return;
                }
                // Check if user already exists
                const existingUser = yield prismadb_1.default.user.findFirst({
                    where: {
                        OR: [
                            { email },
                            { username },
                            { securityId }
                        ]
                    }
                });
                if (existingUser) {
                    res.status(400).json({ success: false, message: 'User with this email, username, or securityId already exists' });
                    return;
                }
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
                const newUser = yield prismadb_1.default.user.create({
                    data: {
                        email,
                        username,
                        password: hashedPassword,
                        fullName,
                        securityId,
                        admin: admin || false
                    }
                });
                res.status(201).json({
                    success: true,
                    message: 'User created successfully',
                    data: newUser
                });
            }
            catch (error) {
                console.error('Error creating user:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Admin check
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const currentUser = yield prismadb_1.default.user.findUnique({
                    where: { id: req.user.id },
                    select: { admin: true }
                });
                if (!currentUser || !currentUser.admin) {
                    res.status(403).json({ success: false, message: 'Not authorized' });
                    return;
                }
                const userId = req.params.id;
                if (!userId) {
                    res.status(400).json({ success: false, message: 'User ID is required' });
                    return;
                }
                const user = yield prismadb_1.default.user.findUnique({
                    where: { id: userId }
                });
                if (!user) {
                    res.status(404).json({ success: false, message: 'User not found' });
                    return;
                }
                yield prismadb_1.default.user.delete({
                    where: { id: userId }
                });
                res.status(200).json({
                    success: true,
                    message: 'User deleted successfully'
                });
            }
            catch (error) {
                console.error('Error deleting user:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    toggleAdminStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const currentUser = yield prismadb_1.default.user.findUnique({
                    where: { id: req.user.id },
                    select: { admin: true }
                });
                if (!currentUser || !currentUser.admin) {
                    res.status(403).json({ success: false, message: 'Not authorized' });
                    return;
                }
                const userId = req.params.id;
                const { admin } = req.body;
                if (!userId || admin === undefined) {
                    res.status(400).json({ success: false, message: 'User ID and admin status are required' });
                    return;
                }
                const updatedUser = yield prismadb_1.default.user.update({
                    where: { id: userId },
                    data: { admin }
                });
                res.status(200).json({
                    success: true,
                    message: 'User admin status updated successfully',
                    data: updatedUser
                });
            }
            catch (error) {
                console.error('Error updating admin status:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    toggleAccountLock(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Admin check
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const currentUser = yield prismadb_1.default.user.findUnique({
                    where: { id: req.user.id },
                    select: { admin: true }
                });
                if (!currentUser || !currentUser.admin) {
                    res.status(403).json({ success: false, message: 'Not authorized' });
                    return;
                }
                const userId = req.params.id;
                const { locked, lockDuration } = req.body;
                if (!userId) {
                    res.status(400).json({ success: false, message: 'User ID is required' });
                    return;
                }
                let lockExpiresAt = null;
                if (locked && lockDuration) {
                    lockExpiresAt = new Date(Date.now() + lockDuration * 60 * 1000);
                }
                const updatedUser = yield prismadb_1.default.user.update({
                    where: { id: userId },
                    data: {
                        accountLocked: locked,
                        failedLoginAttempts: locked ? undefined : 0,
                        lockExpiresAt: locked ? lockExpiresAt : null
                    }
                });
                res.status(200).json({
                    success: true,
                    message: `Account ${locked ? 'locked' : 'unlocked'} successfully`,
                    data: updatedUser
                });
            }
            catch (error) {
                console.error('Error toggling account lock:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    getUserStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const currentUser = yield prismadb_1.default.user.findUnique({
                    where: { id: req.user.id },
                    select: { admin: true }
                });
                if (!currentUser || !currentUser.admin) {
                    res.status(403).json({ success: false, message: 'Not authorized' });
                    return;
                }
                const totalUsers = yield prismadb_1.default.user.count();
                const lockedAccounts = yield prismadb_1.default.user.count({
                    where: { accountLocked: true }
                });
                const adminUsers = yield prismadb_1.default.user.count({
                    where: { admin: true }
                });
                const newUsersThisMonth = yield prismadb_1.default.user.count({
                    where: {
                        createdAt: {
                            gte: new Date(new Date().setDate(1))
                        }
                    }
                });
                const totalCertificates = yield prismadb_1.default.certificate.count();
                res.status(200).json({
                    success: true,
                    data: {
                        totalUsers,
                        lockedAccounts,
                        adminUsers,
                        newUsersThisMonth,
                        totalCertificates
                    }
                });
            }
            catch (error) {
                console.error('Error fetching user stats:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Check if admin or the user themself
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const userId = req.params.id;
                const { newPassword } = req.body;
                if (!userId || !newPassword) {
                    res.status(400).json({ success: false, message: 'User ID and new password are required' });
                    return;
                }
                // Only allow admin or the user themself to reset password
                const currentUser = yield prismadb_1.default.user.findUnique({
                    where: { id: req.user.id },
                    select: { admin: true }
                });
                if (userId !== req.user.id && (!currentUser || !currentUser.admin)) {
                    res.status(403).json({ success: false, message: 'Not authorized' });
                    return;
                }
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
                yield prismadb_1.default.user.update({
                    where: { id: userId },
                    data: {
                        password: hashedPassword,
                        accountLocked: false,
                        failedLoginAttempts: 0,
                        lockExpiresAt: null
                    }
                });
                res.status(200).json({
                    success: true,
                    message: 'Password reset successfully'
                });
            }
            catch (error) {
                console.error('Error resetting password:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    searchUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const currentUser = yield prismadb_1.default.user.findUnique({
                    where: { id: req.user.id },
                    select: { admin: true }
                });
                if (!currentUser || !currentUser.admin) {
                    res.status(403).json({ success: false, message: 'Not authorized' });
                    return;
                }
                const { query, isLocked, isAdmin } = req.query;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;
                const whereClause = {};
                if (query) {
                    whereClause.OR = [
                        { email: { contains: query, mode: 'insensitive' } },
                        { username: { contains: query, mode: 'insensitive' } },
                        { fullName: { contains: query, mode: 'insensitive' } },
                        { securityId: { contains: query, mode: 'insensitive' } }
                    ];
                }
                if (isLocked !== undefined) {
                    whereClause.accountLocked = isLocked === 'true';
                }
                if (isAdmin !== undefined) {
                    whereClause.admin = isAdmin === 'true';
                }
                const users = yield prismadb_1.default.user.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                });
                const total = yield prismadb_1.default.user.count({ where: whereClause });
                res.status(200).json({
                    success: true,
                    data: users,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    }
                });
            }
            catch (error) {
                console.error('Error searching users:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    exportUserData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.params.id;
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                if (userId !== req.user.id) {
                    const currentUser = yield prismadb_1.default.user.findUnique({
                        where: { id: req.user.id },
                        select: { admin: true }
                    });
                    if (!currentUser || !currentUser.admin) {
                        res.status(403).json({ success: false, message: 'Not authorized' });
                        return;
                    }
                }
                const userData = yield prismadb_1.default.user.findUnique({
                    where: { id: userId },
                    include: {
                        certificates: true,
                    }
                });
                if (!userData) {
                    res.status(404).json({ success: false, message: 'User not found' });
                    return;
                }
                const _b = userData, { password } = _b, userDataToExport = __rest(_b, ["password"]);
                res.status(200).json({
                    success: true,
                    data: userDataToExport
                });
            }
            catch (error) {
                console.error('Error exporting user data:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
}
exports.default = new UserController();
