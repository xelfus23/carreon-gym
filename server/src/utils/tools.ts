export const tools = [
    {
        type: "function",
        function: {
            name: "save_workout_plan",
            description: "Save a generated workout plan to the user's database. Call this ONLY when the user explicitly agrees to save the routine.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "e.g., 'Leg Day Destruction' or 'Full Body A'" },
                    days: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                day_order: { type: "number", description: "1 for Monday/First day, etc." },
                                title: { type: "string", description: "e.g., 'Upper Body Focus'" },
                                exercises: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            equipment_name: { 
                                                type: "string", 
                                                description: "MUST be an exact match from the provided Inventory List (e.g., 'Dumbbells', 'Bench Press Station'). Use 'Bodyweight' if none needed." 
                                            },
                                            name: { type: "string", description: "Name of the exercise (e.g., 'Goblet Squat')" },
                                            sets: { type: "number" },
                                            reps: { type: "number" }, // Changed to number for cleaner DB storage
                                            notes: { type: "string" }
                                        },
                                        required: ["equipment_name", "name", "sets", "reps"],
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
];