import { Router } from "express";
import certificateController from "../controllers/certificate-controller";
import { upload } from "../middlewares/multer";

const router = Router();

router.post("/upload", upload.single('file'), certificateController.uploadCertificate);
router.get("/list", certificateController.getUserCertificates);
router.get("/stats", certificateController.getDashboardStats);

export default router;
