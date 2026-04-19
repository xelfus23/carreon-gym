import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";

export interface SubscriptionCardProps {
    name: string;
    price: number;
    duration: number;
    perks: string[];
    savingsLabel?: string;
    isPopular?: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    isSelected: boolean;
    onSelect: () => void;
}

export function SubscriptionCard({
    name,
    price,
    duration,
    perks,
    savingsLabel,
    isPopular,
    icon,
    isSelected,
    onSelect,
}: SubscriptionCardProps) {
    const perDayPrice = Math.round(price / duration);
    const durationLabel = duration === 1 ? "1 day" : `${duration} days`;

    return (
        <TouchableOpacity
            onPress={onSelect}
            activeOpacity={0.8}
            className={`rounded-2xl p-5 border ${
                isSelected
                    ? "border-primary bg-primary/10"
                    : "border-surface bg-surface"
            }`}
        >
            {isPopular && (
                <View className="absolute top-5 right-12 bg-primary/20 rounded-full px-3 py-1">
                    <Text className="text-primary text-xs font-semibold">
                        Most Popular
                    </Text>
                </View>
            )}

            <View className="flex-row items-start justify-between mb-4">
                <View className="w-10 h-10 rounded-xl bg-background items-center justify-center">
                    <Ionicons name={icon} size={20} color={COLORS.primary} />
                </View>
                <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                        isSelected
                            ? "border-primary bg-primary"
                            : "border-text-secondary"
                    }`}
                >
                    {isSelected && (
                        <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                </View>
            </View>

            <Text className="text-text-primary font-semibold text-base">
                {name}
            </Text>
            <Text className="text-text-secondary text-xs mb-4">
                Valid for {durationLabel}
            </Text>

            <View className="h-px bg-surface mb-4" />

            <View className="flex-row items-baseline gap-1 mb-1">
                <Text className="text-primary font-semibold text-base">₱</Text>
                <Text className="text-text-primary font-bold text-3xl">
                    {price.toLocaleString()}
                </Text>
                <Text className="text-text-secondary text-sm">
                    /{" "}
                    {duration === 1 ? "day" : duration === 7 ? "week" : "month"}
                </Text>
            </View>

            {duration > 1 ? (
                <Text className="text-text-secondary text-xs mb-4">
                    ≈ ₱{perDayPrice} per day
                    {savingsLabel ? ` — ${savingsLabel}` : ""}
                </Text>
            ) : (
                <Text className="text-text-secondary text-xs mb-4">
                    One-time drop-in access
                </Text>
            )}

            <View className="gap-2">
                {perks.map((perk) => (
                    <View key={perk} className="flex-row items-center gap-2">
                        <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <Text className="text-text-secondary text-sm">
                            {perk}
                        </Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
}
