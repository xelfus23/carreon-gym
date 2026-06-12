import { request } from "../utils/request";

export type WorkoutLogPayload = {
  session_exercise_id: number;
  completed_sets?: number | null;
  completed_reps?: number | null;
  duration_seconds?: number | null;
  weight_used_kg?: number | null;
  difficulty_rating?: number | null;
  notes?: string | null;
};

export type WorkoutLog = WorkoutLogPayload & {
  id: number;
  user_id: number;
  workout_session_id: number;
  logged_at: string;
  duration_seconds?: number | null;
  calories_burned: number | null;
};

export const workoutService = {
  getWorkoutSessions: async () => {
    return (await request(`/workoutplan`, { method: "GET" })).data;
  },

  logExercise: async (payload: WorkoutLogPayload): Promise<WorkoutLog> => {
    return (
      await request(`/workoutplan/logs`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
    ).data;
  },

  getSessionLogs: async (workoutSessionId: number): Promise<WorkoutLog[]> => {
    const res = await request(
      `/workoutplan/logs?workout_session_id=${workoutSessionId}`,
      { method: "GET" },
    );
    return (res.data ?? []) as WorkoutLog[];
  },

  getTodayLogs: async (): Promise<WorkoutLog[]> => {
    const res = await request(`/workoutplan/logs/today`, { method: "GET" });
    return (res.data ?? []) as WorkoutLog[];
  },

  getAllLogs: async (): Promise<WorkoutLog[]> => {
    const res = await request(`/workoutplan/logs/all`, { method: "GET" });
    return (res.data ?? []) as WorkoutLog[];
  },

  removeLog: async (workoutExerciseId: number): Promise<{ success: boolean; message?: string }> => {
    return (
      await request(`/workoutplan/logs/${workoutExerciseId}`, { method: "DELETE" })
    ).data;
  },

  deleteSession: async (sessionId: number) => {
    return (
      await request(`/workoutplan/${sessionId}`, { method: "DELETE" })
    ).data;
  },
};