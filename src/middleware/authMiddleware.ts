import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

declare global {
    namespace Express {
        interface Request {
            user?: any
        }
    }
}

const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            res.status(401).json({ message: "Not Authorized, missing token" });
            return;
        }

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            res.status(500).json({ message: "Internal Authorization Server Error" });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId
            },
            select: {
                id: true,
                email: true
            }
        });

        if (!user) {
            res.status(401).json({ message: "Not authorized, user not found" });
            return;
        }

        req.user = user;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Token expired" });
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: "Invalid token" });
            return;
        }

        console.error("Authentication error:", error);
        res.status(500).json({ message: "Server error during authentication" });
        return;
    }
}

export default authenticateUser;