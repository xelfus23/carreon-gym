import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { WorkoutLog } from "@/src/services/workoutService";
import type { dayProps } from "@/src/types/workout";
import ExerciseRow from "./ExerciseRow";

/** Day from API can have order (server) or day_order (client types) */
type DayWithOrder = dayProps & { order?: number };
/** Exercise can have name/equipment (server) or exercise_name/equipment_name (client) */
type Exercise = dayProps["exercises"][number] & {
    name?: string;
    equipment?: string;
    equipment_name?: string | string[];
};

type Props = {
    day: DayWithOrder;
    isExpanded: boolean;
    isLoading: boolean;
    progress: { done: number; total: number };
    complete: boolean;
    onToggleDay: () => void;
    checkedExercises: Record<string, WorkoutLog>;
    logKey: (dayId: number, exerciseId: number) => string;
    isExerciseChecked: (dayId: number, exerciseId: number) => boolean;
    onOpenLogModal: (
        dayId: number,
        exerciseId: number,
        exerciseName: string,
        defaultSets: number | null,
        defaultReps: number | null,
        defaultDuration: number | null,
    ) => void;
    onUncheckExercise: (dayId: number, exerciseId: number) => void;
    isDayComplete: (
        dayId: number,
        exercises: Exercise[] | undefined,
    ) => boolean;
};

export default function DayCard({
    day,
    isExpanded,
    isLoading,
    progress,
    complete,
    onToggleDay,
    checkedExercises,
    logKey,
    isExerciseChecked,
    onOpenLogModal,
    onUncheckExercise,
    isDayComplete,
}: Props) {
    const exercises = (day.exercises ?? []) as Exercise[];

    return (
        <View className="border-b border-border/50 last:border-b-0">
            <TouchableOpacity
                onPress={onToggleDay}
                className="p-4 flex-row items-center justify-between bg-background/30"
                activeOpacity={0.7}
            >
                <View className="flex-1 flex-row items-center gap-3">
                    <View
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                            complete ? "bg-green-500/20" : "bg-primary/10"
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
                                D{day.day_order ?? day.order}
                            </Text>
                        )}
                    </View>

                    <View className="flex-1">
                        <Text className="text-text-primary font-semibold text-base">
                            {day.title}
                        </Text>
                        {day.is_rest_day ? (
                            <Text className="text-text-secondary text-xs mt-0.5">
                                Rest & Recovery
                            </Text>
                        ) : isLoading ? (
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
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#9CA3AF"
                />
            </TouchableOpacity>

            {isExpanded && (
                <View className="px-4 pb-4">
                    {day.is_rest_day ? (
                        <View className="bg-blue-500/10 p-4 rounded-xl mt-2">
                            <View className="flex-row items-center gap-2 mb-2">
                                <Ionicons
                                    name="bed-outline"
                                    size={20}
                                    color="#3B82F6"
                                />
                                <Text className="text-blue-500 font-semibold">
                                    Rest Day Activities
                                </Text>
                            </View>
                            <Text className="text-text-secondary text-sm">
                                {day.rest_day_notes ||
                                    "Take a complete rest or do light stretching"}
                            </Text>
                        </View>
                    ) : exercises.length > 0 ? (
                        <View className="gap-3 mt-2">
                            {exercises.map((exercise, exerciseIndex) => {
                                const checked = isExerciseChecked(
                                    day.id,
                                    exercise.id,
                                );
                                const log =
                                    checkedExercises[
                                        logKey(day.id, exercise.id)
                                    ];
                                return (
                                    <ExerciseRow
                                        key={exercise.id}
                                        dayId={day.id}
                                        exercise={exercise}
                                        exerciseIndex={exerciseIndex}
                                        checked={checked}
                                        log={log}
                                        onToggle={() => {
                                            if (checked) {
                                                onUncheckExercise(
                                                    day.id,
                                                    exercise.id,
                                                );
                                            } else {
                                                onOpenLogModal(
                                                    day.id,
                                                    exercise.id,
                                                    (exercise as Exercise)
                                                        .exercise_name ??
                                                        (exercise as Exercise)
                                                            .name ??
                                                        "",
                                                    exercise.sets ?? null,
                                                    exercise.reps ?? null,
                                                    (exercise as any)
                                                        .duration_seconds ??
                                                        null,
                                                );
                                            }
                                        }}
                                        onEdit={() =>
                                            onOpenLogModal(
                                                day.id,
                                                exercise.id,
                                                (exercise as Exercise)
                                                    .exercise_name ??
                                                    (exercise as Exercise)
                                                        .name ??
                                                    "",
                                                exercise.sets ?? null,
                                                exercise.reps ?? null,
                                                (exercise as any)
                                                    .duration_seconds ?? null,
                                            )
                                        }
                                    />
                                );
                            })}

                            {isDayComplete(day.id, exercises) && (
                                <View className="bg-green-500/10 p-3 rounded-xl flex-row items-center gap-2 mt-1">
                                    <Ionicons
                                        name="trophy-outline"
                                        size={18}
                                        color="#10B981"
                                    />
                                    <Text className="text-green-500 font-semibold text-sm">
                                        All exercises done! Great work 💪
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View className="bg-yellow-500/10 p-4 rounded-xl mt-2">
                            <Text className="text-yellow-600 text-sm text-center">
                                No exercises added yet
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
