"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificate_controller_1 = __importDefault(require("../controllers/certificate-controller"));
const multer_1 = require("../middlewares/multer");
const router = (0, express_1.Router)();
router.post("/upload", multer_1.upload.single('file'), certificate_controller_1.default.uploadCertificate);
router.get("/list", certificate_controller_1.default.getUserCertificates);
router.get("/stats", certificate_controller_1.default.getDashboardStats);
exports.default = router;
