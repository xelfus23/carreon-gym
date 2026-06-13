import { WebSocket } from "ws";
import {
  getTodayLogsDomain,
  getSessionLogsDomain,
  getAllLogsDomain,
} from "../../domain/workout/workoutLogDomain.ts";

export const getWorkoutLogs = async (
  ws: WebSocket,
  args: { scope: "today" | "session" | "all"; session_id?: number },
  userId: number,
) => {
  const { scope, session_id } = args;

  if (scope === "today") {
    const logs = await getTodayLogsDomain(userId);
    if (logs.length === 0) return { message: "No exercises logged today." };
    return formatLogs(logs);
  }

  if (scope === "session") {
    if (!session_id) throw new Error("session_id is required when scope is 'session'");
    const logs = await getSessionLogsDomain(userId, session_id);
    if (logs.length === 0) return { message: `No logs found for session ${session_id}.` };
    return formatLogs(logs);
  }

  if (scope === "all") {
    const logs = await getAllLogsDomain(userId);
    if (logs.length === 0) return { message: "No workout logs found." };
    return formatLogs(logs);
  }

  throw new Error(`Invalid scope: "${scope}"`);
};

function formatLogs(logs: any[]) {
  // Group by session
  const sessionsMap = new Map<number, any>();

  for (const log of logs) {
    const sessionId = log.workout_session_id;

    if (!sessionsMap.has(sessionId)) {
      sessionsMap.set(sessionId, {
        session_id: sessionId,
        logged_at: log.logged_at,
        total_calories: 0,
        exercises: [],
      });
    }

    const session = sessionsMap.get(sessionId);
    session.total_calories += log.calories_burned ?? 0;

    // Determine completion status vs plan
    const completedSets = log.completed_sets ?? 0;
    const plannedSets = log.planned_sets ?? 0;
    const completedReps = log.completed_reps ?? 0;
    const plannedReps = log.planned_reps ?? 0;

    session.exercises.push({
      exercise_name: log.exercise_name,
      planned: {
        sets: plannedSets || null,
        reps: plannedReps || null,
        duration_seconds: log.planned_duration_seconds ?? null,
      },
      completed: {
        sets: completedSets || null,
        reps: completedReps || null,
        duration_seconds: log.duration_seconds ?? null,
        weight_kg: log.weight_used_kg ?? null,
      },
      hit_target:
        plannedSets > 0 && plannedReps > 0
          ? completedSets >= plannedSets && completedReps >= plannedReps
          : null,
      difficulty_rating: log.difficulty_rating ?? null,
      calories_burned: log.calories_burned ?? 0,
      notes: log.notes ?? null,
    });
  }

  return {
    sessions: Array.from(sessionsMap.values()),
    summary: {
      total_sessions: sessionsMap.size,
      total_exercises: logs.length,
      total_calories: logs.reduce((sum, l) => sum + (l.calories_burned ?? 0), 0),
    },
  };
}