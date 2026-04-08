import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";
import { Check } from "lucide-react-native";

const GOALS = [
    {
        id: "lose_weight",
        title: "Lose Weight",
        description: "Burn fat and get leaner",
        icon: "flame-outline",
    },
    {
        id: "build_muscle",
        title: "Build Muscle",
        description: "Gain strength and mass",
        icon: "barbell-outline",
    },
    {
        id: "keep_fit",
        title: "Stay Healthy",
        description: "Maintain weight and energy",
        icon: "heart-outline",
    },
];

export default function StepGoals({
    data,
    setData,
    onBack,
    finalSubmission,
}: ProfileCompletionScreenProps) {
    const handleSelect = (goalId: string) => {
        setData!((prev) => ({ ...prev, goal: goalId }));
    };

    return (
        <View className="w-full flex-1 justify-center py-16">
            {/* Header Section */}
            <View className="mb-8 px-4">
                <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
                    Fitness Goal
                </Text>
                <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
                    What is your goal?
                </Text>
                <Text className="text-base text-text-secondary leading-relaxed">
                    We will tailor your workout based on your choice.
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1 px-4"
                contentContainerClassName="gap-3"
            >
                {GOALS.map((goal) => {
                    const isSelected = data?.goal === goal.id;
                    return (
                        <TouchableOpacity
                            key={goal.id}
                            onPress={() => handleSelect(goal.id)}
                            activeOpacity={0.7}
                            className={`flex-row items-center gap-4 p-5 rounded-2xl border ${
                                isSelected
                                    ? "bg-primary/10 border-primary"
                                    : "bg-surface border-border"
                            }`}
                        >
                            <View
                                className={`w-11 h-11 rounded-xl items-center justify-center ${
                                    isSelected
                                        ? "bg-primary/20"
                                        : "bg-background"
                                }`}
                            >
                                <Ionicons
                                    name={goal.icon as any}
                                    size={22}
                                    color={
                                        isSelected
                                            ? COLORS.primary
                                            : COLORS.textSecondary
                                    }
                                />
                            </View>

                            <View className="flex-1">
                                <Text
                                    className={`text-base mb-0.5 font-bold ${isSelected ? "text-primary" : "text-text-primary"}`}
                                >
                                    {goal.title}
                                </Text>
                                <Text className="text-text-secondary text-sm">
                                    {goal.description}
                                </Text>
                            </View>

                            {isSelected && (
                                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                                    <Check
                                        size={14}
                                        color={COLORS.background}
                                        strokeWidth={3}
                                    />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View className="flex flex-row justify-evenly gap-4 px-4">
                <TouchableOpacity
                    onPress={onBack}
                    className="flex-1 p-4 rounded-2xl bg-surface border border-border items-center"
                >
                    <Text className="text-text-secondary font-bold text-lg">
                        Back
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={finalSubmission}
                    className="flex-[2] p-4 rounded-2xl bg-primary items-center "
                >
                    <Text className="text-background font-black text-lg">
                        Next
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
