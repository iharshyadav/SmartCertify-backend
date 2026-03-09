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
class CertificateController {
    uploadCertificate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.cookies.jwt;
                if (!token) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;
                const { name, issueDate, imageUrl } = req.body;
                if (!name || !issueDate || !imageUrl) {
                    res.status(400).json({ success: false, message: 'Missing required fields' });
                    return;
                }
                const cert = yield prismadb_1.default.certificate.create({
                    data: {
                        name,
                        issueDate: new Date(issueDate),
                        imageUrl,
                        userId
                    }
                });
                res.status(201).json({ success: true, data: cert });
            }
            catch (error) {
                console.error('Error uploading certificate:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    getUserCertificates(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.cookies.jwt;
                if (!token) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;
                const certificates = yield prismadb_1.default.certificate.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                });
                // Count total certificates for the user
                const total = yield prismadb_1.default.certificate.count({ where: { userId } });
                res.status(200).json({
                    success: true,
                    data: certificates,
                    meta: { total }
                });
            }
            catch (error) {
                console.error('Error fetching certificates:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    }
    getDashboardStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.cookies.jwt;
                if (!token) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;
                // In a real app, these would come from complex aggregations and tables like VerificationLogs.
                // For now, we mock some using real counts.
                const totalCerts = yield prismadb_1.default.certificate.count({ where: { userId } });
                // To make the dashboard look dynamic but alive, we generate some plausible stats based on the certs uploaded
                res.status(200).json({
                    success: true,
                    data: {
                        totalCertificates: totalCerts,
                        activeStudents: Math.max(0, totalCerts * 3), // mock
                        verifiedToday: Math.floor(totalCerts * 0.1), // mock
                        successRate: totalCerts > 0 ? 98.7 : 0, // mock
                        pendingReviews: Math.floor(totalCerts * 0.05), // mock
                        failedVerifications: Math.floor(totalCerts * 0.01) // mock
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
