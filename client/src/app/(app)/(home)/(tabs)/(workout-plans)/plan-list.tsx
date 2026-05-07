import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React, { useMemo, useState } from "react";
import { useWorkout } from "@/src/hooks/useWorkout";
import { Ionicons } from "@expo/vector-icons";

export default function WorkoutPlan() {
  const { workoutPlans, isLoading, togglePlanStatus, deletePlan } =
    useWorkout();
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);

  const activePlanId = useMemo(
    () => workoutPlans.find((plan) => plan.is_active)?.id ?? null,
    [workoutPlans],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4 justify-center items-center">
        <Text className="text-text-secondary">Loading plans...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView className="h-screen p-4" contentContainerClassName="">
        {workoutPlans.map((plan) => (
          <View
            key={plan.id}
            className="bg-surface p-4 rounded-2xl mb-3 border border-border"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-lg font-bold text-text-primary">
                  {plan.title}
                </Text>

                <View className="flex-row items-center gap-2 mt-2">
                  <Text className="text-text-secondary text-xs">
                    {plan.days?.length ?? 0} day
                    {(plan.days?.length ?? 0) === 1
                      ? ""
                      : "s"}
                  </Text>
                  {plan.is_active && (
                    <View className="px-2 py-0.5 rounded-full bg-green-500/15">
                      <Text className="text-green-500 text-xs font-semibold">
                        Active
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View className="flex-row gap-2 ml-3">
                <TouchableOpacity
                  onPress={() =>
                    setExpandedPlanId((prev) =>
                      prev === plan.id ? null : plan.id,
                    )
                  }
                  className="p-2 bg-blue-500/10 rounded-lg"
                >
                  <Ionicons
                    name={
                      expandedPlanId === plan.id
                        ? "caret-up-outline"
                        : "caret-down-outline"
                    }
                    size={20}
                    color="#3B82F6"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    togglePlanStatus(
                      plan.id,
                      plan.is_active,
                    )
                  }
                  className={`p-2 rounded-lg ${plan.is_active
                    ? "bg-amber-500/10"
                    : "bg-green-500/10"
                    }`}
                >
                  <Ionicons
                    name={
                      plan.is_active
                        ? "pause-circle-outline"
                        : "checkmark-circle-outline"
                    }
                    size={20}
                    color={
                      plan.is_active
                        ? "#F59E0B"
                        : "#10B981"
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deletePlan(plan.id)}
                  className="p-2 bg-red-500/10 rounded-lg"
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {expandedPlanId === plan.id && (
              <View className="mt-4 pt-4 border-t border-border">
                <Text className="text-text-secondary pb-4">
                  {plan.description}
                </Text>

                {(plan.days ?? []).length === 0 ? (
                  <Text className="text-text-secondary text-sm">
                    No generated workout days yet.
                  </Text>
                ) : (
                  (plan.days ?? []).map((day, index) => (
                    <View
                      key={day.id}
                      className="mb-3 p-3 rounded-xl border border-border bg-background"
                    >
                      <View className="flex-row justify-between items-center">
                        <Text className="text-text-primary font-semibold">
                          Day {index + 1}: {day.title}
                        </Text>
                        {day.is_rest_day && (
                          <Text className="text-text-secondary text-xs">
                            Rest Day
                          </Text>
                        )}
                      </View>
                      {!day.is_rest_day && (
                        <Text className="text-text-secondary text-xs mt-1">
                          {
                            (day.exercises ?? [])
                              .length
                          }{" "}
                          exercise
                          {(day.exercises ?? [])
                            .length === 1
                            ? ""
                            : "s"}
                        </Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ))}

        {workoutPlans.length === 0 && (
          <View className="mt-6 p-5">
            <Text className="text-text-primary font-semibold text-base text-center">
              No Workout Plans
            </Text>
            <Text className="text-text-secondary mt-1 text-center">
              Generate a plan first, then activate one to start
              today&apos;s training flow.
            </Text>
          </View>
        )}

        {activePlanId == null && workoutPlans.length > 0 && (
          <View className="mt-2 mb-6 p-4">
            <Text className="text-amber-600 font-semibold text-center">
              No plan is active
            </Text>
            <Text className="text-amber-700 text-sm mt-1 text-center">
              Activate one plan to populate the Workout tab with
              today&apos;s exercises.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
