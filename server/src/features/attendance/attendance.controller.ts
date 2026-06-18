import type { Request, Response } from "express";
import { z } from "zod";
import { checkInDomain } from "../../domain/attendance/checkIn.ts";
import { checkOutDomain } from "../../domain/attendance/checkOut.ts";
import { getActiveSessionDomain } from "../../domain/attendance/activeSession.ts";
import { attendanceLogDomain } from "../../domain/attendance/attendanceLog.ts";
import { broadcastNotification } from "../../ai/websocketHandler.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { AppError } from "../../utils/appError.ts";
import pool from "../../config/pool.ts";

type AttendanceAction = "check_in" | "check_out";

const CheckInSchema = z.object({
  qr_data: z.string().min(1, "QR data required"),
});

const ManualAttendanceSchema = z.object({
  userId: z.number().int().positive(),
  action: z.enum(["check_in", "check_out"]),
});

const getErrorInfo = (err: unknown, fallbackMessage: string) => ({
  statusCode: err instanceof AppError ? err.statusCode : 500,
  message: err instanceof Error ? err.message : fallbackMessage,
  reason: err instanceof AppError ? err.errorCode : "UNKNOWN_ERROR",
});

const logAttempt = (
  userId: number,
  action: AttendanceAction,
  result: "success" | "failed",
  reason?: string,
  metadata: Record<string, unknown> = {},
) =>
  pool.query(
    `INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
    [userId, action, result, reason ?? null, JSON.stringify(metadata)],
  );

const getUserId = (req: Request) => (req as any).user?.id as number | undefined;

const validateQrCode = async (
  req: Request,
  res: Response,
  action: AttendanceAction,
  expectedCode: string,
  metadata: Record<string, unknown>,
  userId: number,
): Promise<string | null> => {
  const validation = CheckInSchema.safeParse(req.body);

  if (!validation.success) {
    await logAttempt(userId, action, "failed", "INVALID_QR_DATA", metadata);
    res.status(400).json({ success: false, message: "Invalid QR code data" });
    return null;
  }

  const { qr_data } = validation.data;

  if (qr_data !== expectedCode) {
    await logAttempt(userId, action, "failed", "INVALID_QR", metadata);
    broadcastNotification("ATTENDANCE_ATTEMPT", {
      type: "failed",
      action,
      memberId: userId,
      reason: "INVALID_QR",
    });
    res.status(400).json({ success: false, message: "Invalid QR code" });
    return null;
  }

  return qr_data;
};

export const checkIn = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const metadata = { qr_data: req.body?.qr_data ?? null, source: "mobile_qr" };

  if (!userId) {
    return res.status(401).json({ success: false, message: "Invalid user ID provided." });
  }

  const qr_data = await validateQrCode(req, res, "check_in", "GYM:in", metadata, userId);
  if (!qr_data) return;

  const COOLDOWN_SECONDS = 10;
  const lastAttempt = await pool.query(
    `SELECT check_in_time FROM gym_attendance
     WHERE user_id = $1 ORDER BY check_in_time DESC LIMIT 1`,
    [userId],
  );

  if (lastAttempt.rowCount! > 0) {
    const elapsed = (Date.now() - new Date(lastAttempt.rows[0].check_in_time).getTime()) / 1000;
    if (elapsed < COOLDOWN_SECONDS) {
      await logAttempt(userId, "check_in", "failed", "COOLDOWN_ACTIVE", {
        ...metadata,
        cooldown_seconds: COOLDOWN_SECONDS,
      });
      return res.status(429).json({ success: false, message: "Please wait before scanning again." });
    }
  }

  try {
    const data = await checkInDomain({ userId });
    await logAttempt(userId, "check_in", "success", undefined, metadata);
    broadcastNotification("ATTENDANCE_UPDATE", { type: "success", memberId: userId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const { statusCode, message, reason } = getErrorInfo(err, "Check-in failed");
    await logAttempt(userId, "check_in", "failed", reason, metadata);
    broadcastNotification("ATTENDANCE_UPDATE", { type: "failed", memberId: userId, reason });
    return res.status(statusCode).json({ success: false, message });
  }
});

export const checkOut = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const metadata = { qr_data: req.body?.qr_data ?? null, source: "mobile_qr" };

  if (!userId) {
    return res.status(401).json({ success: false, message: "Invalid user ID provided." });
  }

  const qr_data = await validateQrCode(req, res, "check_out", "GYM:out", metadata, userId);
  if (!qr_data) return;

  try {
    const data = await checkOutDomain({ userId });
    await logAttempt(userId, "check_out", "success", undefined, metadata);
    broadcastNotification("ATTENDANCE_UPDATE", { memberId: userId, status: "checked_out" });
    return res.status(200).json({ success: true, message: "Check-out successful! Great workout! 🎉", data });
  } catch (err) {
    const { statusCode, message, reason } = getErrorInfo(err, "Check-out failed");
    await logAttempt(userId, "check_out", "failed", reason, metadata);
    broadcastNotification("ATTENDANCE_ATTEMPT", { type: "failed", action: "check_out", memberId: userId, reason });
    return res.status(statusCode).json({ success: false, message });
  }
});

export const getAttendanceLog = catchAsync(async (_req: Request, res: Response) => {
  const data = await attendanceLogDomain();
  return res.status(200).json({ success: true, data });
});

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
  const metadata = { source: "admin_manual", adminId: getUserId(req) ?? null };

  try {
    if (action === "check_in") {
      const data = await checkInDomain({ userId });
      await pool.query(`UPDATE gym_attendance SET method = 'admin' WHERE id = $1`, [data.id]);
      await logAttempt(userId, "check_in", "success", undefined, metadata);
      broadcastNotification("ATTENDANCE_UPDATE", { type: "success", memberId: userId });
      return res.status(200).json({ success: true, message: "Manual check-in logged successfully." });
    }

    const data = await checkOutDomain({ userId });
    await logAttempt(userId, "check_out", "success", undefined, metadata);
    broadcastNotification("ATTENDANCE_UPDATE", { memberId: userId, status: "checked_out" });
    return res.status(200).json({ success: true, message: "Manual check-out logged successfully.", data });
  } catch (err) {
    const { statusCode, message, reason } = getErrorInfo(err, "Manual attendance logging failed");
    await logAttempt(userId, action, "failed", reason, metadata);
    broadcastNotification("ATTENDANCE_ATTEMPT", { type: "failed", action, memberId: userId, reason });
    return res.status(statusCode).json({ success: false, message });
  }
});

export const getSessionStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const data = await getActiveSessionDomain({ userId });
  return res.status(200).json({ success: true, data });
});