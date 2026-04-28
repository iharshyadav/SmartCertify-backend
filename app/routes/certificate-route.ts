import { Router } from "express";
import certificateController from "../controllers/certificate-controller";
import uploadFile from "../controllers/uploadFile";
import { upload } from "../middlewares/multer";

const router = Router();

router.post("/upload-file", upload.single("file"), uploadFile.singleUpload);
router.post("/upload", certificateController.uploadCertificate);
router.post("/upload-with-file", upload.single("file"), certificateController.uploadCertificate);
router.get("/list", certificateController.getUserCertificates);
router.get("/all", certificateController.getAllUserCertificates);
router.get("/search", certificateController.searchCertificates);
router.get("/stats", certificateController.getDashboardStats);
router.delete("/:id", certificateController.deleteCertificate);

export default router;
