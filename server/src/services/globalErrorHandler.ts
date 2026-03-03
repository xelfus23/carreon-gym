import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
    let validationErrors = undefined;

    if (err instanceof ZodError) {
        statusCode = 400;
        message = "Validation Failed";
        errorCode = "VALIDATION_ERROR";
        validationErrors = err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
    }

    if (statusCode === 500) {
        console.error("💥 SYSTEM ERROR:", err);
    }

    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Please log in again.";
        errorCode = "AUTH_INVALID_TOKEN";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Your session has expired.";
        errorCode = "AUTH_TOKEN_EXPIRED";
    }
    
    res.status(statusCode).json({
        success: false,
        message,
        code: errorCode,
        errors: validationErrors,
        // stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};
