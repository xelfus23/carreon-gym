import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

export const authentication = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token!, env.JWT_SECRET!);

        if (
            typeof payload === "object" &&
            payload !== null &&
            "id" in payload
        ) {
            req.user = {
                id: (payload as any).id as number,
                role: (payload as any).role as "member" | "trainer" | "admin",
            };
            next();
        } else {
            return res.status(401).json({ message: "Invalid token" });
        }
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
};
