export type exerciseProps = {
    id: number;
    exercise_name: string;
    equipment_name: string[];
    sets: number;
    reps: number | null;
    duration_seconds: number | null;
    notes: string;
};

export type dayProps = {
    id: number;
    order: number;
    is_rest_day: boolean;
    rest_day_notes: string;
    title: string;
    exercises: exerciseProps[];
    day_order: number;
    day_date: number;
};

export type WorkoutPlanProps = {
    id: number;
    status: "active";
    title: string;
    description: string;
    days: dayProps[];
    is_active: boolean;
};
