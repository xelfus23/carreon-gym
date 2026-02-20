import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { WorkoutLog, workoutService } from "@/src/services/workoutService";
import Loader from "../../components/Loader";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutPlanProps } from "@/src/types/workout";
import { COLORS } from "@/src/consts/colors";
import { Dumbbell } from "lucide-react-native";

// ---------------------------------------------------------------------------
// Types — aligned with your DB schema:
//   workout_plans   → WorkoutPlanProps
//   workout_days    → day.id, day.day_order, day.title, day.is_rest_day
//   workout_exercises → exercise.id, exercise.exercise_name, exercise.sets,
//                       exercise.reps, exercise.equipment (joined name)
// ---------------------------------------------------------------------------

type LogModalState = {
    visible: boolean;
    exerciseId: number | null;
    exerciseName: string;
    dayId: number | null;
    defaultSets: number | null;
    defaultReps: number | null;
};

const EMPTY_MODAL: LogModalState = {
    visible: false,
    exerciseId: null,
    exerciseName: "",
    dayId: null,
    defaultSets: null,
    defaultReps: null,
};

/** Build a local lookup key: "dayId-exerciseId" */
const logKey = (dayId: number, exerciseId: number) => `${dayId}-${exerciseId}`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Plans() {
    const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);

    /**
     * Persisted exercise logs for today.
     * key = "dayId-exerciseId", value = the WorkoutLog row from the DB.
     * Presence of a key = exercise is checked/done.
     */
    const [checkedExercises, setCheckedExercises] = useState<
        Record<string, WorkoutLog>
    >({});

    /** Per-day loading state so we can show a subtle indicator */
    const [loadingDays, setLoadingDays] = useState<Record<number, boolean>>({});

    // Log modal state
    const [modal, setModal] = useState<LogModalState>(EMPTY_MODAL);
    const [formSets, setFormSets] = useState("");
    const [formReps, setFormReps] = useState("");
    const [formWeight, setFormWeight] = useState("");
    const [formDifficulty, setFormDifficulty] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // ---------------------------------------------------------------------------
    // Data fetching
    // ---------------------------------------------------------------------------

    const refreshWorkoutPlan = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await workoutService.getWorkout();

            setWorkoutPlans(data);
            
            if (data.length > 0) setExpandedPlan(data[0].id);
        } catch (err) {
            if (err instanceof Error) {
                console.error(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshWorkoutPlan();
        }, [refreshWorkoutPlan]),
    );

    /**
     * Lazy-load today's logs for a day when first expanded.
     * Uses workout_day_id (= workout_days.id per your schema).
     */
    const fetchDayLogs = useCallback(
        async (dayId: number) => {
            const alreadyLoaded = Object.keys(checkedExercises).some((k) =>
                k.startsWith(`${dayId}-`),
            );
            if (alreadyLoaded || loadingDays[dayId]) return;

            setLoadingDays((prev) => ({ ...prev, [dayId]: true }));
            try {
                const data = await workoutService.getDayLogs(dayId);

                const updates: Record<string, WorkoutLog> = {};
                for (const log of data) {
                    updates[logKey(dayId, log.workout_exercise_id as number)] =
                        log;
                }
                setCheckedExercises((prev) => ({ ...prev, ...updates }));
            } finally {
                setLoadingDays((prev) => ({ ...prev, [dayId]: false }));
            }
        },
        [checkedExercises, loadingDays],
    );

    // ---------------------------------------------------------------------------
    // Expand / collapse
    // ---------------------------------------------------------------------------

    const togglePlan = (planId: number) => {
        setExpandedPlan(expandedPlan === planId ? null : planId);
        setExpandedDay(null);
    };

    const toggleDay = (dayId: number) => {
        const next = expandedDay === dayId ? null : dayId;
        setExpandedDay(next);
        if (next !== null) fetchDayLogs(next);
    };

    // ---------------------------------------------------------------------------
    // Checklist helpers
    // ---------------------------------------------------------------------------

    const isExerciseChecked = (dayId: number, exerciseId: number) =>
        !!checkedExercises[logKey(dayId, exerciseId)];

    const getDayProgress = (dayId: number, exercises: any[]) => {
        if (!exercises?.length) return { done: 0, total: 0 };
        const done = exercises.filter((ex) =>
            isExerciseChecked(dayId, ex.id),
        ).length;
        return { done, total: exercises.length };
    };

    const isDayComplete = (dayId: number, exercises: any[]) => {
        const { done, total } = getDayProgress(dayId, exercises);
        return total > 0 && done === total;
    };

    // ---------------------------------------------------------------------------
    // Modal helpers
    // ---------------------------------------------------------------------------

    const openLogModal = (
        dayId: number,
        exerciseId: number,
        exerciseName: string,
        defaultSets: number | null,
        defaultReps: number | null,
    ) => {
        const existing = checkedExercises[logKey(dayId, exerciseId)];
        setFormSets(String(existing?.completed_sets ?? defaultSets ?? ""));
        setFormReps(String(existing?.completed_reps ?? defaultReps ?? ""));
        setFormWeight(String(existing?.weight_used_kg ?? ""));
        setFormDifficulty(String(existing?.difficulty_rating ?? ""));
        setModal({
            visible: true,
            exerciseId,
            exerciseName,
            dayId,
            defaultSets,
            defaultReps,
        });
    };

    const closeModal = () => {
        setModal(EMPTY_MODAL);
        setFormSets("");
        setFormReps("");
        setFormWeight("");
        setFormDifficulty("");
    };

    /** Uncheck → optimistic local removal + DELETE to backend */
    const uncheckExercise = async (dayId: number, exerciseId: number) => {
        setCheckedExercises((prev) => {
            const next = { ...prev };
            delete next[logKey(dayId, exerciseId)];
            return next;
        });
        await workoutService.removeLog(exerciseId);
    };

    /** Save → POST to backend → mark checked in local state */
    const saveLog = async () => {
        if (!modal.exerciseId || !modal.dayId) return;
        setIsSaving(true);
        try {
            const response = await workoutService.logExercise({
                workout_exercise_id: modal.exerciseId,
                completed_sets: formSets ? parseInt(formSets) : null,
                completed_reps: formReps ? parseInt(formReps) : null,
                weight_used_kg: formWeight ? parseFloat(formWeight) : null,
                difficulty_rating: formDifficulty
                    ? parseInt(formDifficulty)
                    : null,
            });

            if (response.success && response.data) {
                setCheckedExercises((prev) => ({
                    ...prev,
                    [logKey(modal.dayId!, modal.exerciseId!)]: response.data!,
                }));
                closeModal();
            }
        } finally {
            setIsSaving(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Sub-components
    // ---------------------------------------------------------------------------

    const DifficultySelector = () => (
        <View>
            <Text className="text-text-secondary text-xs mb-2">
                Difficulty (1 = easy · 10 = max effort)
            </Text>
            <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <TouchableOpacity
                        key={n}
                        onPress={() => setFormDifficulty(String(n))}
                        className={`w-9 h-9 rounded-lg items-center justify-center border ${
                            formDifficulty === String(n)
                                ? "bg-primary border-primary"
                                : "border-border bg-background"
                        }`}
                    >
                        <Text
                            className={`text-sm font-bold ${
                                formDifficulty === String(n)
                                    ? "text-white"
                                    : "text-text-secondary"
                            }`}
                        >
                            {n}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // ---------------------------------------------------------------------------
    // Early returns
    // ---------------------------------------------------------------------------

    if (isLoading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Loader size={50} />
                <Text className="text-text-secondary mt-4">
                    Loading your workout plans...
                </Text>
            </View>
        );
    }

    if (workoutPlans.length === 0) {
        return (
            <View className="items-center justify-center flex-1 bg-background p-12">
                <View className="rotate-45">
                    <Dumbbell color={COLORS.textSecondary} size={45} />
                </View>
                <Text className="text-text-primary font-bold text-xl mt-4 text-center">
                    No Workout Plans Yet
                </Text>
                <Text className="text-text-secondary text-center mt-2">
                    Chat with your AI trainer to create a personalized workout
                    plan!
                </Text>
            </View>
        );
    }

    // ---------------------------------------------------------------------------
    // Main render
    // ---------------------------------------------------------------------------

    return (
        <>
            <ScrollView
                className="flex-1 bg-background"
                showsVerticalScrollIndicator={false}
            >
                <View className="p-4 gap-4">
                    {/* Header */}
                    <View className="mb-2">
                        <Text className="text-text-primary font-bold text-2xl">
                            My Workout Plans
                        </Text>
                        <Text className="text-text-secondary text-sm mt-1">
                            {workoutPlans.length}{" "}
                            {workoutPlans.length === 1 ? "plan" : "plans"} saved
                        </Text>
                    </View>

                    {/* Plans */}
                    {workoutPlans.map((plan, planIndex) => (
                        <View
                            key={plan.id}
                            className="bg-surface rounded-2xl overflow-hidden border border-border"
                        >
                            {/* ── Plan Header ──────────────────────────── */}
                            <TouchableOpacity
                                onPress={() => togglePlan(plan.id)}
                                className="p-4 flex-row items-center justify-between"
                                activeOpacity={0.7}
                            >
                                <View className="flex-1 mr-3">
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className="bg-primary/20 px-3 py-1 rounded-full">
                                            <Text className="text-primary font-semibold text-xs">
                                                Plan {planIndex + 1}
                                            </Text>
                                        </View>
                                        {plan.is_active && (
                                            <View className="bg-green-500/20 px-3 py-1 rounded-full">
                                                <Text className="text-green-500 font-semibold text-xs">
                                                    Active
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-text-primary font-bold text-lg">
                                        {plan.title}
                                    </Text>
                                    {plan.description && (
                                        <Text
                                            className="text-text-secondary text-sm mt-1"
                                            numberOfLines={2}
                                        >
                                            {plan.description}
                                        </Text>
                                    )}
                                    <Text className="text-text-secondary text-xs mt-2">
                                        {plan.days?.length || 0} days
                                    </Text>
                                </View>
                                <Ionicons
                                    name={
                                        expandedPlan === plan.id
                                            ? "chevron-up"
                                            : "chevron-down"
                                    }
                                    size={24}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>

                            {/* ── Days ─────────────────────────────────── */}
                            {expandedPlan === plan.id && (
                                <View className="border-t border-border">
                                    {plan.days?.map((day) => {
                                        const progress = getDayProgress(
                                            day.id,
                                            day.exercises ?? [],
                                        );
                                        const complete = isDayComplete(
                                            day.id,
                                            day.exercises ?? [],
                                        );

                                        return (
                                            <View
                                                key={day.id}
                                                className="border-b border-border/50 last:border-b-0"
                                            >
                                                {/* Day Header */}
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        toggleDay(day.id)
                                                    }
                                                    className="p-4 flex-row items-center justify-between bg-background/30"
                                                    activeOpacity={0.7}
                                                >
                                                    <View className="flex-1 flex-row items-center gap-3">
                                                        {/* Day badge → green checkmark when complete */}
                                                        <View
                                                            className={`w-10 h-10 rounded-full items-center justify-center ${
                                                                complete
                                                                    ? "bg-green-500/20"
                                                                    : "bg-primary/10"
                                                            }`}
                                                        >
                                                            {complete ? (
                                                                <Ionicons
                                                                    name="checkmark"
                                                                    size={18}
                                                                    color="#10B981"
                                                                />
                                                            ) : (
                                                                <Text className="text-primary font-bold text-sm">
                                                                    {/* day_order from workout_days */}
                                                                    D
                                                                    {
                                                                        day.day_order
                                                                    }
                                                                </Text>
                                                            )}
                                                        </View>

                                                        <View className="flex-1">
                                                            <Text className="text-text-primary font-semibold text-base">
                                                                {day.title}
                                                            </Text>
                                                            {day.is_rest_day ? (
                                                                <Text className="text-text-secondary text-xs mt-0.5">
                                                                    Rest &
                                                                    Recovery
                                                                </Text>
                                                            ) : loadingDays[
                                                                  day.id
                                                              ] ? (
                                                                <Text className="text-text-secondary text-xs mt-0.5">
                                                                    Loading...
                                                                </Text>
                                                            ) : (
                                                                <Text
                                                                    className={`text-xs mt-0.5 ${
                                                                        complete
                                                                            ? "text-green-500 font-semibold"
                                                                            : "text-text-secondary"
                                                                    }`}
                                                                >
                                                                    {complete
                                                                        ? "✓ Completed today!"
                                                                        : `${progress.done}/${progress.total} exercises done`}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                    <Ionicons
                                                        name={
                                                            expandedDay ===
                                                            day.id
                                                                ? "chevron-up"
                                                                : "chevron-down"
                                                        }
                                                        size={20}
                                                        color="#9CA3AF"
                                                    />
                                                </TouchableOpacity>

                                                {/* ── Exercises ──────────── */}
                                                {expandedDay === day.id && (
                                                    <View className="px-4 pb-4">
                                                        {day.is_rest_day ? (
                                                            <View className="bg-blue-500/10 p-4 rounded-xl mt-2">
                                                                <View className="flex-row items-center gap-2 mb-2">
                                                                    <Ionicons
                                                                        name="bed-outline"
                                                                        size={
                                                                            20
                                                                        }
                                                                        color="#3B82F6"
                                                                    />
                                                                    <Text className="text-blue-500 font-semibold">
                                                                        Rest Day
                                                                        Activities
                                                                    </Text>
                                                                </View>
                                                                <Text className="text-text-secondary text-sm">
                                                                    {day.rest_day_notes ||
                                                                        "Take a complete rest or do light stretching"}
                                                                </Text>
                                                            </View>
                                                        ) : day.exercises
                                                              ?.length ? (
                                                            <View className="gap-3 mt-2">
                                                                {day.exercises.map(
                                                                    (
                                                                        exercise,
                                                                        exerciseIndex,
                                                                    ) => {
                                                                        const checked =
                                                                            isExerciseChecked(
                                                                                day.id,
                                                                                exercise.id,
                                                                            );
                                                                        const log =
                                                                            checkedExercises[
                                                                                logKey(
                                                                                    day.id,
                                                                                    exercise.id,
                                                                                )
                                                                            ];

                                                                        return (
                                                                            <View
                                                                                key={
                                                                                    exercise.id
                                                                                }
                                                                                className={`rounded-xl border overflow-hidden ${
                                                                                    checked
                                                                                        ? "border-green-500/30 bg-green-500/5"
                                                                                        : "border-border/50 bg-background/50"
                                                                                }`}
                                                                            >
                                                                                {/* Exercise row */}
                                                                                <TouchableOpacity
                                                                                    onPress={() => {
                                                                                        if (
                                                                                            checked
                                                                                        ) {
                                                                                            uncheckExercise(
                                                                                                day.id,
                                                                                                exercise.id,
                                                                                            );
                                                                                        } else {
                                                                                            openLogModal(
                                                                                                day.id,
                                                                                                exercise.id,
                                                                                                // schema column: exercise_name
                                                                                                exercise.exercise_name,
                                                                                                exercise.sets ??
                                                                                                    null,
                                                                                                exercise.reps ??
                                                                                                    null,
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    activeOpacity={
                                                                                        0.7
                                                                                    }
                                                                                    className="p-4 flex-row items-start gap-3"
                                                                                >
                                                                                    {/* Checkbox */}
                                                                                    <View className="mt-0.5">
                                                                                        <View
                                                                                            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                                                                                                checked
                                                                                                    ? "bg-green-500 border-green-500"
                                                                                                    : "border-border"
                                                                                            }`}
                                                                                        >
                                                                                            {checked && (
                                                                                                <Ionicons
                                                                                                    name="checkmark"
                                                                                                    size={
                                                                                                        14
                                                                                                    }
                                                                                                    color="#fff"
                                                                                                />
                                                                                            )}
                                                                                        </View>
                                                                                    </View>

                                                                                    {/* Content */}
                                                                                    <View className="flex-1">
                                                                                        <View className="flex-row items-center gap-2 mb-1">
                                                                                            <View className="w-6 h-6 bg-primary/20 rounded-md items-center justify-center">
                                                                                                <Text className="text-primary font-bold text-xs">
                                                                                                    {exerciseIndex +
                                                                                                        1}
                                                                                                </Text>
                                                                                            </View>
                                                                                            {/* schema column: exercise_name */}
                                                                                            <Text
                                                                                                className={`font-semibold text-base flex-1 ${
                                                                                                    checked
                                                                                                        ? "text-text-secondary line-through"
                                                                                                        : "text-text-primary"
                                                                                                }`}
                                                                                            >
                                                                                                {
                                                                                                    exercise.exercise_name
                                                                                                }
                                                                                            </Text>
                                                                                        </View>

                                                                                        {/* equipment_name from the join in your getWorkout() query */}
                                                                                        <View className="flex-row items-center gap-1 mb-2">
                                                                                            <Ionicons
                                                                                                name="barbell-outline"
                                                                                                size={
                                                                                                    13
                                                                                                }
                                                                                                color="#9CA3AF"
                                                                                            />
                                                                                            <Text className="text-text-secondary text-xs">
                                                                                                {exercise.equipment_name ||
                                                                                                    "Bodyweight"}
                                                                                            </Text>
                                                                                        </View>

                                                                                        {/* Planned sets / reps */}
                                                                                        <View className="flex-row flex-wrap gap-2">
                                                                                            {exercise.sets && (
                                                                                                <View className="bg-surface px-3 py-1.5 rounded-lg flex-row items-center gap-1.5">
                                                                                                    <Ionicons
                                                                                                        name="repeat-outline"
                                                                                                        size={
                                                                                                            13
                                                                                                        }
                                                                                                        color="#6B7280"
                                                                                                    />
                                                                                                    <Text className="text-text-secondary text-xs font-medium">
                                                                                                        {
                                                                                                            exercise.sets
                                                                                                        }{" "}
                                                                                                        sets
                                                                                                    </Text>
                                                                                                </View>
                                                                                            )}
                                                                                            {exercise.reps && (
                                                                                                <View className="bg-surface px-3 py-1.5 rounded-lg flex-row items-center gap-1.5">
                                                                                                    <Ionicons
                                                                                                        name="fitness-outline"
                                                                                                        size={
                                                                                                            13
                                                                                                        }
                                                                                                        color="#6B7280"
                                                                                                    />
                                                                                                    <Text className="text-text-secondary text-xs font-medium">
                                                                                                        {
                                                                                                            exercise.reps
                                                                                                        }{" "}
                                                                                                        reps
                                                                                                    </Text>
                                                                                                </View>
                                                                                            )}
                                                                                        </View>

                                                                                        {exercise.notes && (
                                                                                            <View className="mt-2 pt-2 border-t border-border/50">
                                                                                                <Text className="text-text-secondary text-xs leading-5">
                                                                                                    💡{" "}
                                                                                                    {
                                                                                                        exercise.notes
                                                                                                    }
                                                                                                </Text>
                                                                                            </View>
                                                                                        )}
                                                                                    </View>
                                                                                </TouchableOpacity>

                                                                                {/* Saved log summary (shown when checked) */}
                                                                                {checked &&
                                                                                    log && (
                                                                                        <View className="px-4 pb-3 flex-row flex-wrap gap-2">
                                                                                            {log.completed_sets !=
                                                                                                null && (
                                                                                                <View className="bg-green-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                                                                                                    <Ionicons
                                                                                                        name="repeat-outline"
                                                                                                        size={
                                                                                                            12
                                                                                                        }
                                                                                                        color="#10B981"
                                                                                                    />
                                                                                                    <Text className="text-green-600 text-xs font-medium">
                                                                                                        {
                                                                                                            log.completed_sets
                                                                                                        }{" "}
                                                                                                        sets
                                                                                                    </Text>
                                                                                                </View>
                                                                                            )}
                                                                                            {log.completed_reps !=
                                                                                                null && (
                                                                                                <View className="bg-green-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                                                                                                    <Ionicons
                                                                                                        name="fitness-outline"
                                                                                                        size={
                                                                                                            12
                                                                                                        }
                                                                                                        color="#10B981"
                                                                                                    />
                                                                                                    <Text className="text-green-600 text-xs font-medium">
                                                                                                        {
                                                                                                            log.completed_reps
                                                                                                        }{" "}
                                                                                                        reps
                                                                                                    </Text>
                                                                                                </View>
                                                                                            )}
                                                                                            {log.weight_used_kg !=
                                                                                                null && (
                                                                                                <View className="bg-green-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                                                                                                    <Ionicons
                                                                                                        name="barbell-outline"
                                                                                                        size={
                                                                                                            12
                                                                                                        }
                                                                                                        color="#10B981"
                                                                                                    />
                                                                                                    <Text className="text-green-600 text-xs font-medium">
                                                                                                        {
                                                                                                            log.weight_used_kg
                                                                                                        }
                                                                                                        kg
                                                                                                    </Text>
                                                                                                </View>
                                                                                            )}
                                                                                            {log.difficulty_rating !=
                                                                                                null && (
                                                                                                <View className="bg-green-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                                                                                                    <Ionicons
                                                                                                        name="flame-outline"
                                                                                                        size={
                                                                                                            12
                                                                                                        }
                                                                                                        color="#10B981"
                                                                                                    />
                                                                                                    <Text className="text-green-600 text-xs font-medium">
                                                                                                        RPE{" "}
                                                                                                        {
                                                                                                            log.difficulty_rating
                                                                                                        }
                                                                                                        /10
                                                                                                    </Text>
                                                                                                </View>
                                                                                            )}
                                                                                            {/* Edit button */}
                                                                                            <TouchableOpacity
                                                                                                onPress={() =>
                                                                                                    openLogModal(
                                                                                                        day.id,
                                                                                                        exercise.id,
                                                                                                        exercise.exercise_name,
                                                                                                        exercise.sets ??
                                                                                                            null,
                                                                                                        exercise.reps ??
                                                                                                            null,
                                                                                                    )
                                                                                                }
                                                                                                className="bg-surface px-3 py-1.5 rounded-lg flex-row items-center gap-1"
                                                                                            >
                                                                                                <Ionicons
                                                                                                    name="create-outline"
                                                                                                    size={
                                                                                                        12
                                                                                                    }
                                                                                                    color="#6B7280"
                                                                                                />
                                                                                                <Text className="text-text-secondary text-xs">
                                                                                                    Edit
                                                                                                </Text>
                                                                                            </TouchableOpacity>
                                                                                        </View>
                                                                                    )}
                                                                            </View>
                                                                        );
                                                                    },
                                                                )}

                                                                {/* Day complete banner */}
                                                                {isDayComplete(
                                                                    day.id,
                                                                    day.exercises,
                                                                ) && (
                                                                    <View className="bg-green-500/10 p-3 rounded-xl flex-row items-center gap-2 mt-1">
                                                                        <Ionicons
                                                                            name="trophy-outline"
                                                                            size={
                                                                                18
                                                                            }
                                                                            color="#10B981"
                                                                        />
                                                                        <Text className="text-green-500 font-semibold text-sm">
                                                                            All
                                                                            exercises
                                                                            done!
                                                                            Great
                                                                            work
                                                                            💪
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        ) : (
                                                            <View className="bg-yellow-500/10 p-4 rounded-xl mt-2">
                                                                <Text className="text-yellow-600 text-sm text-center">
                                                                    No exercises
                                                                    added yet
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* ── Plan Actions ─────────────────────────── */}
                            {expandedPlan === plan.id && (
                                <View className="flex-row border-t border-border">
                                    <TouchableOpacity
                                        className="flex-1 p-4 items-center flex-row justify-center gap-2"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name="play-circle-outline"
                                            size={20}
                                            color="#10B981"
                                        />
                                        <Text className="text-green-500 font-semibold">
                                            {plan.is_active
                                                ? "Continue"
                                                : "Activate"}
                                        </Text>
                                    </TouchableOpacity>
                                    <View className="w-px bg-border" />
                                    <TouchableOpacity
                                        className="flex-1 p-4 items-center flex-row justify-center gap-2"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name="create-outline"
                                            size={20}
                                            color="#3B82F6"
                                        />
                                        <Text className="text-blue-500 font-semibold">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                    <View className="w-px bg-border" />
                                    <TouchableOpacity
                                        className="flex-1 p-4 items-center flex-row justify-center gap-2"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={20}
                                            color="#EF4444"
                                        />
                                        <Text className="text-red-500 font-semibold">
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
                <View className="h-6" />
            </ScrollView>

            {/* ── Log Exercise Modal ──────────────────────────────────── */}
            <Modal
                visible={modal.visible}
                transparent
                animationType="slide"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    {/* Backdrop */}
                    <TouchableOpacity
                        className="flex-1 bg-black/50"
                        activeOpacity={1}
                        onPress={closeModal}
                    />

                    {/* Sheet */}
                    <View className="bg-surface rounded-t-3xl px-6 pt-4 pb-10">
                        {/* Handle bar */}
                        <View className="w-10 h-1 bg-border rounded-full self-center mb-4" />

                        <Text className="text-text-primary font-bold text-xl mb-1">
                            Log Exercise
                        </Text>
                        <Text
                            className="text-text-secondary text-sm mb-6"
                            numberOfLines={1}
                        >
                            {modal.exerciseName}
                        </Text>

                        {/* Sets & Reps */}
                        <View className="flex-row gap-4 mb-5">
                            <View className="flex-1">
                                <Text className="text-text-secondary text-xs mb-2">
                                    Sets completed
                                </Text>
                                <TextInput
                                    className="bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-base"
                                    placeholder={
                                        modal.defaultSets
                                            ? String(modal.defaultSets)
                                            : "0"
                                    }
                                    placeholderTextColor={COLORS.textSecondary}
                                    keyboardType="number-pad"
                                    value={formSets}
                                    onChangeText={setFormSets}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-text-secondary text-xs mb-2">
                                    Reps completed
                                </Text>
                                <TextInput
                                    className="bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-base"
                                    placeholder={
                                        modal.defaultReps
                                            ? String(modal.defaultReps)
                                            : "0"
                                    }
                                    placeholderTextColor={COLORS.textSecondary}
                                    keyboardType="number-pad"
                                    value={formReps}
                                    onChangeText={setFormReps}
                                />
                            </View>
                        </View>

                        {/* Weight */}
                        <View className="mb-5">
                            <Text className="text-text-secondary text-xs mb-2">
                                Weight used (kg) — optional
                            </Text>
                            <TextInput
                                className="bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-base"
                                placeholder="e.g. 20.5"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="decimal-pad"
                                value={formWeight}
                                onChangeText={setFormWeight}
                            />
                        </View>

                        {/* Difficulty */}
                        <View className="mb-6">
                            <DifficultySelector />
                        </View>

                        {/* Buttons */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={closeModal}
                                className="flex-1 border border-border rounded-2xl py-4 items-center"
                                activeOpacity={0.7}
                            >
                                <Text className="text-text-secondary font-semibold">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveLog}
                                disabled={isSaving}
                                className="flex-2 bg-primary rounded-2xl py-4 px-8 items-center justify-center flex-row gap-2"
                                activeOpacity={0.8}
                                style={{ flex: 2 }}
                            >
                                {isSaving ? (
                                    <ActivityIndicator
                                        color="#fff"
                                        size="small"
                                    />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="checkmark-circle-outline"
                                            size={18}
                                            color="#fff"
                                        />
                                        <Text className="text-white font-bold text-base">
                                            Mark Done
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}
