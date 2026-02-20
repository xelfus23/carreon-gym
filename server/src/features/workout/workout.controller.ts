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
        const result = await pool.query(
            `INSERT INTO workout_logs
                (user_id, workout_exercise_id, completed_sets, completed_reps,
                 weight_used_kg, difficulty_rating, notes, logged_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT ON CONSTRAINT workout_logs_user_exercise_day_unique
             DO UPDATE SET
                completed_sets    = EXCLUDED.completed_sets,
                completed_reps    = EXCLUDED.completed_reps,
                weight_used_kg    = EXCLUDED.weight_used_kg,
                difficulty_rating = EXCLUDED.difficulty_rating,
                notes             = EXCLUDED.notes,
                logged_at         = NOW()
             RETURNING *`,
            [
                userId,
                workout_exercise_id,
                completed_sets ?? null,
                completed_reps ?? null,
                weight_used_kg ?? null,
                difficulty_rating ?? null,
                notes ?? null,
            ],
        );

        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Error logging workout:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to log workout",
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
