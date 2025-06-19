import { Request, Response } from "express";
import prisma from "../databases/prismadb"

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
}

export default new UserController();