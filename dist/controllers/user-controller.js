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
}
exports.default = new UserController();
