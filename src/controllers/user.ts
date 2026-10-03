import { Request, Response } from "express";
import UserService from "../services/user";
import { errorHandler } from "../utils/errorHandler";

class UserController {
    constructor(private userService: UserService) {}

    getUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized"
                });
                return;
            }

            const user = await this.userService.getUser(userId);

            res.status(200).json(user);
        } catch (error) {
            errorHandler(res, error);
        }
    }
}

export default UserController;