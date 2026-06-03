import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";
import { useRouter } from "expo-router";
import { useSubscriptionPlans } from "@/src/hooks/useSubscriptionPlans";
import SubscriptionCard from "../../components/Subscription/SubscriptionCard";

export default function Subscription() {
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const { subPlans } = useSubscriptionPlans();

  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-surface rounded-full items-center justify-center"
        >
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
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
        {subPlans.map((sub) => (
          <SubscriptionCard
            key={sub.name}
            {...sub}
            isSelected={selectedPlanId === sub.id}
            onSelect={() => setSelectedPlanId(sub.id)}
          />
        ))}
      </ScrollView>

      <View className="left-0 right-0 px-4 pb-8 pt-4 bg-background border-t border-surface">
        <TouchableOpacity
          onPress={() => {
            const selected = subPlans.find(
              (plan) => plan.id === selectedPlanId,
            );

            if (!selected) return;

            router.push({
              pathname: "/(app)/(home)/payment-instructions",
              params: {
                transactionType: "plan",
                planId: selected.id,
                itemName: selected.name,
                amount: String(selected.price),
                quantity: "1",
                planName: selected.name,
              },
            });
          }}
          className="bg-primary rounded-2xl py-4 items-center"
        >
          <Text className="text-background font-bold text-base">
            Get {subPlans.find((v) => v.id === selectedPlanId)?.name}
          </Text>
        </TouchableOpacity>
        <Text className="text-text-secondary text-xs text-center mt-2">
          Cancel or pause anytime. No hidden fees.
        </Text>
      </View>
    </SafeAreaView>
  );
}
