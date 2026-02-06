import { saveWorkoutDayParams } from "./parameters/addWorkoutDay.ts";
import { saveWorkoutPlanParams } from "./parameters/saveWorkoutPlan.ts";

export const tools = [
    {
        type: "function",
        function: {
            name: "save_workout_plan",
            description:
                "CALL THIS when the user asks to save/store/keep a workout plan. This is the ONLY way to save plans to their account. User says things like: 'save this', 'save it', 'add to my plans', 'keep this workout'. ALWAYS call this when user mentions saving.",
            parameters: saveWorkoutPlanParams,
        },
    },
    {
        type: "function",
        function: {
            name: "delete_workout_plan",
            description:
                "CALL THIS when the user asks to delete/remove a workout plan.",
            parameters: {
                type: "object",
                properties: {
                    plan_id: {
                        type: "number",
                        description: "ID of the workout plan to delete.",
                    },
                },
                required: ["plan_id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "delete_workout_day",
            description:
                "CALL THIS when the user asks to delete/remove a specific workout day.",
            parameters: {
                type: "object",
                properties: {
                    plan_id: {
                        type: "number",
                        description: "Workout plan ID",
                    },
                    day_order: {
                        type: "number",
                        description: "Day number in the plan (1-based)",
                    },
                },
                required: ["plan_id", "day_order"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_workout_day",
            description:
                "CALL THIS to add a new workout day to an existing plan. User says: 'add another day', 'add more exercises', 'extend my plan'. ALWAYS call this when user wants to add to their existing plan.",
            parameters: saveWorkoutDayParams,
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
