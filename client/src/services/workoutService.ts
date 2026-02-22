import { request } from "../utils/request";

export type WorkoutLogPayload = {
    workout_exercise_id: number;
    completed_sets?: number | null;
    completed_reps?: number | null;
    duration_minutes?: number | null;
    weight_used_kg?: number | null;
    difficulty_rating?: number | null;
    notes?: string | null;
};

export type WorkoutLog = WorkoutLogPayload & {
    id: number;
    user_id: number;
    logged_at: string;
    duration_minutes?: number | null;
};

export const workoutService = {
    getWorkout: async () => {
        return (
            await request(`/workoutplan`, {
                method: "GET",
            })
        ).data;
    },

    logExercise: async (payload: WorkoutLogPayload) => {
        return (
            await request(`/workoutplan/logs`, {
                method: "POST",
                body: JSON.stringify(payload),
            })
        ).data;
    },

    getDayLogs: async (workoutDayId: number) => {
        const res = await request(
            `/workoutplan/logs?workout_day_id=${workoutDayId}`,
            { method: "GET" },
        );
        return res.data ?? [];
    },

    /** All logs for today (for restoring completion state on app load). */
    getTodayLogs: async (): Promise<WorkoutLog[]> => {
        const res = await request(`/workoutplan/logs/today`, {
            method: "GET",
        });
        return (res.data ?? []) as WorkoutLog[];
    },

    removeLog: async (
        workoutExerciseId: number,
    ): Promise<{ success: boolean; message?: string }> => {
        return (
            await request(`/workoutplan/${workoutExerciseId}`, {
                method: "DELETE",
            })
        ).data;
    },
};
