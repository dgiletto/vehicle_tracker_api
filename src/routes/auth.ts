import { Router } from "express";
import AuthService from "../services/auth";
import AuthController from "../controllers/auth";

const router = Router();

const authService = new AuthService();
const authController = new AuthController(authService);

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logoutUser);

export default router;