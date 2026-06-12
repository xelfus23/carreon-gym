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
            description: "ISO 8601 format: YYYY-MM-DD. If user says 'today', use today's date.",
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
        "Add exercises one by one using a valid session_id. DO NOT include units (e.g., '60s') in numeric fields.",
      parameters: {
        type: "object",
        properties: {
          session_id: {
            type: "integer",
            description: "The ID returned from create_workout_session",
          },
          exercise_order: {
            type: "integer",
            description: "Position in workout (e.g., 1, 2, 3...)",
          },
          exercise_name: { type: "string" },
          equipment_id: {
            type: "integer",
            description: "The numeric ID from the inventory list provided in system prompt",
          },
          sets: {
            type: "integer",
            description: "Whole numbers only. No text.",
          },
          reps: {
            type: "integer",
            description: "Number of reps for strength exercises. OMIT this field when using duration_seconds.",
          },
          duration_seconds: {
            type: "integer",
            description: "Time in seconds for cardio or holds. OMIT this field when using reps.",
          },
          rest_seconds: {
            type: "integer",
            description: "Rest in seconds (Integer).",
          },
          weight_guidance: {
            type: "string",
            description: "Text based guidance (e.g., '70% 1RM' or 'Hold for 30-60s')",
          },
          tempo: { type: "string" },
          description: { type: "string" },
          notes: { type: "string" },
          is_warmup: { type: "boolean" },
          is_superset: { type: "boolean" },
          superset_group: { type: "integer" },
        },
        required: ["session_id", "exercise_order", "exercise_name", "equipment_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_workout_sessions",
      description: "A full list of all the user's workout sessions with their associated exercises.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_session_by_date",
      description:
        "Look up an existing workout session by date. Use this before adding exercises to check if a session already exists for that date. Returns the session_id if found, or a message to create one if not.",
      parameters: {
        type: "object",
        properties: {
          session_date: {
            type: "string",
            description: "ISO 8601 format: YYYY-MM-DD. Resolve 'today', 'tomorrow', 'next Monday' to an actual date before calling.",
          },
        },
        required: ["session_date"],
      },
    },
  },
];