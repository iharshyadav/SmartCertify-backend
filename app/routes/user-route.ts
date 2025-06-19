import { Router } from "express";
import authController from "../controllers/auth-controller";
import userController from "../controllers/user-controller";
import uploadFile from "../controllers/uploadFile";
import { upload } from "../middlewares/multer";

const router = Router();  

router.post("/signup", authController.validateSignup, authController.signup);
router.post("/signin", authController.validateSignin, authController.signin);
router.post("/googlesignin", authController.googleAuth);
router.get("/getprofile", userController.getProfile);
router.put("/updateprofile",userController.updateProfile);
router.post("/uploadfile", upload.single('file'), uploadFile.singleUpload)

export default router;
