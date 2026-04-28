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
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismadb_1 = __importDefault(require("../databases/prismadb"));
const uploadFile_1 = require("./uploadFile");
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_API_KEY = process.env.ML_API_KEY || "smartcertify-dev-key";
const mlClient = axios_1.default.create({
    baseURL: `${ML_SERVICE_URL}/api/ml`,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
        "X-API-Key": ML_API_KEY,
    },
});
function getUserIdFromToken(req) {
    var _a, _b;
    const cookieToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.certify_token) || ((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.jwt);
    const authHeader = req.headers.authorization;
    const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
    const token = cookieToken || bearerToken;
    if (!token || !process.env.JWT_SECRET)
        return null;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return decoded.id;
    }
    catch (_c) {
        return null;
    }
}
function saveAICertificateRecord(params) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const now = new Date();
        yield prismadb_1.default.certificate.create({
            data: {
                name: params.name,
                imageUrl: params.imageUrl,
                cloudinaryId: (_a = params.cloudinaryId) !== null && _a !== void 0 ? _a : null,
                userId: params.userId,
                issueDate: now,
                createdAt: now,
            },
        });
    });
}
class MLController {
    verifyCertificate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const response = yield mlClient.post("/verify", req.body);
                const userId = getUserIdFromToken(req);
                if (userId) {
                    const fallbackName = "AI Fraud Detection Result";
                    const certName = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.course_name) === "string" && req.body.course_name.trim()
                        ? `Fraud Check - ${req.body.course_name.trim()}`
                        : fallbackName;
                    const dataUrl = "https://smartcertify.ai/fraud-detection";
                    yield saveAICertificateRecord({
                        userId,
                        name: certName,
                        imageUrl: dataUrl,
                    });
                }
                res.status(200).json({ success: true, data: response.data });
            }
            catch (error) {
                console.error("ML verify error:", ((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
                res.status(((_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.status) || 502).json({
                    success: false,
                    message: ((_e = (_d = error === null || error === void 0 ? void 0 : error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.detail) || "ML service unavailable",
                });
            }
        });
    }
    checkSimilarity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const response = yield mlClient.post("/similarity", req.body);
                res.status(200).json({ success: true, data: response.data });
            }
            catch (error) {
                console.error("ML similarity error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                res.status(((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.status) || 502).json({
                    success: false,
                    message: ((_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.detail) || "ML service unavailable",
                });
            }
        });
    }
    getTrustScore(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const response = yield mlClient.post("/trust-score", req.body);
                res.status(200).json({ success: true, data: response.data });
            }
            catch (error) {
                console.error("ML trust score error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                res.status(((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.status) || 502).json({
                    success: false,
                    message: ((_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.detail) || "ML service unavailable",
                });
            }
        });
    }
    analyzeImage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                const response = yield mlClient.post("/analyze-image", req.body);
                const userId = getUserIdFromToken(req);
                if (userId && typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.image_base64) === "string" && req.body.image_base64.length > 0) {
                    const imageBuffer = Buffer.from(req.body.image_base64, "base64");
                    const { secure_url, public_id } = yield (0, uploadFile_1.uploadBufferToCloudinary)(imageBuffer, "smartcertify/ai-analysis");
                    const fileName = typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.certificate_id) === "string" && req.body.certificate_id.trim()
                        ? req.body.certificate_id.trim()
                        : "Image";
                    yield saveAICertificateRecord({
                        userId,
                        name: `Image Analysis - ${fileName}`,
                        imageUrl: secure_url,
                        cloudinaryId: public_id,
                    });
                }
                res.status(200).json({ success: true, data: response.data });
            }
            catch (error) {
                console.error("ML image analysis error:", ((_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
                res.status(((_d = error === null || error === void 0 ? void 0 : error.response) === null || _d === void 0 ? void 0 : _d.status) || 502).json({
                    success: false,
                    message: ((_f = (_e = error === null || error === void 0 ? void 0 : error.response) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.detail) || "ML service unavailable",
                });
            }
        });
    }
    detectAnomaly(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const response = yield mlClient.post("/anomaly", req.body);
                res.status(200).json({ success: true, data: response.data });
            }
            catch (error) {
                console.error("ML anomaly error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                res.status(((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.status) || 502).json({
                    success: false,
                    message: ((_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.detail) || "ML service unavailable",
                });
            }
        });
    }
    getRecommendations(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const response = yield mlClient.post("/recommend", req.body);
                res.status(200).json({ success: true, data: response.data });
            }
            catch (error) {
                console.error("ML recommendations error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                res.status(((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.status) || 502).json({
                    success: false,
                    message: ((_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.detail) || "ML service unavailable",
                });
            }
        });
    }
    chatbot(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const response = yield mlClient.post("/chat", req.body);
                res.status(200).json({ success: true, data: response.data });
            }
            catch (error) {
                console.error("ML chatbot error:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                res.status(((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.status) || 502).json({
                    success: false,
                    message: ((_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.detail) || "ML service unavailable",
                });
            }
        });
    }
    getHealth(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${ML_SERVICE_URL}/health`, { timeout: 10000 });
                res.status(200).json({ success: true, data: response.data });
            }
            catch (error) {
                res.status(503).json({
                    success: false,
                    message: "ML service is not responding",
                    status: "offline",
                });
            }
        });
    }
}
exports.default = new MLController();
