import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { WorkoutLog } from "@/src/services/workoutService";

/** Supports both API shapes: exercise_name/equipment_name (client types) and name/equipment (server) */
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
};

type Props = {
    dayId: number;
    exercise: Exercise;
    exerciseIndex: number;
    checked: boolean;
    log: WorkoutLog | undefined;
    onToggle: () => void;
    onEdit: () => void;
};

const equipmentLabel = (eq: string | string[] | undefined) =>
    !eq ? "Bodyweight" : Array.isArray(eq) ? eq[0] ?? "Bodyweight" : String(eq);

const exerciseName = (ex: Exercise) => ex.exercise_name ?? ex.name ?? "";

export default function ExerciseRow({
    dayId,
    exercise,
    exerciseIndex,
    checked,
    log,
    onToggle,
    onEdit,
}: Props) {
    return (
        <View
            className={`rounded-xl border overflow-hidden ${
                checked
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border/50 bg-background/50"
            }`}
        >
            <TouchableOpacity
                onPress={onToggle}
                activeOpacity={0.7}
                className="p-4 flex-row items-start gap-3"
            >
                <View className="mt-0.5">
                    <View
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            checked ? "bg-green-500 border-green-500" : "border-border"
                        }`}
                    >
                        {checked && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                    </View>
                </View>

                <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                        <View className="w-6 h-6 bg-primary/20 rounded-md items-center justify-center">
                            <Text className="text-primary font-bold text-xs">
                                {exerciseIndex + 1}
                            </Text>
                        </View>
                        <Text
                            className={`font-semibold text-base flex-1 ${
                                checked
                                    ? "text-text-secondary line-through"
                                    : "text-text-primary"
                            }`}
                        >
                            {exerciseName(exercise)}
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-1 mb-2">
                        <Ionicons name="barbell-outline" size={13} color="#9CA3AF" />
                        <Text className="text-text-secondary text-xs">
                            {equipmentLabel(
                                exercise.equipment_name ?? exercise.equipment,
                            )}
                        </Text>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                        {exercise.sets != null && exercise.sets !== undefined && (
                            <View className="bg-surface px-3 py-1.5 rounded-lg flex-row items-center gap-1.5">
                                <Ionicons name="repeat-outline" size={13} color="#6B7280" />
                                <Text className="text-text-secondary text-xs font-medium">
                                    {exercise.sets} sets
                                </Text>
                            </View>
                        )}
                        {exercise.reps != null && exercise.reps !== undefined && (
                            <View className="bg-surface px-3 py-1.5 rounded-lg flex-row items-center gap-1.5">
                                <Ionicons name="fitness-outline" size={13} color="#6B7280" />
                                <Text className="text-text-secondary text-xs font-medium">
                                    {exercise.reps} reps
                                </Text>
                            </View>
                        )}
                        {exercise.duration_seconds != null && 
                         exercise.duration_seconds !== undefined && 
                         exercise.reps == null && (
                            <View className="bg-surface px-3 py-1.5 rounded-lg flex-row items-center gap-1.5">
                                <Ionicons name="time-outline" size={13} color="#6B7280" />
                                <Text className="text-text-secondary text-xs font-medium">
                                    {exercise.duration_seconds >= 60
                                        ? `${Math.floor(exercise.duration_seconds / 60)}m ${exercise.duration_seconds % 60}s`
                                        : `${exercise.duration_seconds}s`}
                                </Text>
                            </View>
                        )}
                    </View>

                    {exercise.notes && (
                        <View className="mt-2 pt-2 border-t border-border/50">
                            <Text className="text-text-secondary text-xs leading-5">
                                💡 {exercise.notes}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {checked && log && (
                <View className="px-4 pb-3 flex-row flex-wrap gap-2">
                    {log.completed_sets != null && (
                        <View className="bg-green-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                            <Ionicons name="repeat-outline" size={12} color="#10B981" />
                            <Text className="text-green-600 text-xs font-medium">
                                {log.completed_sets} sets
                            </Text>
                        </View>
                    )}
                    {log.completed_reps != null && (
                        <View className="bg-green-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                            <Ionicons name="fitness-outline" size={12} color="#10B981" />
                            <Text className="text-green-600 text-xs font-medium">
                                {log.completed_reps} reps
                            </Text>
                        </View>
                    )}
                    {log.duration_seconds != null && log.completed_reps == null && (
                        <View className="bg-green-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                            <Ionicons name="time-outline" size={12} color="#10B981" />
                            <Text className="text-green-600 text-xs font-medium">
                                {log.duration_seconds >= 60
                                    ? `${Math.floor(log.duration_seconds / 60)}m`
                                    : `${log.duration_seconds}s`}
                            </Text>
                        </View>
                    )}
                    {log.weight_used_kg != null && (
                        <View className="bg-green-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                            <Ionicons name="barbell-outline" size={12} color="#10B981" />
                            <Text className="text-green-600 text-xs font-medium">
                                {log.weight_used_kg} kg
                            </Text>
                        </View>
                    )}
                    {log.difficulty_rating != null && (
                        <View className="bg-green-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                            <Ionicons name="flame-outline" size={12} color="#10B981" />
                            <Text className="text-green-600 text-xs font-medium">
                                RPE {log.difficulty_rating}/10
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={onEdit}
                        className="bg-surface px-3 py-1.5 rounded-lg flex-row items-center gap-1"
                    >
                        <Ionicons name="create-outline" size={12} color="#6B7280" />
                        <Text className="text-text-secondary text-xs">Edit</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
