"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ml_controller_1 = __importDefault(require("../controllers/ml-controller"));
const router = (0, express_1.Router)();
router.post("/verify", ml_controller_1.default.verifyCertificate);
router.post("/similarity", ml_controller_1.default.checkSimilarity);
router.post("/trust-score", ml_controller_1.default.getTrustScore);
router.post("/analyze-image", ml_controller_1.default.analyzeImage);
router.post("/anomaly", ml_controller_1.default.detectAnomaly);
router.post("/recommend", ml_controller_1.default.getRecommendations);
router.post("/chat", ml_controller_1.default.chatbot);
router.get("/health", ml_controller_1.default.getHealth);
exports.default = router;
