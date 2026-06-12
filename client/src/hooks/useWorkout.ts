import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { WorkoutLog, WorkoutLogPayload, workoutService } from "@/src/services/workout.service";
import type { WorkoutSessionProps } from "@/src/types/workout";

export type LogModalState = {
  visible: boolean;
  exerciseId: number | null;
  exerciseName: string;
  sessionId: number | null;
  defaultSets: number | null;
  defaultReps: number | null;
  defaultDuration: number | null;
};

const EMPTY_MODAL: LogModalState = {
  visible: false,
  exerciseId: null,
  exerciseName: "",
  sessionId: null,
  defaultSets: null,
  defaultReps: null,
  defaultDuration: null,
};

export const logKey = (sessionId: number, exerciseId: number) =>
  `${sessionId}-${exerciseId}`;

export function useWorkout() {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSessionProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [checkedExercises, setCheckedExercises] = useState<Record<string, WorkoutLog>>({});
  const [loadingSessions, setLoadingSessions] = useState<Record<number, boolean>>({});
  const [modal, setModal] = useState<LogModalState>(EMPTY_MODAL);
  const [formSets, setFormSets] = useState("");
  const [formReps, setFormReps] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [allLogs, setAllLogs] = useState<WorkoutLog[]>([]);
  const [formNotes, setFormNotes] = useState("");

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await workoutService.getAllLogs();
      setAllLogs(history);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshWorkoutSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessions, todayLogs] = await Promise.all([
        workoutService.getWorkoutSessions(),
        workoutService.getTodayLogs(),
      ]);

      setWorkoutSessions(sessions);

      console.log("SESSIONS:", sessions)
      console.log("TODAY LOGS: ", todayLogs)

      const initial: Record<string, WorkoutLog> = {};
      for (const log of todayLogs) {
        const sessionId = (log as WorkoutLog & { workout_session_id: number }).workout_session_id;
        if (sessionId != null)
          initial[logKey(sessionId, log.session_exercise_id)] = log;
      }
      setCheckedExercises(initial);
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshWorkoutSessions();
    }, [refreshWorkoutSessions]),
  );

  const fetchSessionLogs = useCallback(
    async (sessionId: number) => {
      const alreadyLoaded = Object.keys(checkedExercises).some((k) =>
        k.startsWith(`${sessionId}-`),
      );
      if (alreadyLoaded || loadingSessions[sessionId]) return;
      setLoadingSessions((prev) => ({ ...prev, [sessionId]: true }));
      try {
        const logs = await workoutService.getSessionLogs(sessionId);
        if (!Array.isArray(logs)) return;
        const updates: Record<string, WorkoutLog> = {};
        for (const log of logs) {
          updates[logKey(sessionId, log.session_exercise_id)] = log;
        }
        setCheckedExercises((prev) => ({ ...prev, ...updates }));
      } finally {
        setLoadingSessions((prev) => ({ ...prev, [sessionId]: false }));
      }
    },
    [checkedExercises, loadingSessions],
  );

  const toggleSession = useCallback(
    (sessionId: number) => {
      const next = expandedSession === sessionId ? null : sessionId;
      setExpandedSession(next);
      if (next !== null) fetchSessionLogs(next);
    },
    [expandedSession, fetchSessionLogs],
  );

  const deleteSession = async (sessionId: number) => {
    try {
      await workoutService.deleteSession(sessionId);
      setWorkoutSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error(err);
    }
  };

  const isExerciseChecked = useCallback(
    (sessionId: number, exerciseId: number) =>
      !!checkedExercises[logKey(sessionId, exerciseId)],
    [checkedExercises],
  );

  const getSessionProgress = useCallback(
    (sessionId: number, exercises: { id: number }[] | undefined) => {
      if (!exercises?.length) return { done: 0, total: 0 };
      const done = exercises.filter((ex) =>
        isExerciseChecked(sessionId, ex.id),
      ).length;
      return { done, total: exercises.length };
    },
    [isExerciseChecked],
  );

  const isSessionComplete = useCallback(
    (sessionId: number, exercises: { id: number }[] | undefined) => {
      const { done, total } = getSessionProgress(sessionId, exercises);
      return total > 0 && done === total;
    },
    [getSessionProgress],
  );

  const openLogModal = useCallback(
    (
      sessionId: number,
      exerciseId: number,
      exerciseName: string,
      defaultSets: number | null,
      defaultReps: number | null,
      defaultDuration: number | null,
    ) => {
      const existing = checkedExercises[logKey(sessionId, exerciseId)];
      setFormSets(String(existing?.completed_sets ?? defaultSets ?? ""));
      setFormReps(String(existing?.completed_reps ?? defaultReps ?? ""));
      setFormDuration(String(existing?.duration_seconds ?? defaultDuration ?? ""));
      setFormWeight(String(existing?.weight_used_kg ?? ""));
      setFormDifficulty(String(existing?.difficulty_rating ?? ""));
      setModal({
        visible: true,
        exerciseId,
        exerciseName,
        sessionId,
        defaultSets,
        defaultReps,
        defaultDuration,
      });
    },
    [checkedExercises],
  );

  const closeModal = useCallback(() => {
    setModal(EMPTY_MODAL);
    setFormSets("");
    setFormReps("");
    setFormDuration("");
    setFormWeight("");
    setFormDifficulty("");
    setFormNotes(""); // <-- Clear notes here
  }, []);

  const uncheckExercise = useCallback(
    async (sessionId: number, exerciseId: number) => {
      setCheckedExercises((prev) => {
        const next = { ...prev };
        delete next[logKey(sessionId, exerciseId)];
        return next;
      });
      await workoutService.removeLog(exerciseId);
    },
    [],
  );

  const saveLog = useCallback(
    async (directPayload?: WorkoutLogPayload & { notes?: string | null }) => {
      if (directPayload) {
        setIsSaving(true);
        try {
          return await workoutService.logExercise(directPayload);
        } finally {
          setIsSaving(false);
        }
      }

      if (!modal.exerciseId || !modal.sessionId) return;
      setIsSaving(true);
      try {
        const data = await workoutService.logExercise({
          session_exercise_id: modal.exerciseId,
          completed_sets: formSets ? parseInt(formSets) : null,
          completed_reps: formReps ? parseInt(formReps) : null,
          duration_seconds: formDuration ? parseInt(formDuration) : null,
          weight_used_kg: formWeight ? parseFloat(formWeight) : null,
          difficulty_rating: formDifficulty ? parseInt(formDifficulty) : null,
          notes: formNotes.trim() ? formNotes.trim() : null,
        });

        setCheckedExercises((prev) => ({
          ...prev,
          [logKey(modal.sessionId!, modal.exerciseId!)]: data,
        }));
        closeModal();
        return data;
      } finally {
        setIsSaving(false);
      }
    },
    [modal, formSets, formReps, formDuration, formWeight, formDifficulty, formNotes, closeModal],
  );

  function calculateStreak(logs: { logged_at: string | Date }[]): number {
    if (!logs || logs.length === 0) return 0;
    const uniqueDates = Array.from(
      new Set(logs.map((log) => new Date(log.logged_at).toISOString().split("T")[0]))
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (!uniqueDates.length) return 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

    let streak = 0;
    let currentCheckDate = new Date(uniqueDates[0]);
    for (const dateStr of uniqueDates) {
      if (dateStr === currentCheckDate.toISOString().split("T")[0]) {
        streak++;
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      } else break;
    }
    return streak;
  }

  const getTodayStats = useCallback(() => {
    const logs = Object.values(checkedExercises);
    const workoutsCompleted = logs.length;
    const totalSeconds = logs.reduce((sum, log) => sum + (log.duration_seconds ?? 0), 0);
    const activeMinutes = Math.round(totalSeconds / 60);
    const caloriesBurned = logs.reduce((sum, log) => sum + (log.calories_burned ?? 0), 0);
    const streak = calculateStreak(allLogs);

    let streakSubtext = "Keep up the momentum! 🔥";
    if (streak === 0) streakSubtext = "Start a new workout streak today! Let's go!";
    else if (streak >= 3 && streak < 7) streakSubtext = "You're building an unstoppable habit! 🚀";
    else if (streak >= 7) streakSubtext = "Elite consistency! You are an inspiration! 👑";

    let activityBadge = "Starting Out";
    let activityColor = "text-text-secondary";
    if (caloriesBurned > 400 || activeMinutes > 45) { activityBadge = "Beast Mode"; activityColor = "text-accent"; }
    else if (caloriesBurned > 150 || activeMinutes > 15) { activityBadge = "Solid Session"; activityColor = "text-primary"; }

    return { workoutsCompleted, activeMinutes, caloriesBurned, streak, streakSubtext, activityBadge, activityColor };
  }, [checkedExercises, allLogs]);

  return {
    workoutSessions,
    isLoading,
    expandedSession,
    checkedExercises,
    loadingSessions,
    modal,
    formNotes,
    setFormNotes,
    formSets, setFormSets,
    formReps, setFormReps,
    formDuration, setFormDuration,
    formWeight, setFormWeight,
    formDifficulty, setFormDifficulty,
    isSaving,
    refreshWorkoutSessions,
    fetchSessionLogs,
    toggleSession,
    isExerciseChecked,
    getSessionProgress,
    isSessionComplete,
    openLogModal,
    closeModal,
    uncheckExercise,
    deleteSession,
    saveLog,
    logKey,
    fetchHistory,
    allLogs,
    todayStats: getTodayStats(),
  };
}