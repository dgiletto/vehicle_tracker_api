import { Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";
import AuthService from "../services/auth";
import { generateJWT, clearJWT } from "../utils/jwtUtils";

class AuthController {
    constructor(private authService: AuthService) {}

    registerUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password, firstName, lastName } = req.body;

            if (!email || !password) {
                res.status(400).json({ message: "Missing credentials" });
                return;
            }

            await this.authService.registerUser({
                email, password, firstName, lastName
            });

            res.status(201).json({ message: "User created successfully" });
        } catch (error) {
            errorHandler(res, error);
        }
    }

    loginUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ message: "Missing credentials" });
                return;
            }

            const user = await this.authService.loginUser({
                email, password
            });

            generateJWT(res, user.id as string);

            res.status(200).json({
                message: "Login Successful"
            });
        } catch (error) {
            errorHandler(res, error);
        }
    }

    logoutUser = async (req: Request, res: Response): Promise<void> => {
        try {
            clearJWT(res);

            res.status(200).json({
                message: "Logout Successful"
            });
        } catch (error) {
            errorHandler(res, error);
        }
    }
}

export default AuthController;