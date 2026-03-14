import pool from "../../config/pool.ts";

export const createWorkoutPlanDomain = async (params: {
    args: any;
    userId: number;
}) => {
    const { args, userId } = params;
    const {
        title,
        description,
        duration_weeks,
        days_per_week,
        difficulty_level,
    } = args;

    const result = await pool.query(
        `INSERT INTO workout_plans 
         (user_id, title, description, duration_weeks, days_per_week, difficulty_level, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        [
            userId,
            title,
            description,
            duration_weeks,
            days_per_week,
            difficulty_level,
            false,
        ],
    );

    return {
        success: true,
        plan_id: result.rows[0].id,
        message: `Plan "${title}" initialized. Now add workout days.`,
    };
};
