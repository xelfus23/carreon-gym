import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";
import { SubscriptionCard } from "../../components/Subscription/SubscriptionCard";
import { useRouter } from "expo-router";

export type SubscriptionTypes = {
    name: string;
    price: number;
    duration: number;
    perks: string[];
    savingsLabel?: string;
    isPopular?: boolean;
    icon: keyof typeof Ionicons.glyphMap;
};

const DUMMY_PLAN: SubscriptionTypes[] = [
    {
        name: "Daily Pass",
        price: 150,
        duration: 1,
        icon: "barbell-outline",
        perks: ["Full facility access", "Locker room included"],
        isPopular: false,
    },
    {
        name: "Weekly Pass",
        price: 500,
        duration: 7,
        icon: "calendar-outline",
        perks: [
            "Full facility access",
            "Locker room included",
            "1 trainer session",
        ],
        savingsLabel: "Save 53%",
        isPopular: true,
    },
    {
        name: "Monthly Membership",
        price: 1500,
        duration: 30,
        icon: "star-outline",
        perks: [
            "Full facility access",
            "Locker room included",
            "4 trainer sessions",
            "Group classes access",
        ],
        savingsLabel: "Save 67%",
        isPopular: false,
    },
];

export default function Subscription() {
    const [selectedPlan, setSelectedPlan] = useState<string>("Weekly Pass");

    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-surface rounded-full items-center justify-center"
                >
                    <Ionicons
                        name="close"
                        size={20}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
                <Text className="text-text-primary font-bold text-xl">
                    Subscription Plans
                </Text>
                <View className="w-10" />
            </View>

            <Text className="text-text-secondary text-sm px-5 pb-4">
                Unlock full gym access. Choose a plan that fits your schedule.
            </Text>

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    gap: 12,
                }}
                showsVerticalScrollIndicator={false}
            >
                {DUMMY_PLAN.map((sub) => (
                    <SubscriptionCard
                        key={sub.name}
                        {...sub}
                        isSelected={selectedPlan === sub.name}
                        onSelect={() => setSelectedPlan(sub.name)}
                    />
                ))}
            </ScrollView>

            <View className="left-0 right-0 px-4 pb-8 pt-4 bg-background border-t border-surface">
                <TouchableOpacity className="bg-primary rounded-2xl py-4 items-center">
                    <Text className="text-background font-bold text-base">
                        Get {selectedPlan}
                    </Text>
                </TouchableOpacity>
                <Text className="text-text-secondary text-xs text-center mt-2">
                    Cancel or pause anytime. No hidden fees.
                </Text>
            </View>
        </SafeAreaView>
    );
}
