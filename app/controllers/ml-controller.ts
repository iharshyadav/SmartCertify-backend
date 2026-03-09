import { Request, Response } from "express";
import axios from "axios";

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

class MLController {

    public async verifyCertificate(req: Request, res: Response): Promise<void> {
        try {
            const response = await mlClient.post("/verify", req.body);
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
