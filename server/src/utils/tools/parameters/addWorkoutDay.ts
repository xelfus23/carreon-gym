export const saveWorkoutDayParams = {
    type: "object",
    properties: {
        plan_id: {
            type: "number",
            description:
                "The ID of the existing workout plan to add this day to",
        },
        day_order: {
            type: "number",
            description:
                "Sequential day number (e.g., if plan has 4 days, this would be 5)",
        },
        title: {
            type: "string",
            description:
                "Day name (e.g., 'Upper Body Push', 'Leg Day', 'Rest & Recovery')",
        },
        is_rest_day: {
            type: "boolean",
            description: "True for rest or active recovery days",
        },
        rest_day_notes: {
            type: "string",
            description:
                "Instructions for rest days (e.g., 'Light cardio 20min, stretching')",
        },
        exercises: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    exercise_order: {
                        type: "number",
                        description:
                            "Order of exercise in the workout (1, 2, 3...)",
                    },
                    exercise_name: {
                        type: "string",
                        description:
                            "Specific exercise name (e.g., 'Barbell Back Squat')",
                    },
                    equipment_id: {
                        type: "number",
                        description: "Foreign key from equipment table",
                    },
                    sets: { type: "number" },
                    reps: { type: "number" },
                    duration_minutes: { type: "number" },
                    rest_seconds: { type: "number" },
                    weight_guidance: { type: "string" },
                    tempo: { type: "string" },
                    description: { type: "string" },
                    notes: { type: "string" },
                    is_warmup: { type: "boolean" },
                    is_superset: { type: "boolean" },
                    superset_group: { type: "number" },
                },
                required: ["exercise_order", "exercise_name", "equipment_id"],
            },
        },
    },
    required: ["plan_id", "day_order", "title", "exercises"],
};
