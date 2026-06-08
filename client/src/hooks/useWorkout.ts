import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { WorkoutLog, WorkoutLogPayload, workoutService } from "@/src/services/workout.service";
import type { WorkoutPlanProps } from "@/src/types/workout";

export type LogModalState = {
  visible: boolean;
  exerciseId: number | null;
  exerciseName: string;
  dayId: number | null;
  defaultSets: number | null;
  defaultReps: number | null;
  defaultDuration: number | null;
};

const EMPTY_MODAL: LogModalState = {
  visible: false,
  exerciseId: null,
  exerciseName: "",
  dayId: null,
  defaultSets: null,
  defaultReps: null,
  defaultDuration: null,
};

/** Build a local lookup key: "dayId-exerciseId" */
export const logKey = (dayId: number, exerciseId: number) =>
  `${dayId}-${exerciseId}`;

export function useWorkout() {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [checkedExercises, setCheckedExercises] = useState<
    Record<string, WorkoutLog>
  >({});

  const [loadingDays, setLoadingDays] = useState<Record<number, boolean>>({});
  const [modal, setModal] = useState<LogModalState>(EMPTY_MODAL);
  const [formSets, setFormSets] = useState("");
  const [formReps, setFormReps] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [allLogs, setAllLogs] = useState<WorkoutLog[]>([]);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await workoutService.getAllLogs();
      setAllLogs(history);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshWorkoutPlan = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plans, todayLogs] = await Promise.all([
        workoutService.getWorkout(),
        workoutService.getTodayLogs(),
      ]);
      setWorkoutPlans(plans);
      if (plans.length > 0) setExpandedPlan(plans[0].id);

      const initial: Record<string, WorkoutLog> = {};
      for (const log of todayLogs) {
        const dayId = (log as WorkoutLog & { workout_day_id: number })
          .workout_day_id;
        if (dayId != null)
          initial[logKey(dayId, log.workout_exercise_id)] = log;
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
      refreshWorkoutPlan();
    }, [refreshWorkoutPlan]),
  );

  const fetchDayLogs = useCallback(
    async (dayId: number) => {
      const alreadyLoaded = Object.keys(checkedExercises).some((k) =>
        k.startsWith(`${dayId}-`),
      );
      if (alreadyLoaded || loadingDays[dayId]) return;
      setLoadingDays((prev) => ({ ...prev, [dayId]: true }));
      try {
        const logs = await workoutService.getDayLogs(dayId);
        if (!Array.isArray(logs)) return;
        const updates: Record<string, WorkoutLog> = {};
        for (const log of logs) {
          updates[logKey(dayId, log.workout_exercise_id)] = log;
        }
        setCheckedExercises((prev) => ({ ...prev, ...updates }));
      } finally {
        setLoadingDays((prev) => ({ ...prev, [dayId]: false }));
      }
    },
    [checkedExercises, loadingDays],
  );

  const togglePlan = useCallback(
    (planId: number) => {
      setExpandedPlan(expandedPlan === planId ? null : planId);
      setExpandedDay(null);
    },
    [expandedPlan],
  );

  const togglePlanStatus = async (planId: number, isActive: boolean) => {
    try {
      await workoutService.updatePlanStatus(planId, isActive);
      refreshWorkoutPlan();
    } catch (err) {
      console.error(err);
    }
  };

  const deletePlan = async (planId: number) => {
    try {
      await workoutService.deletePlan(planId);
      setWorkoutPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDay = useCallback(
    (dayId: number) => {
      const next = expandedDay === dayId ? null : dayId;
      setExpandedDay(next);
      if (next !== null) fetchDayLogs(next);
    },
    [expandedDay, fetchDayLogs],
  );

  const isExerciseChecked = useCallback(
    (dayId: number, exerciseId: number) =>
      !!checkedExercises[logKey(dayId, exerciseId)],
    [checkedExercises],
  );

  const getDayProgress = useCallback(
    (dayId: number, exercises: { id: number }[] | undefined) => {
      if (!exercises?.length) return { done: 0, total: 0 };
      const done = exercises.filter((ex) =>
        isExerciseChecked(dayId, ex.id),
      ).length;
      return { done, total: exercises.length };
    },
    [isExerciseChecked],
  );

  const isDayComplete = useCallback(
    (dayId: number, exercises: { id: number }[] | undefined) => {
      const { done, total } = getDayProgress(dayId, exercises);
      return total > 0 && done === total;
    },
    [getDayProgress],
  );

  const openLogModal = useCallback(
    (
      dayId: number,
      exerciseId: number,
      exerciseName: string,
      defaultSets: number | null,
      defaultReps: number | null,
      defaultDuration: number | null,
    ) => {
      const existing = checkedExercises[logKey(dayId, exerciseId)];
      setFormSets(String(existing?.completed_sets ?? defaultSets ?? ""));
      setFormReps(String(existing?.completed_reps ?? defaultReps ?? ""));
      const existingDurationSeconds = existing?.duration_seconds ?? null;
      setFormDuration(
        String(existingDurationSeconds ?? defaultDuration ?? ""),
      );
      setFormWeight(String(existing?.weight_used_kg ?? ""));
      setFormDifficulty(String(existing?.difficulty_rating ?? ""));
      setModal({
        visible: true,
        exerciseId,
        exerciseName,
        dayId,
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
  }, []);

  const uncheckExercise = useCallback(
    async (dayId: number, exerciseId: number) => {
      setCheckedExercises((prev) => {
        const next = { ...prev };
        delete next[logKey(dayId, exerciseId)];
        return next;
      });
      await workoutService.removeLog(exerciseId);
    },
    [],
  );

  // when called without args, falls back to modal form state (used by ExerciseDetailModal)
  const saveLog = useCallback(
    async (directPayload?: WorkoutLogPayload) => {
      if (directPayload) {
        // Called directly from WorkoutSession — no modal state involved
        setIsSaving(true);
        try {
          const data = await workoutService.logExercise(directPayload);
          // We don't have a dayId here, so we can't update checkedExercises.
          // WorkoutSession navigates away after this, so no stale UI to worry about.
          return data;
        } finally {
          setIsSaving(false);
        }
      }

      // Called from modal form
      if (!modal.exerciseId || !modal.dayId) return;
      setIsSaving(true);
      try {
        const durationSeconds = formDuration ? parseInt(formDuration) : null;

        const data = await workoutService.logExercise({
          workout_exercise_id: modal.exerciseId,
          completed_sets: formSets ? parseInt(formSets) : null,
          completed_reps: formReps ? parseInt(formReps) : null,
          duration_seconds: durationSeconds,
          weight_used_kg: formWeight ? parseFloat(formWeight) : null,
          difficulty_rating: formDifficulty ? parseInt(formDifficulty) : null,
        });

        setCheckedExercises((prev) => ({
          ...prev,
          [logKey(modal.dayId!, modal.exerciseId!)]: data,
        }));
        closeModal();
        return data;
      } finally {
        setIsSaving(false);
      }
    },
    [
      modal,
      formSets,
      formReps,
      formDuration,
      formWeight,
      formDifficulty,
      closeModal,
    ],
  );

  function calculateStreak(logs: { logged_at: string | Date }[]): number {
    if (!logs || logs.length === 0) return 0;

    // 1. Extract unique dates (YYYY-MM-DD format) and sort them descending (newest first)
    const uniqueDates = Array.from(
      new Set(
        logs.map(log => {
          const date = new Date(log.logged_at);
          return date.toISOString().split('T')[0];
        })
      )
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (uniqueDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate yesterday's date string safely
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const mostRecentLogDate = uniqueDates[0];

    // 2. If the user hasn't logged anything today AND hasn't logged anything yesterday, 
    // then their active streak has officially broken/cooled down to 0.
    if (mostRecentLogDate !== todayStr && mostRecentLogDate !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let currentCheckDate = new Date(mostRecentLogDate);

    // 3. Loop through our unique dates array and count how many consecutive days exist
    for (const dateStr of uniqueDates) {
      const expectedStr = currentCheckDate.toISOString().split('T')[0];

      if (dateStr === expectedStr) {
        streak++;
        // Move our target comparison date back exactly 1 day
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      } else {
        // The chain is broken! Stop counting.
        break;
      }
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

    // 💡 DYNAMIC UX DATA GENERATOR BASED ON PERFORMANCE VARIANCE
    let streakSubtext = "Keep up the momentum! 🔥";
    if (streak === 0) {
      streakSubtext = "Start a new workout streak today! Let's go!";
    } else if (streak >= 3 && streak < 7) {
      streakSubtext = "You're building an unstoppable habit! 🚀";
    } else if (streak >= 7) {
      streakSubtext = "Elite consistency! You are an inspiration! 👑";
    }

    let activityBadge = "Starting Out";
    let activityColor = "text-text-secondary";
    if (caloriesBurned > 400 || activeMinutes > 45) {
      activityBadge = "Beast Mode";
      activityColor = "text-accent"; // Assumed your design system accommodates emphasis colors
    } else if (caloriesBurned > 150 || activeMinutes > 15) {
      activityBadge = "Solid Session";
      activityColor = "text-primary";
    }

    return {
      workoutsCompleted,
      activeMinutes,
      caloriesBurned,
      streak,
      streakSubtext,
      activityBadge,
      activityColor
    };
  }, [checkedExercises, allLogs]);


  return {
    workoutPlans,
    isLoading,
    expandedPlan,
    expandedDay,
    checkedExercises,
    loadingDays,
    modal,
    formSets,
    setFormSets,
    formReps,
    setFormReps,
    formDuration,
    setFormDuration,
    formWeight,
    setFormWeight,
    formDifficulty,
    setFormDifficulty,
    isSaving,
    refreshWorkoutPlan,
    fetchDayLogs,
    togglePlan,
    toggleDay,
    isExerciseChecked,
    getDayProgress,
    isDayComplete,
    openLogModal,
    closeModal,
    uncheckExercise,
    togglePlanStatus,
    deletePlan,
    saveLog,
    logKey,
    fetchHistory,
    allLogs,
    todayStats: getTodayStats(),
  };
}