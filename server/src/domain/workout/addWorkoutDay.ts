import pool from "../../config/pool.ts";

export const addWorkoutDayDomain = async (params: {
    args: any;
    userId: number;
}) => {
    const { args, userId } = params;

    console.log(args)

    const { plan_id, day_order, title, is_rest_day, rest_day_notes, day_date } =
        args;

    const planCheck = await pool.query(
        "SELECT id FROM workout_plans WHERE id = $1 AND user_id = $2",
        [plan_id, userId],
    );

    if (planCheck.rows.length === 0) throw new Error("Plan not found");

    const result = await pool.query(
        `INSERT INTO workout_days (plan_id, day_order, title, is_rest_day, rest_day_notes, day_date)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
            plan_id,
            day_order,
            title,
            is_rest_day || false,
            rest_day_notes,
            day_date,
        ],
    );

    return {
        success: true,
        day_id: result.rows[0].id,
        message: `Added day: ${title}`,
    };
};
