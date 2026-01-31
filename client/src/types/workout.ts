export type WorkoutPlan = {
    id: number;
    userId: number;
    exercises: {
        name: string;
        sets: number;
        reps: number;
        weight?: number;
    }[];
    startDate: string;
    endDate?: string;
    notes?: string;
};
