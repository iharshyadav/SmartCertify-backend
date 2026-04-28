import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import prisma from "../databases/prismadb";
import { uploadBufferToCloudinary } from "./uploadFile";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_API_KEY = process.env.ML_API_KEY || "smartcertify-dev-key";

const mlClient = axios.create({
    baseURL: `${ML_SERVICE_URL}/api/ml`,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
        "X-API-Key": ML_API_KEY,
    },
});

function getUserIdFromToken(req: Request): string | null {
    const cookieToken = req.cookies?.certify_token || req.cookies?.jwt;
    const authHeader = req.headers.authorization;
    const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
    const token = cookieToken || bearerToken;
    if (!token || !process.env.JWT_SECRET) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        return decoded.id;
    } catch {
        return null;
    }
}

async function saveAICertificateRecord(params: {
    userId: string;
    name: string;
    imageUrl: string;
    cloudinaryId?: string | null;
}): Promise<void> {
    const now = new Date();
    await prisma.certificate.create({
        data: {
            name: params.name,
            imageUrl: params.imageUrl,
            cloudinaryId: params.cloudinaryId ?? null,
            userId: params.userId,
            issueDate: now,
            createdAt: now,
        },
    });
}

class MLController {

    public async verifyCertificate(req: Request, res: Response): Promise<void> {
        try {
            const response = await mlClient.post("/verify", req.body);
            const userId = getUserIdFromToken(req);
            if (userId) {
                const fallbackName = "AI Fraud Detection Result";
                const certName = typeof req.body?.course_name === "string" && req.body.course_name.trim()
                    ? `Fraud Check - ${req.body.course_name.trim()}`
                    : fallbackName;
                const dataUrl = "https://smartcertify.ai/fraud-detection";
                await saveAICertificateRecord({
                    userId,
                    name: certName,
                    imageUrl: dataUrl,
                });
            }
            res.status(200).json({ success: true, data: response.data });
        } catch (error: any) {
            console.error("ML verify error:", error?.response?.data || error.message);
            res.status(error?.response?.status || 502).json({
                success: false,
                message: error?.response?.data?.detail || "ML service unavailable",
            });
        }
    }

    public async checkSimilarity(req: Request, res: Response): Promise<void> {
        try {
            const response = await mlClient.post("/similarity", req.body);
            res.status(200).json({ success: true, data: response.data });
        } catch (error: any) {
            console.error("ML similarity error:", error?.response?.data || error.message);
            res.status(error?.response?.status || 502).json({
                success: false,
                message: error?.response?.data?.detail || "ML service unavailable",
            });
        }
    }

    public async getTrustScore(req: Request, res: Response): Promise<void> {
        try {
            const response = await mlClient.post("/trust-score", req.body);
            res.status(200).json({ success: true, data: response.data });
        } catch (error: any) {
            console.error("ML trust score error:", error?.response?.data || error.message);
            res.status(error?.response?.status || 502).json({
                success: false,
                message: error?.response?.data?.detail || "ML service unavailable",
            });
        }
    }

    public async analyzeImage(req: Request, res: Response): Promise<void> {
        try {
            const response = await mlClient.post("/analyze-image", req.body);
            const userId = getUserIdFromToken(req);
            if (userId && typeof req.body?.image_base64 === "string" && req.body.image_base64.length > 0) {
                const imageBuffer = Buffer.from(req.body.image_base64, "base64");
                const { secure_url, public_id } = await uploadBufferToCloudinary(imageBuffer, "smartcertify/ai-analysis");
                const fileName = typeof req.body?.certificate_id === "string" && req.body.certificate_id.trim()
                    ? req.body.certificate_id.trim()
                    : "Image";
                await saveAICertificateRecord({
                    userId,
                    name: `Image Analysis - ${fileName}`,
                    imageUrl: secure_url,
                    cloudinaryId: public_id,
                });
            }
            res.status(200).json({ success: true, data: response.data });
        } catch (error: any) {
            console.error("ML image analysis error:", error?.response?.data || error.message);
            res.status(error?.response?.status || 502).json({
                success: false,
                message: error?.response?.data?.detail || "ML service unavailable",
            });
        }
    }

    public async detectAnomaly(req: Request, res: Response): Promise<void> {
        try {
            const response = await mlClient.post("/anomaly", req.body);
            res.status(200).json({ success: true, data: response.data });
        } catch (error: any) {
            console.error("ML anomaly error:", error?.response?.data || error.message);
            res.status(error?.response?.status || 502).json({
                success: false,
                message: error?.response?.data?.detail || "ML service unavailable",
            });
        }
    }

    public async getRecommendations(req: Request, res: Response): Promise<void> {
        try {
            const response = await mlClient.post("/recommend", req.body);
            res.status(200).json({ success: true, data: response.data });
        } catch (error: any) {
            console.error("ML recommendations error:", error?.response?.data || error.message);
            res.status(error?.response?.status || 502).json({
                success: false,
                message: error?.response?.data?.detail || "ML service unavailable",
            });
        }
    }

    public async chatbot(req: Request, res: Response): Promise<void> {
        try {
            const response = await mlClient.post("/chat", req.body);
            res.status(200).json({ success: true, data: response.data });
        } catch (error: any) {
            console.error("ML chatbot error:", error?.response?.data || error.message);
            res.status(error?.response?.status || 502).json({
                success: false,
                message: error?.response?.data?.detail || "ML service unavailable",
            });
        }
    }

    public async getHealth(req: Request, res: Response): Promise<void> {
        try {
            const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 10000 });
            res.status(200).json({ success: true, data: response.data });
        } catch (error: any) {
            res.status(503).json({
                success: false,
                message: "ML service is not responding",
                status: "offline",
            });
        }
    }
}

export default new MLController();
