type exerciseType =
  "strength" |
  "cardio" |
  "bodyweight" |
  "flexibility" |
  "isometric";

type muscles = "Chest" |
  "Back" |
  "Shoulders" |
  "Biceps" |
  "Triceps" |
  "Forearms" |
  "Quads" |
  "Hamstrings" |
  "Glutes" |
  "Calves" |
  "Abs/Core" |
  "Full Body"

export type SessionExerciseProps = {
  exercise_id: number,
  exercise_name: string,
  exercise_type: exerciseType,
  exercise_order: number,
  equipment_name: string,
  set_count: number,
  rep_count: number | null,
  instructions: string[],
  muscle_group: [muscles],
  description: string,
  duration_seconds: number | null,
  rest_seconds: number,
  weight_guidance: string,
};


export type WorkoutSessionProps = {
  id: number;
  order: number;
  is_rest_day: boolean;
  rest_day_notes: string;
  title: string;
  exercises: SessionExerciseProps[];
  day_order: number;
  session_date: string;
};