import type { Request, Response, NextFunction } from "express";

export const protectAdmin = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const user = (req as any).user;

    if (user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
    }

    next();
};
