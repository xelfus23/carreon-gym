import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React, { useState, useCallback } from "react";
import { useWorkout } from "@/src/hooks/useWorkout";
import { router } from "expo-router";

import ExerciseDetailModal, {
    type ExerciseDetail,
} from "../../components/Plans/ExerciseDetailModal";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";
import type { WorkoutLog } from "@/src/services/workoutService";
import CustomLoader from "@/src/app/components/Plans/PlansLoading";
import PlansEmpty from "@/src/app/components/Plans/PlansEmpty";
import LogExerciseModal from "@/src/app/components/Plans/LogExerciseModal";

// ── Types ──────────────────────────────────────────────────────────────────────

type Exercise = {
    id: number;
    exercise_name?: string;
    name?: string;
    equipment_name?: string | string[];
    equipment?: string;
    sets?: number | null;
    reps?: number | null;
    duration_seconds?: number | null;
    notes?: string | null;
    description?: string | null;
    muscle_group?: string | null;
    secondary_muscles?: string | string[] | null;
    exercise_type?: string | null;
};

type FlatExercise = Exercise & {
    dayId: number;
    dayTitle: string;
    planTitle: string;
};

const normalizeDate = (value: unknown) => {
    if (value == null) return null;
    if (typeof value === "string") return value.slice(0, 10);
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const exerciseName = (ex: Exercise) => ex.exercise_name ?? ex.name ?? "";
const equipmentLabel = (eq: string | string[] | undefined) =>
    !eq
        ? "Bodyweight"
        : Array.isArray(eq)
          ? (eq[0] ?? "Bodyweight")
          : String(eq);
const isDurationBased = (ex: Exercise) =>
    ex.duration_seconds != null && ex.reps == null;

// ── Exercise Quick Card ────────────────────────────────────────────────────────

type ExerciseCardProps = {
    ex: FlatExercise;
    checked: boolean;
    log?: WorkoutLog;
    onPress: () => void;
    onUncheck: () => void;
};

function ExerciseCard({
    ex,
    checked,
    log,
    onPress,
    onUncheck,
}: ExerciseCardProps) {
    const timed = isDurationBased(ex);

    const formatDuration = (secs: number) => {
        if (secs >= 60) {
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            return s > 0 ? `${m}m ${s}s` : `${m}m`;
        }
        return `${secs}s`;
    };

    return (
        <TouchableOpacity
            onPress={checked ? onUncheck : onPress}
            activeOpacity={0.75}
            className={`rounded-2xl border mb-3 overflow-hidden ${
                checked
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-surface"
            }`}
        >
            <View className="p-4 flex-row items-center gap-4">
                {/* Check Indicator */}
                <View
                    className={`w-12 h-12 rounded-2xl items-center justify-center ${
                        checked ? "bg-green-500/20" : "bg-primary/10"
                    }`}
                >
                    {checked ? (
                        <Ionicons
                            name="checkmark-circle"
                            size={26}
                            color="#10B981"
                        />
                    ) : timed ? (
                        <Ionicons
                            name="timer-outline"
                            size={22}
                            color={COLORS.primary}
                        />
                    ) : (
                        <Ionicons
                            name="barbell-outline"
                            size={22}
                            color={COLORS.primary}
                        />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1">
                    <Text
                        className={`font-semibold text-base ${
                            checked
                                ? "text-text-secondary line-through"
                                : "text-text-primary"
                        }`}
                        numberOfLines={1}
                    >
                        {exerciseName(ex)}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                        {/* Plan / day context */}
                        <Text className="text-text-secondary text-xs">
                            {ex.dayTitle}
                        </Text>
                        <View className="w-1 h-1 rounded-full bg-text-secondary/40" />
                        {timed && ex.duration_seconds != null ? (
                            <Text className="text-blue-400 text-xs font-medium">
                                ⏱ {formatDuration(ex.duration_seconds)}
                            </Text>
                        ) : (
                            <Text className="text-text-secondary text-xs">
                                {ex.sets ?? "?"} × {ex.reps ?? "?"} reps
                            </Text>
                        )}
                        <View className="w-1 h-1 rounded-full bg-text-secondary/40" />
                        <Text className="text-text-secondary text-xs">
                            {equipmentLabel(ex.equipment_name ?? ex.equipment)}
                        </Text>
                    </View>

                    {/* Completed log summary */}
                    {checked && log && (
                        <View className="flex-row gap-2 mt-1.5 flex-wrap">
                            {log.completed_sets != null && (
                                <Text className="text-green-500 text-xs">
                                    {log.completed_sets} sets
                                </Text>
                            )}
                            {log.completed_reps != null && (
                                <Text className="text-green-500 text-xs">
                                    · {log.completed_reps} reps
                                </Text>
                            )}
                            {log.weight_used_kg != null && (
                                <Text className="text-green-500 text-xs">
                                    · {log.weight_used_kg}kg
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Action icon */}
                {checked ? (
                    <TouchableOpacity
                        onPress={onUncheck}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons
                            name="close-circle-outline"
                            size={20}
                            color={COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                ) : (
                    <View className="bg-primary/10 rounded-xl w-9 h-9 items-center justify-center">
                        <Ionicons
                            name="play"
                            size={14}
                            color={COLORS.primary}
                        />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({
    title,
    count,
    accent,
}: {
    title: string;
    count: number;
    accent: string;
}) {
    return (
        <View className="flex-row items-center gap-2 mb-3">
            <View
                className={`w-1 h-5 rounded-full`}
                style={{ backgroundColor: accent }}
            />
            <Text className="text-text-primary font-bold text-base">
                {title}
            </Text>
            <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${accent}20` }}
            >
                <Text className="text-xs font-bold" style={{ color: accent }}>
                    {count}
                </Text>
            </View>
        </View>
    );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function Plans() {
    const {
        workoutPlans,
        isLoading,
        checkedExercises,
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
        isExerciseChecked,
        closeModal,
        uncheckExercise,
        saveLog,
        logKey,
    } = useWorkout();

    // Detail modal state
    const [detailModal, setDetailModal] = useState<{
        visible: boolean;
        exercise: ExerciseDetail | null;
        dayId: number | null;
    }>({ visible: false, exercise: null, dayId: null });

    const openDetail = useCallback((ex: FlatExercise) => {
        setDetailModal({ visible: true, exercise: ex, dayId: ex.dayId });
    }, []);

    const closeDetail = useCallback(() => {
        setDetailModal({ visible: false, exercise: null, dayId: null });
    }, []);

    if (isLoading) return <CustomLoader text="Loading your workout plans..." />;

    const today = new Date().toISOString().slice(0, 10);
    const activePlan = workoutPlans.find((plan) => plan.is_active);

    // ── Flatten today's exercises from active plan only ──────────────────────
    const allExercises: FlatExercise[] = [];

    for (const day of activePlan?.days ?? []) {
        if (day.is_rest_day) continue;
        if (normalizeDate(day.day_date) !== today) continue;

        for (const ex of day.exercises ?? []) {
            allExercises.push({
                ...(ex as Exercise),
                dayId: day.id,
                dayTitle: day.title,
                planTitle: activePlan?.title ?? "Active Plan",
            });
        }
    }

    const incompleteExercises = allExercises.filter(
        (ex) => !isExerciseChecked(ex.dayId, ex.id),
    );
    const completedExercises = allExercises.filter((ex) =>
        isExerciseChecked(ex.dayId, ex.id),
    );

    // If no plans
    if (workoutPlans.length === 0) return <PlansEmpty />;

    if (!activePlan) {
        return (
            <View className="flex-1 bg-background p-4">
                <View className="bg-surface border border-border rounded-2xl p-5 mt-2">
                    <Text className="text-text-primary text-lg font-bold">
                        No Active Plan
                    </Text>
                    <Text className="text-text-secondary mt-2">
                        Activate a workout plan to see today&apos;s exercises.
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push("/plan-list")}
                        className="mt-4 bg-primary/10 rounded-xl px-4 py-3 self-start"
                    >
                        <Text className="text-primary font-semibold">
                            Manage Plans
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // If no exercises for today on active plan
    if (allExercises.length === 0) {
        return (
            <View className="flex-1 bg-background p-4">
                <View className="bg-surface border border-border rounded-2xl p-5 mt-2">
                    <Text className="text-text-primary text-lg font-bold">
                        Rest Day / No Workout Today
                    </Text>
                    <Text className="text-text-secondary mt-2">
                        Your active plan does not have exercises scheduled for
                        today.
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push("/plan-list")}
                        className="mt-4 bg-primary/10 rounded-xl px-4 py-3 self-start"
                    >
                        <Text className="text-primary font-semibold">
                            View All Plans
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const allDone =
        incompleteExercises.length === 0 && completedExercises.length > 0;

    return (
        <>
            <ScrollView
                className="flex-1 bg-background"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-14"
            >
                <View className="p-4">
                    {/* Header */}
                    <View className="mb-5">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-text-primary font-bold text-2xl">
                                Today&apos;s Workout
                            </Text>
                            <TouchableOpacity
                                onPress={() =>
                                    router.push("/plan-list")
                                }
                                className="px-3 py-2 bg-primary/10 rounded-xl"
                            >
                                <Text className="text-primary text-xs font-semibold">
                                    All Plans
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text className="text-text-secondary text-sm mt-1">
                            {activePlan.title} ·{" "}
                            {completedExercises.length}/{allExercises.length}{" "}
                            exercises done
                        </Text>

                        {/* Overall progress bar */}
                        <View className="h-2 bg-surface rounded-full mt-3 overflow-hidden">
                            <View
                                className="h-full bg-primary rounded-full"
                                style={{
                                    width: `${
                                        allExercises.length > 0
                                            ? (completedExercises.length /
                                                  allExercises.length) *
                                              100
                                            : 0
                                    }%`,
                                }}
                            />
                        </View>
                    </View>

                    {/* All Done Banner */}
                    {allDone && (
                        <View className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-5 flex-row items-center gap-3">
                            <Ionicons name="trophy" size={28} color="#10B981" />
                            <View>
                                <Text className="text-green-500 font-bold text-base">
                                    Workout Complete! 🎉
                                </Text>
                                <Text className="text-green-600 text-sm">
                                    You crushed all exercises today.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ── Incomplete Exercises ─────────────────────────── */}
                    {incompleteExercises.length > 0 && (
                        <View className="mb-6">
                            <SectionHeader
                                title="Remaining"
                                count={incompleteExercises.length}
                                accent={COLORS.primary}
                            />
                            {incompleteExercises.map((ex) => (
                                <ExerciseCard
                                    key={`${ex.dayId}-${ex.id}`}
                                    ex={ex}
                                    checked={false}
                                    onPress={() => openDetail(ex)}
                                    onUncheck={() =>
                                        uncheckExercise(ex.dayId, ex.id)
                                    }
                                />
                            ))}
                        </View>
                    )}

                    {/* ── Completed Exercises ──────────────────────────── */}
                    {completedExercises.length > 0 && (
                        <View className="mb-6">
                            <SectionHeader
                                title="Completed"
                                count={completedExercises.length}
                                accent={COLORS.success}
                            />
                            {completedExercises.map((ex) => (
                                <ExerciseCard
                                    key={`${ex.dayId}-${ex.id}`}
                                    ex={ex}
                                    checked={true}
                                    log={
                                        checkedExercises[
                                            logKey(ex.dayId, ex.id)
                                        ]
                                    }
                                    onPress={() => openDetail(ex)}
                                    onUncheck={() =>
                                        uncheckExercise(ex.dayId, ex.id)
                                    }
                                />
                            ))}
                        </View>
                    )}
                </View>
                <View className="h-6" />
            </ScrollView>

            {/* Exercise Detail Modal */}
            <ExerciseDetailModal
                visible={detailModal.visible}
                dayId={detailModal.dayId}
                exercise={detailModal.exercise}
                onClose={closeDetail}
            />

            {/* Log Modal (for manual logging / editing) */}
            <LogExerciseModal
                modal={modal}
                formSets={formSets}
                formReps={formReps}
                formDuration={formDuration}
                formWeight={formWeight}
                formDifficulty={formDifficulty}
                isSaving={isSaving}
                onSetFormSets={setFormSets}
                onSetFormReps={setFormReps}
                onSetFormDuration={setFormDuration}
                onSetFormWeight={setFormWeight}
                onSetFormDifficulty={setFormDifficulty}
                onClose={closeModal}
                onSave={saveLog}
            />
        </>
    );
}
