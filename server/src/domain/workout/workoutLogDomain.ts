import pool from "../../config/pool.ts";

export type WorkoutLogPayload = {
  userId: number;
  session_exercise_id: number;
  completed_sets?: number | null;
  completed_reps?: number | null;
  duration_seconds?: number | null;
  weight_used_kg?: number | null;
  difficulty_rating?: number | null;
  notes?: string | null;
};

export type WorkoutLogRow = {
  id: number;
  user_id: number;
  session_exercise_id: number;
  workout_session_id: number;
  exercise_name: string;
  planned_sets: number | null;
  planned_reps: number | null;
  planned_duration_seconds: number | null;
  completed_sets: number | null;
  completed_reps: number | null;
  duration_seconds: number | null;
  weight_used_kg: number | null;
  difficulty_rating: number | null;
  notes: string | null;
  calories_burned: number;
  logged_at: string;
};

function calculateCalories(
  durationSeconds: number,
  metValue: number,
  weightKg: number,
): number {
  const calories = (metValue * weightKg * durationSeconds) / 3600;

  return Math.round(calories);
}

function estimateStrengthDuration(
  sets: number | null,
  reps: number | null,
  restSeconds = 90,
): number {
  if (!sets || !reps) return 0;

  const SECONDS_PER_REP = 4;

  const activeTime = sets * reps * SECONDS_PER_REP;

  const restTime = Math.max(0, sets - 1) * restSeconds;

  return activeTime + restTime;
}

export async function upsertWorkoutLogDomain(
  payload: WorkoutLogPayload,
): Promise<WorkoutLogRow> {
  const {
    userId,
    session_exercise_id,
    completed_sets = null,
    completed_reps = null,
    duration_seconds = null,
    weight_used_kg = null,
    difficulty_rating = null,
    notes = null,
  } = payload;

  const exerciseRes = await pool.query<{
    exercise_name: string;
    sets: number | null;
    reps: number | null;
    duration_seconds: number | null;
    rest_seconds: number | null;
    met_value: number;
    exercise_type: string;
  }>(
    `SELECT
        exercise_name,
        set_count,
        rep_count,
        duration_seconds,
        rest_seconds,
        met_value,
        exercise_type
     FROM session_exercises
     WHERE id = $1`,
    [session_exercise_id],
  );

  if (exerciseRes.rows.length === 0) {
    throw new Error(`Exercise id (${session_exercise_id}) not found`);
  }
  const exercise = exerciseRes.rows[0]!;

  const metricsRes = await pool.query<{ weight_kg: string | null }>(
    `SELECT weight_kg 
     FROM body_metrics 
     WHERE user_id = $1 
     ORDER BY recorded_at DESC 
     LIMIT 1`,
    [userId],
  );

  const userWeight = metricsRes.rows[0]?.weight_kg
    ? Number(metricsRes.rows[0].weight_kg)
    : 70.0;

  let trackingDuration = duration_seconds;

  if (!trackingDuration) {
    if (exercise.exercise_type === "strength") {
      trackingDuration = estimateStrengthDuration(
        completed_sets ?? exercise.sets,
        completed_reps ?? exercise.reps,
        exercise.rest_seconds ?? 90,
      );
    } else {
      trackingDuration = exercise.duration_seconds ?? 0;
    }
  }

  const calculatedCalories = calculateCalories(
    trackingDuration,
    exercise.met_value,
    userWeight,
  );

  const existing = await pool.query<{ id: number }>(
    `SELECT id FROM workout_logs
     WHERE user_id = $1
       AND session_exercise_id = $2
       AND logged_at::date = CURRENT_DATE`,
    [userId, session_exercise_id],
  );

  if (existing.rows.length > 0 && existing.rows[0]) {
    const result = await pool.query<WorkoutLogRow>(
      `UPDATE workout_logs
          SET completed_sets    = $1,
              completed_reps    = $2,
              duration_seconds  = $3,
              weight_used_kg    = $4,
              difficulty_rating = $5,
              notes             = $6,
              calories_burned   = $7, 
              logged_at         = NOW()
        WHERE id = $8
        RETURNING *`,
      [
        completed_sets,
        completed_reps,
        duration_seconds,
        weight_used_kg,
        difficulty_rating,
        notes,
        calculatedCalories,
        existing.rows[0].id,
      ],
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to update workout log");
    }
    return result.rows[0] as WorkoutLogRow;
  }

  const result = await pool.query<WorkoutLogRow>(
    `INSERT INTO workout_logs
           (user_id, session_exercise_id, exercise_name,
            planned_sets, planned_reps, planned_duration_seconds,
            completed_sets, completed_reps,
            duration_seconds, weight_used_kg, difficulty_rating, notes, calories_burned, logged_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
     RETURNING *`,
    [
      userId,
      session_exercise_id,
      exercise.exercise_name,
      exercise.sets,
      exercise.reps,
      exercise.duration_seconds,
      completed_sets,
      completed_reps,
      duration_seconds,
      weight_used_kg,
      difficulty_rating,
      notes,
      calculatedCalories,
    ],
  );

  if (result.rows.length === 0) {
    throw new Error("Failed to insert workout log");
  }

  return result.rows[0] as WorkoutLogRow;
}

export async function getTodayLogsDomain(
  userId: number,
): Promise<WorkoutLogRow[]> {
  const result = await pool.query<WorkoutLogRow>(
    `SELECT wl.*, we.workout_session_id
     FROM workout_logs wl
     JOIN session_exercises we ON we.id = wl.session_exercise_id
     WHERE wl.user_id = $1
       AND wl.logged_at::date = CURRENT_DATE`,
    [userId],
  );
  return result.rows;
}

export async function getSessionLogsDomain(
  userId: number,
  workoutSessionId: number,
): Promise<WorkoutLogRow[]> {
  const result = await pool.query<WorkoutLogRow>(
    `SELECT wl.*, we.workout_session_id
     FROM workout_logs wl
     JOIN session_exercises we ON we.id = wl.session_exercise_id
     WHERE wl.user_id = $1
       AND we.workout_session_id = $2`,
    [userId, workoutSessionId],
  );
  return result.rows;
}

export async function getAllLogsDomain(
  userId: number,
): Promise<WorkoutLogRow[]> {
  const result = await pool.query<WorkoutLogRow>(
    `SELECT wl.*, we.workout_session_id
     FROM workout_logs wl
     JOIN session_exercises we ON we.id = wl.session_exercise_id
     WHERE wl.user_id = $1
     ORDER BY wl.logged_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function removeLogDomain(
  userId: number,
  workoutExerciseId: number,
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM workout_logs
     WHERE user_id = $1
       AND session_exercise_id = $2
       AND logged_at::date = CURRENT_DATE`,
    [userId, workoutExerciseId],
  );

  return (result.rowCount ?? 0) > 0;
}
