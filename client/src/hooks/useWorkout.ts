import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { WorkoutLog, workoutService } from "@/src/services/workoutService";
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
            // Convert duration_minutes from log to seconds for display
            const existingDurationSeconds = existing?.duration_minutes
                ? existing.duration_minutes * 60
                : null;
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

    const saveLog = useCallback(async () => {
        if (!modal.exerciseId || !modal.dayId) return;
        setIsSaving(true);
        try {
            // Convert duration_seconds to duration_minutes for the API
            const durationMinutes = formDuration
                ? Math.round(parseInt(formDuration) / 60)
                : null;

            const data = await workoutService.logExercise({
                workout_exercise_id: modal.exerciseId,
                completed_sets: formSets ? parseInt(formSets) : null,
                completed_reps: formReps ? parseInt(formReps) : null,
                duration_minutes: durationMinutes,
                weight_used_kg: formWeight ? parseFloat(formWeight) : null,
                difficulty_rating: formDifficulty
                    ? parseInt(formDifficulty)
                    : null,
            });
            setCheckedExercises((prev) => ({
                ...prev,
                [logKey(modal.dayId!, modal.exerciseId!)]: data!,
            }));
            closeModal();
        } finally {
            setIsSaving(false);
        }
    }, [
        modal.exerciseId,
        modal.dayId,
        formSets,
        formReps,
        formDuration,
        formWeight,
        formDifficulty,
        closeModal,
    ]);

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
        saveLog,
        logKey,
    };
}
