import pool from "../../config/pool.ts";

export type WorkoutLogPayload = {
  userId: number;
  workout_exercise_id: number;
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
  workout_exercise_id: number;
  workout_day_id: number;
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
  calories_burned: number; // Added
  logged_at: string;
};

/** Dynamic Metabolic Equivalent Calculation */
function calculateCalories(durationSeconds: number | null, difficulty: number | null, weightKg: number): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;

  let met = 4.5;
  if (difficulty && difficulty <= 3) met = 3.0;
  if (difficulty && difficulty >= 8) met = 6.0;

  return Math.round(met * weightKg * (durationSeconds / 3600));
}

/**
 * Upsert a workout log for today.
 */
export async function upsertWorkoutLogDomain(
  payload: WorkoutLogPayload,
): Promise<WorkoutLogRow> {
  const {
    userId,
    workout_exercise_id,
    completed_sets = null,
    completed_reps = null,
    duration_seconds = null,
    weight_used_kg = null,
    difficulty_rating = null,
    notes = null,
  } = payload;

  // 1. Fetch exercise configuration template
  const exerciseRes = await pool.query<{
    exercise_name: string;
    sets: number | null;
    reps: number | null;
    duration_seconds: number | null;
  }>(
    `SELECT exercise_name, sets, reps, duration_seconds
     FROM workout_exercises
     WHERE id = $1`,
    [workout_exercise_id],
  );

  if (exerciseRes.rows.length === 0) {
    throw new Error(`workout_exercise id ${workout_exercise_id} not found`);
  }
  const exercise = exerciseRes.rows[0]!;

  const metricsRes = await pool.query<{ weight_kg: string | null }>(
    `SELECT weight_kg 
     FROM body_metrics 
     WHERE user_id = $1 
     ORDER BY recorded_at DESC 
     LIMIT 1`,
    [userId]
  );

  const userWeight = metricsRes.rows[0]?.weight_kg
    ? Number(metricsRes.rows[0].weight_kg)
    : 70.0;

  // 👇 FIX: Fall back to the workout template's duration if no custom duration was sent from the client
  const trackingDuration = duration_seconds ?? exercise.duration_seconds;

  // 2. Run the Calorie Calculation Engine using our verified tracking timeframe
  const calculatedCalories = calculateCalories(trackingDuration, difficulty_rating, userWeight);

  // 3. Check for an existing submission matching today's calendar window
  const existing = await pool.query<{ id: number }>(
    `SELECT id FROM workout_logs
     WHERE user_id = $1
       AND workout_exercise_id = $2
       AND logged_at::date = CURRENT_DATE`,
    [userId, workout_exercise_id],
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
        duration_seconds, // Kept raw to preserve user input in history
        weight_used_kg,
        difficulty_rating,
        notes,
        calculatedCalories, // Correctly updated calorie metric
        existing.rows[0].id,
      ],
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to update workout log");
    }
    return result.rows[0] as WorkoutLogRow;
  }

  // 4. If no record was found for today, append it into the table as a fresh insertion
  const result = await pool.query<WorkoutLogRow>(
    `INSERT INTO workout_logs
           (user_id, workout_exercise_id, exercise_name,
            planned_sets, planned_reps, planned_duration_seconds,
            completed_sets, completed_reps,
            duration_seconds, weight_used_kg, difficulty_rating, notes, calories_burned, logged_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
     RETURNING *`,
    [
      userId,
      workout_exercise_id,
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


/** Fetch today's logs for a user, joined with workout_day_id. */
export async function getTodayLogsDomain(userId: number): Promise<WorkoutLogRow[]> {
  const result = await pool.query<WorkoutLogRow>(
    `SELECT wl.*, we.workout_day_id
     FROM workout_logs wl
     JOIN workout_exercises we ON we.id = wl.workout_exercise_id
     WHERE wl.user_id = $1
       AND wl.logged_at::date = CURRENT_DATE`,
    [userId],
  );
  return result.rows;
}

/** Fetch logs for a specific workout day, joined with workout_day_id. */
export async function getDayLogsDomain(
  userId: number,
  workoutDayId: number,
): Promise<WorkoutLogRow[]> {
  const result = await pool.query<WorkoutLogRow>(
    `SELECT wl.*, we.workout_day_id
     FROM workout_logs wl
     JOIN workout_exercises we ON we.id = wl.workout_exercise_id
     WHERE wl.user_id = $1
       AND we.workout_day_id = $2`,
    [userId, workoutDayId],
  );
  return result.rows;
}

/** Fetch all logs for a user, joined with workout_day_id. */
export async function getAllLogsDomain(userId: number): Promise<WorkoutLogRow[]> {
  const result = await pool.query<WorkoutLogRow>(
    `SELECT wl.*, we.workout_day_id
     FROM workout_logs wl
     JOIN workout_exercises we ON we.id = wl.workout_exercise_id
     WHERE wl.user_id = $1
     ORDER BY wl.logged_at DESC`,
    [userId],
  );
  return result.rows;
}

/** Delete today's log for a given workout_exercise_id. */
export async function removeLogDomain(
  userId: number,
  workoutExerciseId: number,
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM workout_logs
     WHERE user_id = $1
       AND workout_exercise_id = $2
       AND logged_at::date = CURRENT_DATE`,
    [userId, workoutExerciseId],
  );

  return (result.rowCount ?? 0) > 0;
}