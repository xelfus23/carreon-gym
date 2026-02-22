// src/controllers/workout.controller.ts
import type { Request, Response } from "express";
import { getWorkoutPlansDomain } from "../../domain/workout/getWorkoutPlan.ts";
import pool from "../../config/pool.ts";

export const getWorkoutPlan = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const plans = await getWorkoutPlansDomain({ userId: userId });

        console.log(plans);
        return res.status(200).json({
            success: true,
            data: plans,
            message: "Fetch success",
        });
    } catch (err) {
        console.error("Get Plan Error:", err);
        return res.status(500).json({
            error: "Failed to fetch workout plans",
        });
    }
};

export const logComplete = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const {
        workout_exercise_id,
        completed_sets,
        completed_reps,
        duration_minutes,
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

    try {
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
                     duration_minutes = $3,
                     weight_used_kg = $4,
                     difficulty_rating = $5,
                     notes = $6,
                     logged_at = NOW()
                 WHERE id = $7
                 RETURNING *`,
                [
                    completed_sets ?? null,
                    completed_reps ?? null,
                    duration_minutes ?? null,
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
                     duration_minutes, weight_used_kg, difficulty_rating, notes, logged_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                 RETURNING *`,
                [
                    userId,
                    workout_exercise_id,
                    completed_sets ?? null,
                    completed_reps ?? null,
                    duration_minutes ?? null,
                    weight_used_kg ?? null,
                    difficulty_rating ?? null,
                    notes ?? null,
                ],
            );
        }

        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Error logging workout:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to log workout",
        });
    }
};

/** All of today's logs for the user (for restoring completion state on app load). */
export const getTodayLogs = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    try {
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
    } catch (error) {
        console.error("Error fetching today's workout logs:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch today's logs",
        });
    }
};

export const getCompleted = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const { workout_day_id } = req.query;

    if (!workout_day_id) {
        return res.status(400).json({
            success: false,
            message: "workout_day_id is required",
        });
    }

    try {
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
    } catch (error) {
        console.error("Error fetching workout logs:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch workout logs",
        });
    }
};

export const deleteLog = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { workout_exercise_id } = req.params;

    try {
        await pool.query(
            `DELETE FROM workout_logs
             WHERE user_id = $1
               AND workout_exercise_id = $2
               AND logged_at::date = CURRENT_DATE`,
            [userId, workout_exercise_id],
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error removing workout log:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove log",
        });
    }
};
