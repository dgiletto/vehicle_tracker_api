import { Response } from "express";

export const errorHandler = (res: Response, error: any) => {
    if (error.message.toLowerCase().includes("not found")) {
        res.status(404).json({ message: "Resource Not Found" });
        return;
    }

    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
}