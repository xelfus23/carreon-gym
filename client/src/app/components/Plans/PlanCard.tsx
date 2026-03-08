import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { WorkoutPlanProps } from "@/src/types/workout";
import type { WorkoutLog } from "@/src/services/workoutService";
import DayCard from "./DayCard";

type Props = {
    plan: WorkoutPlanProps;
    planIndex: number;
    isExpanded: boolean;
    expandedDay: number | null;
    loadingDays: Record<number, boolean>;
    checkedExercises: Record<string, WorkoutLog>;
    logKey: (dayId: number, exerciseId: number) => string;
    getDayProgress: (
        dayId: number,
        exercises: { id: number }[] | undefined,
    ) => {
        done: number;
        total: number;
    };
    isDayComplete: (
        dayId: number,
        exercises: { id: number }[] | undefined,
    ) => boolean;
    isExerciseChecked: (dayId: number, exerciseId: number) => boolean;
    onTogglePlan: (planId: number) => void;
    onToggleDay: (dayId: number) => void;
    onOpenLogModal: (
        dayId: number,
        exerciseId: number,
        exerciseName: string,
        defaultSets: number | null,
        defaultReps: number | null,
        defaultDuration: number | null,
    ) => void;
    onUncheckExercise: (dayId: number, exerciseId: number) => void;
};

export default function PlanCard({
    plan,
    planIndex,
    isExpanded,
    expandedDay,
    loadingDays,
    checkedExercises,
    logKey,
    getDayProgress,
    isDayComplete,
    isExerciseChecked,
    onTogglePlan,
    onToggleDay,
    onOpenLogModal,
    onUncheckExercise,
}: Props) {
    return (
        <View className="bg-surface rounded-2xl overflow-hidden border border-border">
            <TouchableOpacity
                onPress={() => onTogglePlan(plan.id)}
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
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#9CA3AF"
                />
            </TouchableOpacity>

            {isExpanded && (
                <>
                    <View className="border-t border-border">
                        {plan.days?.map((day) => (
                            <DayCard
                                key={day.id}
                                day={day}
                                isExpanded={expandedDay === day.id}
                                isLoading={!!loadingDays[day.id]}
                                progress={getDayProgress(day.id, day.exercises)}
                                complete={isDayComplete(day.id, day.exercises)}
                                onToggleDay={() => onToggleDay(day.id)}
                                checkedExercises={checkedExercises}
                                logKey={logKey}
                                isExerciseChecked={isExerciseChecked}
                                onOpenLogModal={onOpenLogModal}
                                onUncheckExercise={onUncheckExercise}
                                isDayComplete={isDayComplete}
                            />
                        ))}
                    </View>

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
                                {plan.is_active ? "Continue" : "Activate"}
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
                </>
            )}
        </View>
    );
}
