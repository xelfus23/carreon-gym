import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token!, process.env.JWT_SECRET_KEY!);

        if (
            typeof payload === "object" &&
            payload !== null &&
            "id" in payload
        ) {
            req.user = {
                id: (payload as any).id,
                role: (payload as any).role,
            };
            next();
        } else {
            return res.status(401).json({ message: "Invalid token" });
        }
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};
