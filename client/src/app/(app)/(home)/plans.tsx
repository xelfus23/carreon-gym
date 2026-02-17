import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { workoutService } from "@/src/services/workoutService";
import Loader from "../../components/Loader";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutPlanProps } from "@/src/types/workout";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/consts/colors";
import { Dumbbell } from "lucide-react-native";

export default function Plans() {
    const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);

    const router = useRouter();

    const refreshWorkoutPlan = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await workoutService.getWorkout();

            console.log(response);

            if (!response.success) {
                throw new Error(response.message);
            }

            const data = response.data;

            setWorkoutPlans(data);
            // Auto-expand first plan if exists
            if (data.length > 0) {
                setExpandedPlan(data[0].id);
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

    const togglePlan = (planId: number) => {
        setExpandedPlan(expandedPlan === planId ? null : planId);
        setExpandedDay(null); // Close any expanded day when switching plans
    };

    const toggleDay = (dayId: number) => {
        setExpandedDay(expandedDay === dayId ? null : dayId);
    };

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

    const NavigateButton = () => {
        return (
            <TouchableOpacity
                className="bg-primary p-4 rounded-2xl flex-row items-center justify-center gap-2 mt-2"
                activeOpacity={0.8}
                onPress={() => router.navigate("/(app)/(home)/chat")}
            >
                <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color={COLORS.background}
                />
                <Text className="text-background font-bold text-base">
                    Create New Plan with AI
                </Text>
            </TouchableOpacity>
        );
    };

    if (workoutPlans.length === 0) {
        return (
            <View className="items-center justify-center flex-1 bg-background p-12">
                <View className="rotate-45">
                    <Dumbbell color={COLORS.textSecondary} size={45}/>
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

    return (
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

                {/* Plans List */}
                {workoutPlans.map((plan, planIndex) => (
                    <View
                        key={plan.id}
                        className="bg-surface rounded-2xl overflow-hidden border border-border"
                    >
                        {/* Plan Header */}
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
                                    {plan.status === "active" && (
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

                        {/* Plan Details (Expandable) */}
                        {expandedPlan === plan.id && (
                            <View className="border-t border-border">
                                {plan.days?.map((day, dayIndex) => (
                                    <View
                                        key={day.id}
                                        className="border-b border-border/50 last:border-b-0"
                                    >
                                        {/* Day Header */}
                                        <TouchableOpacity
                                            onPress={() => toggleDay(day.id)}
                                            className="p-4 flex-row items-center justify-between bg-background/30"
                                            activeOpacity={0.7}
                                        >
                                            <View className="flex-1 flex-row items-center gap-3">
                                                <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                                                    <Text className="text-primary font-bold text-sm">
                                                        D{day.order}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-text-primary font-semibold text-base">
                                                        {day.title}
                                                    </Text>
                                                    {day.is_rest_day ? (
                                                        <Text className="text-text-secondary text-xs mt-0.5">
                                                            Rest & Recovery
                                                        </Text>
                                                    ) : (
                                                        <Text className="text-text-secondary text-xs mt-0.5">
                                                            {day.exercises
                                                                ?.length ||
                                                                0}{" "}
                                                            exercises
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            <Ionicons
                                                name={
                                                    expandedDay === day.id
                                                        ? "chevron-up"
                                                        : "chevron-down"
                                                }
                                                size={20}
                                                color="#9CA3AF"
                                            />
                                        </TouchableOpacity>

                                        {/* Exercises List (Expandable) */}
                                        {expandedDay === day.id && (
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
                                                                Rest Day
                                                                Activities
                                                            </Text>
                                                        </View>
                                                        <Text className="text-text-secondary text-sm">
                                                            {day.rest_day_notes ||
                                                                "Take a complete rest or do light stretching"}
                                                        </Text>
                                                    </View>
                                                ) : day.exercises &&
                                                  day.exercises.length > 0 ? (
                                                    <View className="gap-3 mt-2">
                                                        {day.exercises.map(
                                                            (
                                                                exercise,
                                                                exerciseIndex,
                                                            ) => (
                                                                <View
                                                                    key={
                                                                        exercise.id
                                                                    }
                                                                    className="bg-background/50 p-4 rounded-xl"
                                                                >
                                                                    {/* Exercise Header */}
                                                                    <View className="flex-row items-start gap-3 mb-3">
                                                                        <View className="w-8 h-8 bg-primary/20 rounded-lg items-center justify-center">
                                                                            <Text className="text-primary font-bold text-xs">
                                                                                {exerciseIndex +
                                                                                    1}
                                                                            </Text>
                                                                        </View>
                                                                        <View className="flex-1">
                                                                            <Text className="text-text-primary font-semibold text-base">
                                                                                {
                                                                                    exercise.name
                                                                                }
                                                                            </Text>
                                                                            <View className="flex-row items-center gap-1 mt-1">
                                                                                <Ionicons
                                                                                    name="barbell-outline"
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                    color="#9CA3AF"
                                                                                />
                                                                                <Text className="text-text-secondary text-xs">
                                                                                    {exercise.equipment ||
                                                                                        "Bodyweight"}
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                    </View>

                                                                    {/* Exercise Details */}
                                                                    <View className="flex-row flex-wrap gap-2">
                                                                        {exercise.sets && (
                                                                            <View className="bg-surface px-3 py-2 rounded-lg flex-row items-center gap-1.5">
                                                                                <Ionicons
                                                                                    name="repeat-outline"
                                                                                    size={
                                                                                        14
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
                                                                            <View className="bg-surface px-3 py-2 rounded-lg flex-row items-center gap-1.5">
                                                                                <Ionicons
                                                                                    name="fitness-outline"
                                                                                    size={
                                                                                        14
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

                                                                    {/* Additional Notes */}
                                                                    {exercise.notes && (
                                                                        <View className="mt-3 pt-3 border-t border-border/50">
                                                                            <Text className="text-text-secondary text-xs leading-5">
                                                                                💡{" "}
                                                                                {
                                                                                    exercise.notes
                                                                                }
                                                                            </Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            ),
                                                        )}
                                                    </View>
                                                ) : (
                                                    <View className="bg-yellow-500/10 p-4 rounded-xl mt-2">
                                                        <Text className="text-yellow-600 text-sm text-center">
                                                            No exercises added
                                                            yet
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Plan Actions (when expanded) */}
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
                                        {plan.status === "active"
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

                {/* Add Plan Button */}
            </View>

            <NavigateButton />
            {/* Bottom Padding */}
            <View className="h-6" />
        </ScrollView>
    );
}
