import pool from "../../config/pool.ts";

export interface SessionRow {
  session_id: number;
  session_title: string;
  session_date: string;
  difficulty_level: string | null;
  is_rest_day: boolean;
  rest_day_notes: string | null;
  session_notes: string | null;
  session_created_at: string;

  exercise_id: number | null;
  instructions: string[] | null;
  muscle_group: string[] | null;
  exercise_name: string | null;
  exercise_order: number | null;
  exercise_type: number | null;
  description: string;
  set_count: number | null;
  rep_count: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  weight_guidance: string | null;
  notes: string | null;
  equipment_name: string | null;
}

export async function getWorkoutSessionDomain(params: { userId: number }) {
  const { userId } = params;

  const query = `
    SELECT
      ws.id::int AS session_id,
      ws.title AS session_title,
      ws.session_date,
      ws.difficulty_level,
      ws.is_rest_day,
      ws.rest_day_notes,
      ws.notes AS session_notes,
      ws.created_at AS session_created_at,

      we.id AS exercise_id,
      we.exercise_name,
      we.exercise_order,
      we.exercise_type,
      we.description,
      we.instructions,
      we.muscle_group,
      we.set_count,
      we.rep_count,
      we.duration_seconds,
      we.rest_seconds,
      we.weight_guidance,

      eq.name AS equipment_name

    FROM workout_sessions ws
    LEFT JOIN session_exercises we ON ws.id = we.workout_session_id
    LEFT JOIN equipment eq ON we.equipment_id = eq.id

    WHERE ws.user_id = $1

    ORDER BY
      ws.session_date DESC,
      we.exercise_order ASC;
  `;

  const result = await pool.query<SessionRow>(query, [userId]);

  const sessionsMap = new Map<number, any>();

  for (const row of result.rows) {
    if (!sessionsMap.has(row.session_id)) {
      sessionsMap.set(row.session_id, {
        id: row.session_id,
        session_title: row.session_title,
        session_date: row.session_date,
        difficulty_level: row.difficulty_level,
        is_rest_day: row.is_rest_day,
        rest_day_notes: row.rest_day_notes,
        notes: row.session_notes,
        created_at: row.session_created_at,
        exercises: [],
      });
    }

    const session = sessionsMap.get(row.session_id);

    if (!row.is_rest_day && row.exercise_id) {
      session.exercises.push({
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name,
        exercise_type: row.exercise_type,
        exercise_order: row.exercise_order,
        equipment_name: row.equipment_name,
        set_count: row.set_count,
        rep_count: row.rep_count,
        instructions: row.instructions,
        muscle_group: row.muscle_group,
        description: row.description,
        duration_seconds: row.duration_seconds,
        rest_seconds: row.rest_seconds,
        weight_guidance: row.weight_guidance,
      });
    }
  }

  return Array.from(sessionsMap.values());
}
