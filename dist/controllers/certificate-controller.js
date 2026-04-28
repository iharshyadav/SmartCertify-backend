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
const prismadb_1 = __importDefault(require("../databases/prismadb"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinary_1 = require("cloudinary");
const uploadFile_1 = require("./uploadFile");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
function getUserIdFromToken(req) {
    var _a, _b;
    const cookieToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.certify_token) || ((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.jwt);
    const authHeader = req.headers.authorization;
    const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
    const token = cookieToken || bearerToken;
    if (!token)
        return null;
    if (!process.env.JWT_SECRET)
        return null;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return decoded.id;
    }
    catch (_c) {
        return null;
    }
}
class CertificateController {
    constructor() {
        this.uploadCertificate = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = getUserIdFromToken(req);
                if (!userId) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
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
                let resolvedImageUrl = typeof imageUrl === "string" ? imageUrl : null;
                let resolvedCloudinaryId = typeof cloudinaryId === "string" ? cloudinaryId : null;
                // Supports a single multipart request (file + metadata), which keeps
                // Cloudinary upload and DB persistence in one backend flow.
                if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.buffer) {
                    const uploaded = yield (0, uploadFile_1.uploadBufferToCloudinary)(req.file.buffer);
                    resolvedImageUrl = uploaded.secure_url;
                    resolvedCloudinaryId = uploaded.public_id;
                }
                if (!resolvedImageUrl) {
                    res.status(400).json({ success: false, message: 'Missing certificate file or imageUrl' });
                    return;
                }
                const cert = yield prismadb_1.default.certificate.create({
                    data: {
                        name,
                        issueDate: parsedIssueDate,
                        imageUrl: resolvedImageUrl,
                        cloudinaryId: resolvedCloudinaryId,
                        userId,
                    }
                });
                res.status(201).json({ success: true, data: cert });
            }
            catch (error) {
                console.error('Error uploading certificate:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
        // Recent (last 10) — for dashboard
        this.getUserCertificates = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = getUserIdFromToken(req);
                if (!userId) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const certificates = yield prismadb_1.default.certificate.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                });
                const total = yield prismadb_1.default.certificate.count({ where: { userId } });
                res.status(200).json({ success: true, data: certificates, meta: { total } });
            }
            catch (error) {
                console.error('Error fetching certificates:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
        // All certificates — for history page
        this.getAllUserCertificates = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = getUserIdFromToken(req);
                if (!userId) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const certificates = yield prismadb_1.default.certificate.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' }
                });
                const total = yield prismadb_1.default.certificate.count({ where: { userId } });
                res.status(200).json({ success: true, data: certificates, meta: { total } });
            }
            catch (error) {
                console.error('Error fetching all certificates:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
        // Search certificates by name
        this.searchCertificates = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = getUserIdFromToken(req);
                if (!userId) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const q = req.query.q || "";
                const certificates = yield prismadb_1.default.certificate.findMany({
                    where: {
                        userId,
                        name: { contains: q, mode: 'insensitive' }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                });
                res.status(200).json({ success: true, data: certificates });
            }
            catch (error) {
                console.error('Error searching certificates:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
        // Delete a certificate — also removes from Cloudinary
        this.deleteCertificate = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = getUserIdFromToken(req);
                if (!userId) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const { id } = req.params;
                const cert = yield prismadb_1.default.certificate.findFirst({ where: { id, userId } });
                if (!cert) {
                    res.status(404).json({ success: false, message: 'Certificate not found' });
                    return;
                }
                // Delete from Cloudinary if we have the public_id
                if (cert.cloudinaryId) {
                    try {
                        yield cloudinary_1.v2.uploader.destroy(cert.cloudinaryId, { resource_type: "image" });
                    }
                    catch (cloudErr) {
                        console.warn("Cloudinary deletion warning:", cloudErr);
                        // Don't block DB deletion on Cloudinary failure
                    }
                }
                yield prismadb_1.default.certificate.delete({ where: { id } });
                res.status(200).json({ success: true });
            }
            catch (error) {
                console.error('Error deleting certificate:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
        this.getDashboardStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = getUserIdFromToken(req);
                if (!userId) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const totalCerts = yield prismadb_1.default.certificate.count({ where: { userId } });
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const verifiedToday = yield prismadb_1.default.certificate.count({
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
            }
            catch (error) {
                console.error('Error fetching stats:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
}
exports.default = new CertificateController();
