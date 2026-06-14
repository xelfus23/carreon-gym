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
              "The numeric ID from the inventory list provided in the system prompt",
          },
          set_count: {
            type: "integer",
            description: "Total number of sets. Whole numbers only.",
          },
          rep_count: {
            type: "integer",
            description:
              "Number of reps per set for strength exercises. Leave out or set null for cardio.",
          },
          duration_seconds: {
            type: "integer",
            description:
              "Time in seconds for cardio or timed holds. Leave out or set null for strength.",
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
              "Brief execution details or setup instructions for the user.",
          },
        },
        required: [
          "session_id",
          "exercise_order",
          "exercise_name",
          "exercise_type",
          "met_value",
          "equipment_id",
          "set_count",
          "weight_guidance",
          "description",
        ],
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
];

export const TOOL_NAMES = tools.map((t) => t.function.name);
