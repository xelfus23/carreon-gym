import { request } from "../utils/request";

export type WorkoutLogPayload = {
    workout_exercise_id: number;
    completed_sets?: number | null;
    completed_reps?: number | null;
    weight_used_kg?: number | null;
    difficulty_rating?: number | null;
    notes?: string | null;
};

export type WorkoutLog = WorkoutLogPayload & {
    id: number;
    user_id: number;
    logged_at: string;
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

    /**
     * Fetch all of today's logs for a specific workout day.
     * Note: uses workout_day_id (matches workout_exercises.workout_day_id
     * in the schema), NOT workout_plan_day_id.
     */
    getDayLogs: async (workoutDayId: number) => {
        return (
            await request("/workoutplan/logs", {
                method: "POST",
                body: JSON.stringify({
                    workout_day_id: workoutDayId,
                }),
            })
        ).data;
    },

    /**
     * Remove today's log for an exercise (called when the user unchecks it).
     */
    removeLog: async (
        workoutExerciseId: number,
    ): Promise<{ success: boolean; message?: string }> => {
        return (await request(`/workout-logs/${workoutExerciseId}`)).data;
    },
};
