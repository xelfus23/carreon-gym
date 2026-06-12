export type WorkoutExerciseProps = {
  id: number;
  name: string;
  equipment_name: string[];
  sets: number;
  reps: number | null;
  duration_seconds: number | null;
  notes: string;
};

export type WorkoutSessionProps = {
  id: number;
  order: number;
  is_rest_day: boolean;
  rest_day_notes: string;
  title: string;
  exercises: WorkoutExerciseProps[];
  day_order: number;
  session_date: string;
};