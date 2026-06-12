import type { Request, Response } from "express";
import { getWorkoutSessionDomain } from "../../domain/workout/getWorkoutSessionDomain.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { deleteWorkoutSessionDomain } from "../../domain/workout/deleteWorkoutSessionDomain.ts";
import {
  getAllLogsDomain,
  getSessionLogsDomain,
  getTodayLogsDomain,
  removeLogDomain,
  upsertWorkoutLogDomain,
} from "../../domain/workout/workoutLogDomain.ts";
import pool from "../../config/pool.ts";

export const getWorkoutSessions = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessions = await getWorkoutSessionDomain({ userId });

    return res.status(200).json({
      success: true,
      data: sessions,
      message: "Fetch success",
    });
  },
);

export const getCompleted = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { workout_session_id } = req.query;

  if (!workout_session_id) {
    return res.status(400).json({
      success: false,
      message: "workout_session_id is required",
    });
  }

  const result = await pool.query(
    `SELECT wl.*
     FROM workout_logs wl
     JOIN session_exercises we ON we.id = wl.session_exercise_id
     WHERE wl.user_id = $1
       AND we.workout_session_id = $2
       AND wl.logged_at::date = CURRENT_DATE
     ORDER BY wl.logged_at DESC`,
    [userId, workout_session_id],
  );

  return res.status(200).json({ success: true, message: "Success", data: result.rows });
});

export const deleteWorkoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    await deleteWorkoutSessionDomain({
      userId: userId!,
      args: { session_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Session deleted successfully.",
    });
  },
);

export const logComplete = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const {
    session_exercise_id,
    completed_sets,
    completed_reps,
    duration_seconds,
    weight_used_kg,
    difficulty_rating,
    notes,
  } = req.body;

  console.log(req.body)

  if (!session_exercise_id) {
    return res.status(400).json({
      success: false,
      message: "workout_exercise_id is required",
    });
  }

  const log = await upsertWorkoutLogDomain({
    userId,
    session_exercise_id,
    completed_sets,
    completed_reps,
    duration_seconds,
    weight_used_kg,
    difficulty_rating,
    notes,
  });

  return res.status(200).json({ success: true, data: log });
});

export const getTodayLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const logs = await getTodayLogsDomain(userId);
  return res.status(200).json({ success: true, data: logs });
});

export const getSessionLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const workoutSessionId = Number(req.query.workout_session_id);

  if (!workoutSessionId || isNaN(workoutSessionId)) {
    return res.status(400).json({
      success: false,
      message: "workout_session_id query param is required",
    });
  }

  const logs = await getSessionLogsDomain(userId, workoutSessionId);
  return res.status(200).json({ success: true, data: logs });
});

export const getAllLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const logs = await getAllLogsDomain(userId);
  return res.status(200).json({ success: true, data: logs });
});

export const removeLog = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const workoutExerciseId = Number(req.params.workoutExerciseId);

  if (!workoutExerciseId || isNaN(workoutExerciseId)) {
    return res.status(400).json({
      success: false,
      message: "workoutExerciseId param is required",
    });
  }

  const deleted = await removeLogDomain(userId, workoutExerciseId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "No log found for today with that exercise",
    });
  }

  return res.status(200).json({ success: true, message: "Log removed" });
});