export const tools = [
  {
    type: "function",
    function: {
      name: "create_workout_session",
      description:
        "Create a workout session. If the user refers to 'today' or 'my session' without specifying a date, use today's date automatically. Call this before adding exercises if no session_id is available yet.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "e.g., 'Push Day', 'Leg Day'" },
          session_date: {
            type: "string",
            description:
              "ISO 8601 format: YYYY-MM-DD. If user says 'today', use today's date.",
          },
          difficulty_level: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
          },
          is_rest_day: { type: "boolean" },
          rest_day_notes: { type: "string" },
          notes: { type: "string" },
        },
        required: ["session_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_session_exercise",
      description:
        "Create an exercise entry using a valid session_id. Do not include units (e.g., '60s') in numeric fields.",
      parameters: {
        type: "object",
        properties: {
          session_id: {
            type: "integer",
            description:
              "The ID returned from create_workout_session or get_session_by_date",
          },
          exercise_order: {
            type: "integer",
            description:
              "Sequential position in workout starting from 1 (e.g., 1, 2, 3...)",
          },
          exercise_name: {
            type: "string",
            description: "e.g., 'Dumbbell Bicep Curl', 'Barbell Bench Press'",
          },
          exercise_type: {
            type: "string",
            enum: [
              "strength",
              "cardio",
              "bodyweight",
              "flexibility",
              "isometric",
            ],
            description:
              "Primary exercise category used for calorie estimation and analytics.",
          },
          met_value: {
            type: "number",
            description: "Exercise MET value used for calorie estimation.",
          },
          equipment_id: {
            type: "integer",
            description:
              "The numeric ID from the inventory list provided in the system prompt. Set to null if the request is a home exercise or bodyweight workout.",
          },
          set_count: {
            type: "integer",
            description: "Total number of sets. Whole numbers only.",
          },
          rep_count: {
            type: "integer",
            description: "Number of reps per set. Provide a value if the exercise is strength-based or measured in movements (e.g., 10 reps for a dynamic warm-up stretch). Leave null only if duration_seconds is provided."
          },
          duration_seconds: {
            type: "integer",
            description: "Time duration in seconds. Provide a value for cardio, timed holds, or time-based warmups (e.g., 60 for a 60-second stretch). Leave null only if rep_count is provided."
          },
          rest_seconds: {
            type: "integer",
            description: "Rest period between sets in seconds.",
          },
          weight_guidance: {
            type: "string",
            description:
              "Target weight specification in pounds (lbs) or type. E.g., '25 lbs', '40 lbs dumbbells', '135 lbs barbell', or 'Bodyweight'. Do not leave blank if equipment is used.",
          },
          description: {
            type: "string",
            description:
              "A short description of the exercise.",
          },
          muscle_group: {
            type: "array",
            description: "Targeted muscle groups involved in this specific exercise. Choose from the provided list.",
            items: {
              type: "string",
              enum: [
                "Chest",
                "Back",
                "Shoulders",
                "Biceps",
                "Triceps",
                "Forearms",
                "Quads",
                "Hamstrings",
                "Glutes",
                "Calves",
                "Abs/Core",
                "Full Body"
              ]
            }
          },
          instructions: {
            type: "array",
            description: "Step-by-step execution details or setup instructions for the user.",
            items: {
              type: "string",
              description: "A single instruction step (e.g., 'Adjust the seat to hip height.', 'Keep your core tight while pulling.')"
            }
          }
        },
        required: [
          "session_id",
          "exercise_order",
          "exercise_name",
          "exercise_type",
          "met_value",
          "set_count",
          "weight_guidance",
          "description",
          "instructions",
          "muscle_group",
        ],
        anyOf: [
          { required: ["rep_count"] },
          { required: ["duration_seconds"] }
        ]
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_workout_sessions",
      description:
        "A full list of all the user's workout sessions with their associated exercises.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_session_by_date",
      description:
        "Look up an existing workout session by date. CRITICAL: If you do not have a session_id in the current conversation state, you MUST call this tool first using the target date to retrieve the valid session_id before adding exercises.",
      parameters: {
        type: "object",
        properties: {
          session_date: {
            type: "string",
            description:
              "ISO 8601 format: YYYY-MM-DD. Resolve 'today', 'tomorrow', 'next Monday' to an actual date before calling.",
          },
        },
        required: ["session_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_workout_logs",
      description:
        "Get the user's workout logs to track progress and performance. " +
        "Use scope 'today' for current session progress, 'session' for a specific past session, " +
        "'all' for full history and progress trends.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["today", "session", "all"],
            description:
              "'today' = logs from today only. " +
              "'session' = logs for a specific session (requires session_id). " +
              "'all' = full history for progress tracking.",
          },
          session_id: {
            type: "integer",
            description:
              "Required when scope is 'session'. The workout session ID to retrieve logs for.",
          },
        },
        required: ["scope"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_body_metrics_history",
      description: "Retrieves the user's body metrics history including weight, body fat percentage, and muscle mass over time. Use this when the user asks about their progress, weight, body composition, or physical changes.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of recent entries to retrieve. Default 10, max 30.",
            default: 10
          }
        },
        required: []
      }
    }
  }
];

export const TOOL_NAMES = tools.map((t) => t.function.name);
