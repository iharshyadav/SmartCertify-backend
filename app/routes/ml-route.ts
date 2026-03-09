import { Router } from "express";
import mlController from "../controllers/ml-controller";

const router = Router();

router.post("/verify", mlController.verifyCertificate);
router.post("/similarity", mlController.checkSimilarity);
router.post("/trust-score", mlController.getTrustScore);
router.post("/analyze-image", mlController.analyzeImage);
router.post("/anomaly", mlController.detectAnomaly);
router.post("/recommend", mlController.getRecommendations);
router.post("/chat", mlController.chatbot);
router.get("/health", mlController.getHealth);

export default router;
