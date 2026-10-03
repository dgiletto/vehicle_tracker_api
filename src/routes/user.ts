import { Router } from "express";
import UserService from "../services/user";
import UserController from "../controllers/user";
import  authenticateUser from "../middleware/authMiddleware";

const userRouter = Router();

const userService = new UserService();
const userController = new UserController(userService);

userRouter.get(
    "/getUser",
    authenticateUser,
    userController.getUser
);

export default userRouter;