export const tools = [
  {
    type: "function",
    function: {
      name: "create_workout_plan",
      description:
        "PHASE 1: CALL THIS FIRST to initialize a plan. You MUST wait for the returned plan_id before proceeding to add days.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Program title" },
          description: {
            type: "string",
            description: "Brief overview",
          },
          duration_weeks: {
            type: "integer",
            description: "Total weeks (Integer only)",
          },
          days_per_week: {
            type: "integer",
            description: "Frequency (Integer only)",
          },
          difficulty_level: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_workout_day",
      description:
        "PHASE 2: Add a training day using a valid plan_id. Wait for the returned day_id before adding exercises.",
      parameters: {
        type: "object",
        properties: {
          plan_id: {
            type: "integer",
            description: "The ID returned from create_workout_plan",
          },
          day_order: {
            type: "integer",
            description: "Sequence (e.g., 1 for Monday)",
          },
          title: { type: "string", description: "e.g., 'Push Day'" },
          is_rest_day: { type: "boolean" },
          rest_day_notes: { type: "string" },
          day_date: {
            type: "string",
            description: "Strictly use this format: ISO 8601 format: YYYY-MM-DD (e.g., '2026-03-22')",
          },
        },
        required: ["plan_id", "day_order", "title", "day_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_exercise",
      description:
        "PHASE 3: Add exercises one by one using a valid day_id. DO NOT include units (e.g., '60s') in numeric fields.",
      parameters: {
        type: "object",
        properties: {
          day_id: {
            type: "integer",
            description: "The ID returned from add_workout_day",
          },
          exercise_order: {
            type: "integer",
            description: "Position in workout",
          },
          exercise_name: { type: "string" },
          equipment_id: {
            type: "integer",
            description:
              "The numeric ID from the inventory list provided in system prompt",
          },
          sets: {
            type: "integer",
            description: "Whole numbers only. No text.",
          },
          reps: {
            type: "integer",
            description:
              "Number of reps for strength exercises. OMIT this field when using duration_seconds."
          },
          duration_seconds: {
            type: "integer",
            description:
              "Time in seconds for cardio or holds. OMIT this field when using reps."
          },
          rest_seconds: {
            type: "integer",
            description: "Rest in seconds (Integer).",
          },
          weight_guidance: {
            type: "string",
            description:
              "Text based guidance (e.g., '70% 1RM' or 'Hold for 30-60s')",
          },
          tempo: { type: "string" },
          description: { type: "string" },
          notes: { type: "string" },
          is_warmup: { type: "boolean" },
          is_superset: { type: "boolean" },
          superset_group: { type: "integer" },
        },
        required: ["day_id", "exercise_order", "exercise_name", "equipment_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_details",
      description: "Get the user's current personal details.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_workout_plans",
      description: "A full list of all the user's workout plans with their associated days and exercises.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_workout_plan",
      description: "Removes an entire plan and its associated days/exercises.",
      parameters: {
        type: "object",
        properties: { plan_id: { type: "integer" } },
        required: ["plan_id"],
      },
    },
  },
];
