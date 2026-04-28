"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificate_controller_1 = __importDefault(require("../controllers/certificate-controller"));
const uploadFile_1 = __importDefault(require("../controllers/uploadFile"));
const multer_1 = require("../middlewares/multer");
const router = (0, express_1.Router)();
router.post("/upload-file", multer_1.upload.single("file"), uploadFile_1.default.singleUpload);
router.post("/upload", certificate_controller_1.default.uploadCertificate);
router.post("/upload-with-file", multer_1.upload.single("file"), certificate_controller_1.default.uploadCertificate);
router.get("/list", certificate_controller_1.default.getUserCertificates);
router.get("/all", certificate_controller_1.default.getAllUserCertificates);
router.get("/search", certificate_controller_1.default.searchCertificates);
router.get("/stats", certificate_controller_1.default.getDashboardStats);
router.delete("/:id", certificate_controller_1.default.deleteCertificate);
exports.default = router;
