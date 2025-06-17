import { Router } from "express";
import authController from "../controllers/auth-controller";

const router = Router();  

router.post("/signup", authController.validateSignup, authController.signup);
router.post("/signin", authController.validateSignin, authController.signin);

export default router;
