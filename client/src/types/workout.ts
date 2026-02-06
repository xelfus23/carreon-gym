export type exerciseProps = {
    id: number;
    name: string;
    equipment: string[];
    sets: number;
    reps: number;
    notes: string;
};

export type dayProps = {
    id: number;
    order: number;
    is_rest_day: boolean;
    rest_day_notes: string;
    title: string;
    exercises: exerciseProps[];
};

export type WorkoutPlanProps = {
    id: number;
    status: "active";
    title: string;
    description: string;
    days: dayProps[];
};
