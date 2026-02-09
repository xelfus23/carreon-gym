import pool from "../../config/pool.ts";

export interface PlanRow {
    plan_id: number;
    plan_title: string;
    day_id: number;
    day_title: string;
    day_order: number;
    is_rest_day: boolean;
    rest_day_notes: string | null;
    exercise_id: number | null;
    exercise_name: string | null;
    sets: number | null;
    reps: number | null;
    notes: string | null;
    equipment_name: string | null;
}

export async function getWorkoutPlansDomain(params: { userId: number }) {
    const { userId } = params;

    const query = `
    SELECT 
      wp.id AS plan_id,
      wp.title AS plan_title,
      wd.id AS day_id,
      wd.title AS day_title,
      wd.day_order,
      wd.is_rest_day,
      wd.rest_day_notes,
      we.id AS exercise_id,
      we.exercise_name,
      we.sets,
      we.reps,
      we.notes,
      eq.name AS equipment_name
    FROM workout_plans wp
    JOIN workout_days wd ON wp.id = wd.plan_id
    LEFT JOIN workout_exercises we ON wd.id = we.workout_day_id
    LEFT JOIN equipment eq ON we.equipment_id = eq.id
    WHERE wp.user_id = $1
    ORDER BY wp.created_at DESC, wd.day_order ASC, we.exercise_order ASC;
  `;

    const result = await pool.query<PlanRow>(query, [userId]);

    const plansMap = new Map<number, any>();

    for (const row of result.rows) {
        if (!plansMap.has(row.plan_id)) {
            plansMap.set(row.plan_id, {
                id: row.plan_id,
                title: row.plan_title,
                days: [],
            });
        }

        const plan = plansMap.get(row.plan_id);

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

        if (!row.is_rest_day && row.exercise_id) {
            day.exercises.push({
                id: row.exercise_id,
                name: row.exercise_name,
                equipment: row.equipment_name ?? "Bodyweight",
                sets: row.sets,
                reps: row.reps,
                notes: row.notes,
            });
        }
    }

    return Array.from(plansMap.values());
}
