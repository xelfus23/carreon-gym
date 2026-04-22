import type { Request, Response } from "express";
import { checkInDomain } from "../../domain/attendance/checkIn.ts";
import { z } from "zod";
import { checkOutDomain } from "../../domain/attendance/checkOut.ts";
import { getActiveSessionDomain } from "../../domain/attendance/activeSession.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { attendanceLogDomain } from "../../domain/attendance/attendanceLog.ts";
import { broadcastNotification } from "../../ai/websocketHandler.ts";
import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

type AttendanceAction = "check_in" | "check_out";

const CheckInSchema = z.object({
    qr_data: z.string().min(1, "QR data required"),
});

const ManualAttendanceSchema = z.object({
    userId: z.number().int().positive(),
    action: z.enum(["check_in", "check_out"]),
});

/** Human-readable reason for logs, WebSocket, and admin UI (legacy codes included). */
const mapAttendanceFailureReason = (err: unknown): string => {
    const byCode: Record<string, string> = {
        NO_SUBSCRIPTION: "No Subscription",
        UNAUTHORIZED_ACCESS: "No Subscription",
        ALREADY_CHECKED_IN: "Already Checked In",
        UNVERIFIED_USER: "Unverified User",
        USER_NOT_FOUND: "User Not Found",
        NOT_CHECKED_IN: "Not Checked In",
    };

    if (err instanceof AppError) {
        return byCode[err.errorCode] ?? (err.message.trim() || "Unknown error");
    }

    const msg = err instanceof Error ? err.message.trim() : "";
    return msg || "Unknown error";
};

const logAttendanceAttempt = async (params: {
    userId: number;
    action: AttendanceAction;
    result: "success" | "failed";
    reason?: string;
    metadata?: Record<string, unknown>;
}) => {
    const { userId, action, result, reason = null, metadata = {} } = params;

    await pool.query(
        `INSERT INTO attendance_attempts
        (user_id, action, result, reason, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
        [userId, action, result, reason, JSON.stringify(metadata)],
    );
};

export const checkIn = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const metadata = {
        qr_data: req.body?.qr_data ?? null,
        source: "mobile_qr",
    };

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Invalid user ID provided.",
        });
    }

    const validation = CheckInSchema.safeParse(req.body);

    if (!validation.success) {
        await logAttendanceAttempt({
            userId,
            action: "check_in",
            result: "failed",
            reason: "INVALID_QR_DATA",
            metadata,
        });
        return res.status(400).json({
            success: false,
            message: "Invalid QR code data",
        });
    }

    const { qr_data } = validation.data;

    if (qr_data !== "GYM:in") {
        await logAttendanceAttempt({
            userId,
            action: "check_in",
            result: "failed",
            reason: "INVALID_QR",
            metadata,
        });

        broadcastNotification("ATTENDANCE_ATTEMPT", {
            type: "failed",
            action: "check_in",
            memberId: userId,
            reason: "INVALID_QR",
        });

        return res.status(400).json({
            success: false,
            message: "Invalid QR code",
        });
    }

    // =====================================================
    // 🚨 1. EARLY COOLDOWN CHECK (MUST BE FIRST)
    // =====================================================

    const lastAttempt = await pool.query(
        `SELECT log_status, check_in_time
       FROM gym_attendance
       WHERE user_id = $1
       ORDER BY check_in_time DESC
       LIMIT 1`,
        [userId],
    );

    if (lastAttempt.rowCount! > 0) {
        const last = lastAttempt.rows[0];

        const diff =
            (Date.now() - new Date(last.check_in_time).getTime()) / 1000;

        const COOLDOWN_SECONDS = 10;

        if (diff < COOLDOWN_SECONDS) {
            await logAttendanceAttempt({
                userId,
                action: "check_in",
                result: "failed",
                reason: "COOLDOWN_ACTIVE",
                metadata: {
                    ...metadata,
                    cooldown_seconds: COOLDOWN_SECONDS,
                },
            });
            return res.status(429).json({
                success: false,
                message: "Please wait before scanning again.",
            });
        }
    }

    try {
        // =====================================================
        // ✅ 2. MAIN LOGIC
        // =====================================================

        const data = await checkInDomain({ userId });

        await logAttendanceAttempt({
            userId,
            action: "check_in",
            result: "success",
            metadata,
        });

        broadcastNotification("ATTENDANCE_UPDATE", {
            type: "success",
            memberId: userId,
        });

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (err: unknown) {
        const failureReason = mapAttendanceFailureReason(err);

        await logAttendanceAttempt({
            userId,
            action: "check_in",
            result: "failed",
            reason: failureReason,
            metadata,
        });

        broadcastNotification("ATTENDANCE_UPDATE", {
            type: "failed",
            memberId: userId,
            reason: failureReason,
        });

        const statusCode = err instanceof AppError ? err.statusCode : 500;
        const message =
            err instanceof AppError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : "Check-in failed";

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
});

export const checkOut = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const metadata = {
        qr_data: req.body?.qr_data ?? null,
        source: "mobile_qr",
    };

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Invalid user ID provided.",
        });
    }

    const validation = CheckInSchema.safeParse(req.body);

    if (!validation.success) {
        await logAttendanceAttempt({
            userId,
            action: "check_out",
            result: "failed",
            reason: "INVALID_QR_DATA",
            metadata,
        });

        return res.status(400).json({
            success: false,
            message: "Invalid QR code data",
            errors: validation.error,
        });
    }

    const { qr_data } = validation.data;

    if (qr_data !== "GYM:out") {
        await logAttendanceAttempt({
            userId,
            action: "check_out",
            result: "failed",
            reason: "INVALID_QR",
            metadata,
        });

        broadcastNotification("ATTENDANCE_ATTEMPT", {
            type: "failed",
            action: "check_out",
            memberId: userId,
            reason: "INVALID_QR",
        });

        return res.status(400).json({
            success: false,
            message: "Invalid gym QR code. Please scan the correct QR code",
        });
    }

    try {
        const data = await checkOutDomain({ userId });

        await logAttendanceAttempt({
            userId,
            action: "check_out",
            result: "success",
            metadata,
        });

        broadcastNotification("ATTENDANCE_UPDATE", {
            memberId: userId,
            status: "checked_out",
        });

        return res.status(200).json({
            success: true,
            message: "Check-out successful! Great workout! 🎉",
            data: data,
        });
    } catch (err: unknown) {
        const failureReason = mapAttendanceFailureReason(err);

        await logAttendanceAttempt({
            userId,
            action: "check_out",
            result: "failed",
            reason: failureReason,
            metadata,
        });

        broadcastNotification("ATTENDANCE_ATTEMPT", {
            type: "failed",
            action: "check_out",
            memberId: userId,
            reason: failureReason,
        });

        const statusCode = err instanceof AppError ? err.statusCode : 500;
        const message =
            err instanceof AppError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : "Check-out failed";

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
});

export const getAttendanceLog = catchAsync(
    async (req: Request, res: Response) => {
        const attendanceLog = await attendanceLogDomain();

        return res.status(200).json({
            success: true,
            data: attendanceLog,
        });
    },
);

export const manualAttendance = catchAsync(async (req: Request, res: Response) => {
    const validation = ManualAttendanceSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid manual attendance payload",
            errors: validation.error.flatten(),
        });
    }

    const { userId, action } = validation.data;
    const adminId = (req as any).user?.id ?? null;
    const metadata = {
        source: "admin_manual",
        adminId,
    };

    try {
        if (action === "check_in") {
            const data = await checkInDomain({ userId });

            await pool.query(
                `UPDATE gym_attendance
                 SET method = 'admin'
                 WHERE id = $1`,
                [data.id],
            );

            await logAttendanceAttempt({
                userId,
                action: "check_in",
                result: "success",
                metadata,
            });

            broadcastNotification("ATTENDANCE_UPDATE", {
                type: "success",
                memberId: userId,
            });

            return res.status(200).json({
                success: true,
                message: "Manual check-in logged successfully.",
            });
        }

        const data = await checkOutDomain({ userId });
        await logAttendanceAttempt({
            userId,
            action: "check_out",
            result: "success",
            metadata,
        });

        broadcastNotification("ATTENDANCE_UPDATE", {
            memberId: userId,
            status: "checked_out",
        });

        return res.status(200).json({
            success: true,
            message: "Manual check-out logged successfully.",
            data,
        });
    } catch (err: unknown) {
        const failureReason = mapAttendanceFailureReason(err);
        await logAttendanceAttempt({
            userId,
            action,
            result: "failed",
            reason: failureReason,
            metadata,
        });

        broadcastNotification("ATTENDANCE_ATTEMPT", {
            type: "failed",
            action,
            memberId: userId,
            reason: failureReason,
        });

        const statusCode = err instanceof AppError ? err.statusCode : 500;
        const message =
            err instanceof AppError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : "Manual attendance logging failed";

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
});

export const getSessionStatus = catchAsync(
    async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const session = await getActiveSessionDomain({ userId });

        return res.status(200).json({
            success: true,
            data: session,
        });
    },
);
