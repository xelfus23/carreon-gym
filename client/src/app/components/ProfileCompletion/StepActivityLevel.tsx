import { View, Text, TouchableOpacity } from "react-native";
import React, { Dispatch, SetStateAction } from "react";
import { CurrentStats, Profile } from "@/src/types/users";
import { Check, Zap, Turtle, Wind, Flame, Trophy } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";

const ACTIVITY_LEVELS = [
    {
        value: "sedentary",
        label: "Sedentary",
        subtitle: "Little or no exercise",
        icon: Turtle,
    },
    {
        value: "light",
        label: "Lightly Active",
        subtitle: "1–3 days per week",
        icon: Wind,
    },
    {
        value: "moderate",
        label: "Moderately Active",
        subtitle: "3–5 days per week",
        icon: Zap,
    },
    {
        value: "active",
        label: "Very Active",
        subtitle: "6–7 days per week",
        icon: Flame,
    },
    {
        value: "very_active",
        label: "Extremely Active",
        subtitle: "Athlete level training",
        icon: Trophy,
    },
] as const;

function ActivityCard({
    activity,
    isSelected,
    onPress,
}: {
    activity: (typeof ACTIVITY_LEVELS)[number];
    isSelected: boolean;
    onPress: () => void;
}) {
    const Icon = activity.icon;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            className={`flex-row items-center gap-4 p-4 rounded-2xl border ${
                isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-border"
            }`}
        >
            {/* Icon bubble */}
            <View
                className={`w-11 h-11 rounded-xl items-center justify-center ${
                    isSelected ? "bg-primary/20" : "bg-background"
                }`}
            >
                <Icon
                    size={22}
                    color={isSelected ? COLORS.primary : COLORS.textSecondary}
                    strokeWidth={2}
                />
            </View>

            {/* Labels */}
            <View className="flex-1">
                <Text
                    className={`text-base font-bold mb-0.5 ${
                        isSelected ? "text-primary" : "text-text-primary"
                    }`}
                >
                    {activity.label}
                </Text>
                <Text
                    className={`text-sm ${
                        isSelected ? "text-primary/70" : "text-text-secondary"
                    }`}
                >
                    {activity.subtitle}
                </Text>
            </View>

            {/* Check badge */}
            {isSelected && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                    <Check size={14} color="#fff" strokeWidth={3} />
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function StepActivityLevel({
    data,
    setData,
    onNext,
    onBack,
}: {
    data: CurrentStats & Profile;
    setData: Dispatch<SetStateAction<CurrentStats & Profile>>;
    onNext: () => void;
    onBack: () => void;
}) {
    return (
        <View className="bg-background w-full flex-1 justify-center py-16">
            {/* Header */}
            <View className="mb-8 px-4">
                <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
                    Activity Level
                </Text>
                <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
                    How active are you?
                </Text>
                <Text className="text-base text-text-secondary leading-relaxed">
                    Pick the level that best fits your typical week.
                </Text>
            </View>

            {/* Cards */}
            <View className="flex-1 justify-center gap-3 px-4">
                {ACTIVITY_LEVELS.map((activity) => (
                    <ActivityCard
                        key={activity.value}
                        activity={activity}
                        isSelected={data.activityLevel === activity.value}
                        onPress={() =>
                            setData({ ...data, activityLevel: activity.value })
                        }
                    />
                ))}
            </View>

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
                    onPress={onNext}
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
