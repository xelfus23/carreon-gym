export const tools = [
    {
        type: "function",
        function: {
            name: "save_workout_plan",
            description:
                "CALL THIS when the user asks to save/store/keep a workout plan. This is the ONLY way to save plans to their account. User says things like: 'save this', 'save it', 'add to my plans', 'keep this workout'. ALWAYS call this when user mentions saving.",
            parameters: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description:
                            "Program title (e.g., '12-Week Muscle Builder', 'Beginner Full Body')",
                    },
                    description: {
                        type: "string",
                        description:
                            "Brief overview of the program's focus and methodology (e.g., 'Progressive overload program focusing on compound movements with hypertrophy rep ranges')",
                    },
                    duration_weeks: {
                        type: "number",
                        description:
                            "How many weeks the program runs (e.g., 4, 8, 12)",
                    },
                    days_per_week: {
                        type: "number",
                        description: "Training frequency (e.g., 3, 4, 5, 6)",
                    },
                    difficulty_level: {
                        type: "string",
                        enum: ["beginner", "intermediate", "advanced"],
                        description: "Overall program difficulty",
                    },
                    days: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                day_order: {
                                    type: "number",
                                    description:
                                        "Sequential day number (1, 2, 3...)",
                                },
                                title: {
                                    type: "string",
                                    description:
                                        "Day name (e.g., 'Upper Body Push', 'Leg Day', 'Rest & Recovery')",
                                },
                                is_rest_day: {
                                    type: "boolean",
                                    description:
                                        "True for rest or active recovery days",
                                },
                                rest_day_notes: {
                                    type: "string",
                                    description:
                                        "Instructions for rest days (e.g., 'Light cardio 20min, stretching, foam rolling')",
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
                                                    "Specific exercise name (e.g., 'Barbell Back Squat', 'Dumbbell Bench Press', 'Cable Face Pulls')",
                                            },
                                            equipment_id: {
                                                type: "number",
                                                description:
                                                    "Foreign key from equipment table. Must match exact equipment available in gym inventory.",
                                            },
                                            sets: {
                                                type: "number",
                                                description:
                                                    "Number of working sets (e.g., 3, 4, 5). Exclude warmup sets. Null for cardio.",
                                            },
                                            reps: {
                                                type: "number",
                                                description:
                                                    "Target reps per set (e.g., 8, 10, 12). Use middle of range for rep ranges. Null for time-based or cardio.",
                                            },
                                            duration_minutes: {
                                                type: "number",
                                                description:
                                                    "Duration for cardio or time-based exercises (e.g., 20, 30). Null for strength exercises.",
                                            },
                                            rest_seconds: {
                                                type: "number",
                                                description:
                                                    "Rest period between sets in seconds (e.g., 60, 90, 120, 180)",
                                            },
                                            weight_guidance: {
                                                type: "string",
                                                description:
                                                    "Weight/intensity guidance (e.g., 'RPE 7-8', '70% 1RM', 'Bodyweight', '2.5kg increase per week', 'Moderate resistance')",
                                            },
                                            tempo: {
                                                type: "string",
                                                description:
                                                    "Lifting tempo in format 'eccentric-pause-concentric-pause' (e.g., '3-0-1-0' means 3 sec down, no pause, 1 sec up, no pause). Use '2-0-2-0' as default.",
                                            },
                                            description: {
                                                type: "string",
                                                description:
                                                    "Detailed form cues and how to perform the exercise (e.g., 'Feet shoulder-width, chest up, break at hips and knees simultaneously, descend until thighs parallel, drive through heels')",
                                            },
                                            notes: {
                                                type: "string",
                                                description:
                                                    "Additional coaching notes, modifications, or tips (e.g., 'Focus on squeeze at top', 'If lower back pain, reduce ROM', 'Can substitute goblet squat')",
                                            },
                                            is_warmup: {
                                                type: "boolean",
                                                description:
                                                    "True if this is a warmup/mobility exercise, false for working sets",
                                            },
                                            is_superset: {
                                                type: "boolean",
                                                description:
                                                    "True if this exercise is part of a superset (perform back-to-back with another exercise)",
                                            },
                                            superset_group: {
                                                type: "number",
                                                description:
                                                    "Groups exercises into supersets (e.g., exercises with superset_group=1 are done together). Null if not a superset.",
                                            },
                                        },
                                        required: [
                                            "exercise_order",
                                            "exercise_name",
                                            "equipment_id",
                                        ],
                                    },
                                },
                            },
                            required: ["day_order", "title", "exercises"],
                        },
                    },
                },
                required: ["title", "days"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_workout_day",
            description:
                "CALL THIS to add a new workout day to an existing plan. User says: 'add another day', 'add more exercises', 'extend my plan'. ALWAYS call this when user wants to add to their existing plan.",
            parameters: {
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
                                    description:
                                        "Foreign key from equipment table",
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
                            required: [
                                "exercise_order",
                                "exercise_name",
                                "equipment_id",
                            ],
                        },
                    },
                },
                required: ["plan_id", "day_order", "title", "exercises"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_user_workout_plans",
            description:
                "CALL THIS when user asks to see/list/check their workout plans. User says things like: 'show my workouts', 'what plans do I have', 'my saved routines', 'list my workouts'. ALWAYS call this when user asks about their plans.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
];
