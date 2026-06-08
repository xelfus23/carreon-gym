// src/controllers/workout.controller.ts
import type { Request, Response } from "express";
import { getWorkoutPlansDomain } from "../../domain/workout/getWorkoutPlan.ts";
import pool from "../../config/pool.ts";
import {
  activatePlan,
  deactivatePlan,
} from "../../domain/workout/workoutPlanDomain.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { deleteWorkoutPlanDomain } from "../../domain/workout/deleteWorkoutPlan.ts";
import { getAllLogsDomain, getDayLogsDomain, getTodayLogsDomain, removeLogDomain, upsertWorkoutLogDomain } from "../../domain/workout/workoutLogDomain.ts";

export const getWorkoutPlan = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plans = await getWorkoutPlansDomain({ userId: userId });

    return res.status(200).json({
      success: true,
      data: plans,
      message: "Fetch success",
    });
  },
);


export const getCompleted = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const { workout_day_id } = req.query;

  if (!workout_day_id) {
    return res.status(400).json({
      success: false,
      message: "workout_day_id is required",
    });
  }

  // Filter logs to today only — workout_exercises joins back to
  // workout_days via the correct FK column: workout_exercises.workout_day_id
  const result = await pool.query(
    `SELECT wl.*
           FROM workout_logs wl
           JOIN workout_exercises we ON we.id = wl.workout_exercise_id
           WHERE wl.user_id = $1
             AND we.workout_day_id = $2
             AND wl.logged_at::date = CURRENT_DATE
           ORDER BY wl.logged_at DESC`,
    [userId, workout_day_id],
  );

  return res
    .status(200)
    .json({ success: true, message: "Success", data: result.rows });
});

export const deleteLog = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { workout_exercise_id } = req.params;

  await pool.query(
    `DELETE FROM workout_logs
           WHERE user_id = $1
             AND workout_exercise_id = $2
             AND logged_at::date = CURRENT_DATE`,
    [userId, workout_exercise_id],
  );

  return res.status(200).json({ success: true });
});

export const deleteWorkoutPlan = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    await deleteWorkoutPlanDomain({
      userId: userId!,
      args: { plan_id: id },
    });

    res.status(200).json({
      success: true,
      message: `Plan deleted successfully.`,
    });
  },
);

export const toggleActivation = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_active } = req.body;

    const userId = req.user?.id;

    console.log({ id, is_active });

    let updatedPlan;

    if (!is_active) {
      updatedPlan = await activatePlan(userId!, id as string);
    } else {
      updatedPlan = await deactivatePlan(userId!, id as string);
    }

    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: "Workout plan not found or unauthorized.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Plan ${is_active ? "activated" : "deactivated"} successfully.`,
      data: updatedPlan,
    });
  },
);


/** POST /workoutplan/logs */
export const logComplete = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const {
    workout_exercise_id,
    completed_sets,
    completed_reps,
    duration_seconds,
    weight_used_kg,
    difficulty_rating,
    notes,
  } = req.body;

  if (!workout_exercise_id) {
    return res.status(400).json({
      success: false,
      message: "workout_exercise_id is required",
    });
  }

  const log = await upsertWorkoutLogDomain({
    userId,
    workout_exercise_id,
    completed_sets,
    completed_reps,
    duration_seconds,
    weight_used_kg,
    difficulty_rating,
    notes,
  });

  // but we can't distinguish here so 200 is safe for an upsert endpoint.
  return res.status(200).json({ success: true, data: log });
});

/** GET /workoutplan/logs/today */
export const getTodayLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const logs = await getTodayLogsDomain(userId);
  return res.status(200).json({ success: true, data: logs });
});

/** GET /workoutplan/logs?workout_day_id=X */
export const getDayLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const workoutDayId = Number(req.query.workout_day_id);

  if (!workoutDayId || isNaN(workoutDayId)) {
    return res.status(400).json({
      success: false,
      message: "workout_day_id query param is required",
    });
  }

  const logs = await getDayLogsDomain(userId, workoutDayId);
  return res.status(200).json({ success: true, data: logs });
});

/** GET /workoutplan/logs/all */
export const getAllLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const logs = await getAllLogsDomain(userId);
  return res.status(200).json({ success: true, data: logs });
});

/** DELETE /workoutplan/logs/:workoutExerciseId */
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