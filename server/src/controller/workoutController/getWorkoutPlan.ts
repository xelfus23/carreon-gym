import type { Request, Response } from "express";
import pool from "../../config/pool.ts";

interface PlanRow {
    plan_id: number;
    plan_title: string;
    day_id: number;
    day_title: string;
    day_order: number;
    is_rest_day: boolean;
    rest_day_notes: string | null;
    exercise_id: number | null;
    exercise_name: string | null; // ✅ Changed from notes
    sets: number | null;
    reps: number | null;
    notes: string | null;
    equipment_name: string | null;
}

const getWorkoutPlan = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const query = `
            SELECT 
                wp.id as plan_id, 
                wp.title as plan_title,
                wd.id as day_id, 
                wd.title as day_title, 
                wd.day_order,
                wd.is_rest_day,
                wd.rest_day_notes,
                we.id as exercise_id, 
                we.exercise_name,        -- ✅ Use exercise_name column
                we.sets, 
                we.reps, 
                we.notes,                -- ✅ This is for additional notes
                eq.name as equipment_name
            FROM workout_plans wp
            JOIN workout_days wd ON wp.id = wd.plan_id
            LEFT JOIN workout_exercises we ON wd.id = we.workout_day_id  -- ✅ LEFT JOIN for rest days
            LEFT JOIN equipment eq ON we.equipment_id = eq.id
            WHERE wp.user_id = $1
            ORDER BY wp.created_at DESC, wd.day_order ASC, we.exercise_order ASC;  -- ✅ Order by exercise_order
        `;

        const result = await pool.query<PlanRow>(query, [userId]);

        const plansMap = new Map<number, any>();

        for (const row of result.rows) {
            // A. Create Plan if it doesn't exist
            if (!plansMap.has(row.plan_id)) {
                plansMap.set(row.plan_id, {
                    id: row.plan_id,
                    title: row.plan_title,
                    days: [],
                });
            }

            const plan = plansMap.get(row.plan_id);

            // B. Find or Create Day
            let day = plan.days.find((d: any) => d.id === row.day_id);
            if (!day) {
                day = {
                    id: row.day_id,
                    title: row.day_title,
                    order: row.day_order,
                    is_rest_day: row.is_rest_day,
                    rest_day_notes: row.rest_day_notes,
                    exercises: [],
                };
                plan.days.push(day);
            }

            // C. Push Exercise (only if not a rest day and exercise exists)
            if (!row.is_rest_day && row.exercise_id) {
                day.exercises.push({
                    id: row.exercise_id,
                    name: row.exercise_name, // ✅ Correct field
                    equipment: row.equipment_name || "Bodyweight",
                    sets: row.sets,
                    reps: row.reps,
                    notes: row.notes, // ✅ Additional notes
                });
            }
        }

        const formattedPlans = Array.from(plansMap.values());

        return res.status(200).json({
            success: true,
            data: formattedPlans,
            message: "Fetch success",
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error("Get Plan Error:", err.message);
            res.status(500).json({ error: "Failed to fetch workout plans" });
        }
    }
};

export default getWorkoutPlan;
