import { Request, Response } from "express";
import prisma from "../databases/prismadb"
import bcrypt from "bcryptjs"

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    }
}

class UserController {

    public async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = (req.query.id as string) || req.user?.id;

            if (!userId) {
                res.status(401).json({ success: false, message: 'User not authenticated or ID not provided' });
                return;
            }

           const userProfile = await prisma.user.findUnique({
                where : {
                    id : userId
                }
            })

            if(!userProfile){
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
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    public async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {

           const userId = (req.query.id as string) || req.user?.id;

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
            
            const { id, email, password, createdAt, updatedAt, ...allowedUpdates } = updateData;

            if(updateData.failedLoginAttempts >= 5 && updateData.accountLocked){
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
            
            const updatedUser = await prisma.user.update({
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
        } catch (error) {
            console.error('Error updating user profile:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Admin functions

    public async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }

            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { admin: true }
            });

            if (!currentUser || !currentUser.admin) {
                res.status(403).json({ success: false, message: 'Not authorized' });
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const users = await prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            });

            const total = await prisma.user.count();

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
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }

            const currentUser = await prisma.user.findUnique({
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
            const existingUser = await prisma.user.findFirst({
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

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await prisma.user.create({
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
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Admin check
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }

            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { admin: true }
            });

            if (!currentUser || !currentUser.admin) {
                res.status(403).json({ success: false, message: 'Not authorized' });
                return;
            }

            const userId = req.params.id as string;

            if (!userId) {
                res.status(400).json({ success: false, message: 'User ID is required' });
                return;
            }

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            await prisma.user.delete({
                where: { id: userId }
            });

            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async toggleAdminStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }

            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { admin: true }
            });

            if (!currentUser || !currentUser.admin) {
                res.status(403).json({ success: false, message: 'Not authorized' });
                return;
            }

            const userId = req.params.id as string;
            const { admin } = req.body;

            if (!userId || admin === undefined) {
                res.status(400).json({ success: false, message: 'User ID and admin status are required' });
                return;
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { admin }
            });

            res.status(200).json({
                success: true,
                message: 'User admin status updated successfully',
                data: updatedUser
            });
        } catch (error) {
            console.error('Error updating admin status:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async toggleAccountLock(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Admin check
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }

            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { admin: true }
            });

            if (!currentUser || !currentUser.admin) {
                res.status(403).json({ success: false, message: 'Not authorized' });
                return;
            }

            const userId = req.params.id as string;
            const { locked, lockDuration } = req.body;

            if (!userId) {
                res.status(400).json({ success: false, message: 'User ID is required' });
                return;
            }

            let lockExpiresAt = null;
            if (locked && lockDuration) {
                lockExpiresAt = new Date(Date.now() + lockDuration * 60 * 1000); 
            }

            const updatedUser = await prisma.user.update({
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
        } catch (error) {
            console.error('Error toggling account lock:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }

            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { admin: true }
            });

            if (!currentUser || !currentUser.admin) {
                res.status(403).json({ success: false, message: 'Not authorized' });
                return;
            }

            const totalUsers = await prisma.user.count();
            const lockedAccounts = await prisma.user.count({
                where: { accountLocked: true }
            });
            const adminUsers = await prisma.user.count({
                where: { admin: true }
            });
            
            const newUsersThisMonth = await prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setDate(1))
                    }
                }
            });

            const totalCertificates = await prisma.certificate.count();

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
        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Check if admin or the user themself
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }

            const userId = req.params.id as string;
            const { newPassword } = req.body;

            if (!userId || !newPassword) {
                res.status(400).json({ success: false, message: 'User ID and new password are required' });
                return;
            }

            // Only allow admin or the user themself to reset password
            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { admin: true }
            });

            if (userId !== req.user.id && (!currentUser || !currentUser.admin)) {
                res.status(403).json({ success: false, message: 'Not authorized' });
                return;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

             await prisma.user.update({
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
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }

            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { admin: true }
            });

            if (!currentUser || !currentUser.admin) {
                res.status(403).json({ success: false, message: 'Not authorized' });
                return;
            }

            const { query, isLocked, isAdmin } = req.query;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const whereClause: any = {};
            
            if (query) {
                whereClause.OR = [
                    { email: { contains: query as string, mode: 'insensitive' } },
                    { username: { contains: query as string, mode: 'insensitive' } },
                    { fullName: { contains: query as string, mode: 'insensitive' } },
                    { securityId: { contains: query as string, mode: 'insensitive' } }
                ];
            }
            
            if (isLocked !== undefined) {
                whereClause.accountLocked = isLocked === 'true';
            }
            
            if (isAdmin !== undefined) {
                whereClause.admin = isAdmin === 'true';
            }

            const users = await prisma.user.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            });

            const total = await prisma.user.count({ where: whereClause });

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
        } catch (error) {
            console.error('Error searching users:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async exportUserData(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.params.id as string;
            
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }

            if (userId !== req.user.id) {
                const currentUser = await prisma.user.findUnique({
                    where: { id: req.user.id },
                    select: { admin: true }
                });

                if (!currentUser || !currentUser.admin) {
                    res.status(403).json({ success: false, message: 'Not authorized' });
                    return;
                }
            }

            const userData = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    certificates: true,
                }
            });

            if (!userData) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            const { password, ...userDataToExport } = userData as any;

            res.status(200).json({
                success: true,
                data: userDataToExport
            });
        } catch (error) {
            console.error('Error exporting user data:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

export default new UserController();