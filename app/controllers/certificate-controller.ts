import prisma from "../databases/prismadb";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { uploadBufferToCloudinary } from "./uploadFile";

type Response = any;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type AuthenticatedRequest = {
    user?: { id: string };
    file?: any;
    [key: string]: any;
};

function getUserIdFromToken(req: AuthenticatedRequest): string | null {
    const cookieToken = req.cookies?.certify_token || req.cookies?.jwt;
    const authHeader = req.headers.authorization;
    const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
    const token = cookieToken || bearerToken;
    if (!token) return null;
    if (!process.env.JWT_SECRET) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        return decoded.id;
    } catch {
        return null;
    }
}

class CertificateController {

    public uploadCertificate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = getUserIdFromToken(req);
            if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

            const { name, issueDate, imageUrl, cloudinaryId } = req.body;
            if (!name || !issueDate) {
                res.status(400).json({ success: false, message: 'Missing required fields: name, issueDate' });
                return;
            }
            const parsedIssueDate = new Date(issueDate);
            if (Number.isNaN(parsedIssueDate.getTime())) {
                res.status(400).json({ success: false, message: 'Invalid issueDate format' });
                return;
            }

            let resolvedImageUrl: string | null = typeof imageUrl === "string" ? imageUrl : null;
            let resolvedCloudinaryId: string | null = typeof cloudinaryId === "string" ? cloudinaryId : null;

            // Supports a single multipart request (file + metadata), which keeps
            // Cloudinary upload and DB persistence in one backend flow.
            if (req.file?.buffer) {
                const uploaded = await uploadBufferToCloudinary(req.file.buffer);
                resolvedImageUrl = uploaded.secure_url;
                resolvedCloudinaryId = uploaded.public_id;
            }

            if (!resolvedImageUrl) {
                res.status(400).json({ success: false, message: 'Missing certificate file or imageUrl' });
                return;
            }

            const cert = await prisma.certificate.create({
                data: {
                    name,
                    issueDate: parsedIssueDate,
                    imageUrl: resolvedImageUrl,
                    cloudinaryId: resolvedCloudinaryId,
                    userId,
                }
            });

            res.status(201).json({ success: true, data: cert });
        } catch (error) {
            console.error('Error uploading certificate:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // Recent (last 10) — for dashboard
    public getUserCertificates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = getUserIdFromToken(req);
            if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

            const certificates = await prisma.certificate.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            const total = await prisma.certificate.count({ where: { userId } });

            res.status(200).json({ success: true, data: certificates, meta: { total } });
        } catch (error) {
            console.error('Error fetching certificates:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // All certificates — for history page
    public getAllUserCertificates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = getUserIdFromToken(req);
            if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

            const certificates = await prisma.certificate.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            const total = await prisma.certificate.count({ where: { userId } });

            res.status(200).json({ success: true, data: certificates, meta: { total } });
        } catch (error) {
            console.error('Error fetching all certificates:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // Search certificates by name
    public searchCertificates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = getUserIdFromToken(req);
            if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

            const q = req.query.q as string || "";
            const certificates = await prisma.certificate.findMany({
                where: {
                    userId,
                    name: { contains: q, mode: 'insensitive' }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            res.status(200).json({ success: true, data: certificates });
        } catch (error) {
            console.error('Error searching certificates:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // Delete a certificate — also removes from Cloudinary
    public deleteCertificate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = getUserIdFromToken(req);
            if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

            const { id } = req.params;

            const cert = await prisma.certificate.findFirst({ where: { id, userId } });
            if (!cert) { res.status(404).json({ success: false, message: 'Certificate not found' }); return; }

            // Delete from Cloudinary if we have the public_id
            if (cert.cloudinaryId) {
                try {
                    await cloudinary.uploader.destroy(cert.cloudinaryId, { resource_type: "image" });
                } catch (cloudErr) {
                    console.warn("Cloudinary deletion warning:", cloudErr);
                    // Don't block DB deletion on Cloudinary failure
                }
            }

            await prisma.certificate.delete({ where: { id } });
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error deleting certificate:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = getUserIdFromToken(req);
            if (!userId) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

            const totalCerts = await prisma.certificate.count({ where: { userId } });

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const verifiedToday = await prisma.certificate.count({
                where: { userId, createdAt: { gte: todayStart } }
            });

            res.status(200).json({
                success: true,
                data: {
                    totalCertificates: totalCerts,
                    activeStudents: totalCerts,
                    verifiedToday,
                    successRate: totalCerts > 0 ? 98.7 : 0,
                    pendingReviews: 0,
                    failedVerifications: 0
                }
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

export default new CertificateController();
