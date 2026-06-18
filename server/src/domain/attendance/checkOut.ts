import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const checkOutDomain = async ({ userId }: { userId: number }) => {
  const activeSession = await pool.query(
    `SELECT id, check_in_time FROM gym_attendance
     WHERE user_id = $1 AND check_out_time IS NULL
     ORDER BY check_in_time DESC LIMIT 1`,
    [userId],
  );

  if (activeSession.rowCount === 0) {
    throw new AppError("No active session found. You are not currently checked in.", 400, "NOT_CHECKED_IN");
  }

  const result = await pool.query(
    `UPDATE gym_attendance
     SET check_out_time = NOW(),
         duration_minutes = EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 60,
         status = 'checked_out',
         log_status = 'success'
     WHERE id = $1
     RETURNING id, check_in_time, check_out_time, duration_minutes, status`,
    [activeSession.rows[0].id],
  );

  const row = result.rows[0];
  return {
    session_id: row.id,
    checked_in_at: row.check_in_time,
    checked_out_at: row.check_out_time,
    duration_minutes: Math.round(row.duration_minutes),
    status: row.status,
  };
};