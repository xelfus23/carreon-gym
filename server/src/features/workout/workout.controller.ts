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

    console.log(req.body)

    if (!workout_exercise_id) {
        return res.status(400).json({
            success: false,
            message: "workout_exercise_id is required",
        });
    }

    // Check if a log already exists for this exercise today
    const existingLog = await pool.query(
        `SELECT id FROM workout_logs
           WHERE user_id = $1
             AND workout_exercise_id = $2
             AND logged_at::date = CURRENT_DATE`,
        [userId, workout_exercise_id],
    );

    let result;
    if (existingLog.rows.length > 0) {
        // Update existing log
        result = await pool.query(
            `UPDATE workout_logs
               SET completed_sets = $1,
                   completed_reps = $2,
                   duration_seconds = $3,
                   weight_used_kg = $4,
                   difficulty_rating = $5,
                   notes = $6,
                   logged_at = NOW()
               WHERE id = $7
               RETURNING *`,
            [
                completed_sets ?? null,
                completed_reps ?? null,
                duration_seconds ?? null,
                weight_used_kg ?? null,
                difficulty_rating ?? null,
                notes ?? null,
                existingLog.rows[0].id,
            ],
        );
    } else {
        // Insert new log
        result = await pool.query(
            `INSERT INTO workout_logs
                  (user_id, workout_exercise_id, completed_sets, completed_reps,
                   duration_seconds, weight_used_kg, difficulty_rating, notes, logged_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
               RETURNING *`,
            [
                userId,
                workout_exercise_id,
                completed_sets ?? null,
                completed_reps ?? null,
                duration_seconds?? null,
                weight_used_kg ?? null,
                difficulty_rating ?? null,
                notes ?? null,
            ],
        );
    }

    return res.status(201).json({ success: true, data: result.rows[0] });
});

/** All of today's logs for the user (for restoring completion state on app load). */
export const getTodayLogs = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const result = await pool.query(
        `SELECT wl.*, we.workout_day_id
           FROM workout_logs wl
           JOIN workout_exercises we ON we.id = wl.workout_exercise_id
           WHERE wl.user_id = $1
             AND wl.logged_at::date = CURRENT_DATE
           ORDER BY wl.logged_at DESC`,
        [userId],
    );

    return res
        .status(200)
        .json({ success: true, message: "Success", data: result.rows });
});

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
