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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const express_validator_1 = require("express-validator");
const prismadb_1 = __importDefault(require("../databases/prismadb"));
const google_auth_library_1 = require("google-auth-library");
class AuthController {
    constructor() {
        this.validateSignup = [
            (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
            (0, express_validator_1.body)('password')
                .isLength({ min: 8 })
                .withMessage('Password must be at least 8 characters long')
                .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
                .withMessage('Password must include uppercase, lowercase, number and special character'),
            (0, express_validator_1.body)('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
        ];
        this.validateSignin = [
            (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
            (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
        ];
    }
    signup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({ errors: errors.array() });
                    return;
                }
                const { email, password, username, fullName } = req.body;
                const existingUser = yield prismadb_1.default.user.findUnique({
                    where: {
                        email
                    }
                });
                if (existingUser) {
                    res.status(409).json({ message: 'Email already in use' });
                    return;
                }
                const existingUsername = yield prismadb_1.default.user.findUnique({
                    where: {
                        username
                    }
                });
                if (existingUsername) {
                    res.status(409).json({ message: 'Username already taken' });
                    return;
                }
                const saltRounds = 12;
                const salt = yield bcryptjs_1.default.genSalt(saltRounds);
                const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
                const securityId = (0, uuid_1.v4)();
                const newUser = yield prismadb_1.default.user.create({
                    data: {
                        email,
                        username,
                        password: hashedPassword,
                        fullName: fullName || "",
                        securityId,
                        failedLoginAttempts: 0,
                        lastLogin: new Date(),
                    },
                });
                const token = jsonwebtoken_1.default.sign({
                    id: newUser.id,
                    email: newUser.email,
                    securityId: securityId
                }, process.env.JWT_SECRET, { expiresIn: '1h' });
                const refreshToken = jsonwebtoken_1.default.sign({ id: newUser.id, securityId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
                const hashedRefreshToken = yield bcryptjs_1.default.hash(refreshToken, 10);
                yield prismadb_1.default.user.update({
                    where: {
                        email
                    },
                    data: {
                        refreshToken: hashedRefreshToken
                    }
                });
                res.status(201).json({
                    message: 'User registered successfully',
                    token,
                    refreshToken,
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        username: newUser.username
                    }
                });
            }
            catch (error) {
                console.error('Signup error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
    signin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({ errors: errors.array() });
                    return;
                }
                const { email, password } = req.body;
                const user = yield prismadb_1.default.user.findUnique({
                    where: {
                        email
                    }
                });
                if (!user) {
                    res.status(401).json({ message: 'Invalid credentials' });
                    return;
                }
                if (user.accountLocked && user.lockExpiresAt && user.lockExpiresAt > new Date()) {
                    res.status(403).json({
                        message: 'Account temporarily locked. Try again later.'
                    });
                    return;
                }
                const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
                    if (failedAttempts >= 5) {
                        const lockExpiry = new Date();
                        lockExpiry.setMinutes(lockExpiry.getMinutes() + 30);
                        yield prismadb_1.default.user.update({
                            where: {
                                email
                            },
                            data: {
                                failedLoginAttempts: failedAttempts,
                                accountLocked: true,
                                lockExpiresAt: lockExpiry
                            }
                        });
                        res.status(403).json({
                            message: 'Too many failed attempts. Account locked for 30 minutes.'
                        });
                        return;
                    }
                    yield prismadb_1.default.user.update({
                        where: {
                            email,
                        },
                        data: { failedLoginAttempts: failedAttempts },
                    });
                    res.status(401).json({ message: 'Invalid credentials' });
                    return;
                }
                yield prismadb_1.default.user.update({
                    where: {
                        email,
                    },
                    data: {
                        failedLoginAttempts: 0,
                        accountLocked: false,
                        lastLogin: new Date(),
                    },
                });
                const securityId = (0, uuid_1.v4)();
                yield prismadb_1.default.user.update({
                    where: { email },
                    data: { securityId },
                });
                const token = jsonwebtoken_1.default.sign({
                    id: user.id,
                    email: user.email,
                    securityId
                }, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn: '1h' });
                const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, securityId }, process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret', { expiresIn: '7d' });
                const hashedRefreshToken = yield bcryptjs_1.default.hash(refreshToken, 10);
                yield prismadb_1.default.user.update({
                    where: { email },
                    data: { refreshToken: hashedRefreshToken },
                });
                res.status(200).json({
                    message: 'Login successful',
                    token,
                    refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username
                    }
                });
            }
            catch (error) {
                console.error('Signin error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
    googleAuth(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { idToken } = req.body;
                if (!idToken) {
                    res.status(400).json({ message: 'Google ID token is required' });
                    return;
                }
                const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
                const ticket = yield client.verifyIdToken({
                    idToken,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                const payload = ticket.getPayload();
                if (!payload) {
                    res.status(400).json({ message: 'Invalid Google token payload' });
                    return;
                }
                const { email, name, sub: googleId, picture } = payload;
                let user = yield prismadb_1.default.user.findUnique({
                    where: { email }
                });
                const securityId = (0, uuid_1.v4)();
                if (!user) {
                    const randomPassword = Math.random().toString(36).slice(-10);
                    const hashedPassword = yield bcryptjs_1.default.hash(randomPassword, 12);
                    if (!email) {
                        res
                            .status(400)
                            .json({
                            message: "Email is required for Google authentication",
                        });
                        return;
                    }
                    const suggestedUsername = email.split('@')[0];
                    const existingUsername = yield prismadb_1.default.user.findUnique({
                        where: { username: suggestedUsername }
                    });
                    const username = existingUsername
                        ? `${suggestedUsername}${Math.random().toString(36).slice(-4)}`
                        : suggestedUsername;
                    user = yield prismadb_1.default.user.create({
                        data: {
                            email,
                            username,
                            password: hashedPassword,
                            fullName: name || "",
                            avatar: picture,
                            securityId,
                            failedLoginAttempts: 0,
                            lastLogin: new Date(),
                        }
                    });
                }
                else {
                    user = yield prismadb_1.default.user.update({
                        where: { email },
                        data: {
                            securityId,
                            lastLogin: new Date(),
                            failedLoginAttempts: 0,
                            accountLocked: false
                        }
                    });
                }
                const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, securityId }, process.env.JWT_SECRET, { expiresIn: '1h' });
                const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, securityId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
                const hashedRefreshToken = yield bcryptjs_1.default.hash(refreshToken, 10);
                yield prismadb_1.default.user.update({
                    where: { email },
                    data: { refreshToken: hashedRefreshToken }
                });
                res.status(200).json({
                    message: 'Google authentication successful',
                    token,
                    refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username
                    }
                });
            }
            catch (error) {
                console.error('Google auth error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
}
exports.default = new AuthController();
