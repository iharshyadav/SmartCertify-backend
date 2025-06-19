import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import prisma from "../databases/prismadb"
import {OAuth2Client} from "google-auth-library"

class AuthController {
    public validateSignup = [
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
            .withMessage('Password must include uppercase, lowercase, number and special character'),
        body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    ];

    public validateSignin = [
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password').notEmpty().withMessage('Password is required')
    ];

    public async signup(req: Request, res: Response): Promise<void> {
        try {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password, username, fullName } = req.body;
            
            const existingUser = await prisma.user.findUnique({
                where : {
                    email
                }
            });

            if (existingUser) {
                res.status(409).json({ message: 'Email already in use' });
                return;
            }

            const existingUsername = await prisma.user.findUnique({
                where : {
                    username
                }
            });
            if (existingUsername) {
                res.status(409).json({ message: 'Username already taken' });
                return;
            }
            
            const saltRounds = 12;
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            const securityId = uuidv4();

            const newUser = await prisma.user.create({
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
            
            const token = jwt.sign(
                { 
                    id: newUser.id, 
                    email: newUser.email,
                    securityId: securityId
                },
                process.env.JWT_SECRET!,
                { expiresIn: '1h' }
            );
            
            const refreshToken = jwt.sign(
                { id: newUser.id, securityId },
                process.env.REFRESH_TOKEN_SECRET!,
                { expiresIn: '7d' }
            );
            
            const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
            await prisma.user.update({
                where : {
                    email
                },
                data : {
                    refreshToken : hashedRefreshToken
                }
            })
            
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
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    public async signin(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password } = req.body;
            
            const user = await prisma.user.findUnique({
                where : {
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
            
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                const failedAttempts = (user.failedLoginAttempts || 0) + 1;
                
                if (failedAttempts >= 5) {
                    const lockExpiry = new Date();
                    lockExpiry.setMinutes(lockExpiry.getMinutes() + 30);
                    
                    await prisma.user.update({
                        where : {
                            email
                        },
                        data : {
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
                
                await prisma.user.update({
                  where: {
                    email,
                  },
                  data: { failedLoginAttempts: failedAttempts },
                });
                res.status(401).json({ message: 'Invalid credentials' });
                return;
            }
            
            await prisma.user.update({
              where: {
                email,
              },
              data: {
                failedLoginAttempts: 0,
                accountLocked: false,
                lastLogin: new Date(),
              },
            });
            
            const securityId = uuidv4();
            await prisma.user.update({
              where: { email },
              data: { securityId },
            });
            
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email,
                    securityId
                },
                process.env.JWT_SECRET || 'default_jwt_secret',
                { expiresIn: '1h' }
            );
            
            const refreshToken = jwt.sign(
                { id: user.id, securityId },
                process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret',
                { expiresIn: '7d' }
            );
            
            const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
            await prisma.user.update({
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
        } catch (error) {
            console.error('Signin error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    public async googleAuth(req: Request, res: Response): Promise<void> {
        try {
            const { idToken } = req.body;
            
            if (!idToken) {
                res.status(400).json({ message: 'Google ID token is required' });
                return;
            }

            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            
            const payload = ticket.getPayload();

            if (!payload) {
                res.status(400).json({ message: 'Invalid Google token payload' });
                return;
            }
            const { email, name, sub: googleId, picture } = payload;
            
            let user = await prisma.user.findUnique({
                where: { email }
            });
            
            const securityId = uuidv4();
            
            if (!user) {
                const randomPassword = Math.random().toString(36).slice(-10);
                const hashedPassword = await bcrypt.hash(randomPassword, 12);

                  if (!email) {
                    res
                      .status(400)
                      .json({
                        message: "Email is required for Google authentication",
                      });
                    return;
                  }
                
                const suggestedUsername =email.split('@')[0];
                const existingUsername = await prisma.user.findUnique({
                    where: { username: suggestedUsername }
                });
                
                const username = existingUsername 
                    ? `${suggestedUsername}${Math.random().toString(36).slice(-4)}`
                    : suggestedUsername;
                
                user = await prisma.user.create({
                    data: {
                        email,
                        username,
                        password: hashedPassword,
                        fullName: name || "",
                        avatar : picture,
                        securityId,
                        failedLoginAttempts: 0,
                        lastLogin: new Date(),
                    }
                });
            } else {
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        securityId,
                        lastLogin: new Date(),
                        failedLoginAttempts: 0,
                        accountLocked: false
                    }
                });
            }
            
            const token = jwt.sign(
                { id: user.id, email: user.email, securityId },
                process.env.JWT_SECRET!,
                { expiresIn: '1h' }
            );
            
            const refreshToken = jwt.sign(
                { id: user.id, securityId },
                process.env.REFRESH_TOKEN_SECRET!,
                { expiresIn: '7d' }
            );
            
            const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
            await prisma.user.update({
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
        } catch (error) {
            console.error('Google auth error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

export default new AuthController();