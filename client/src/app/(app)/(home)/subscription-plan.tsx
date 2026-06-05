import { View, Text, TouchableOpacity, ScrollView, Pressable } from "react-native";
import React, { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";
import { useRouter } from "expo-router";
import { useSubscriptionPlans } from "@/src/hooks/useSubscriptionPlans";
import SubscriptionCard from "../../components/Subscription/SubscriptionCard";

export type FilteredPlan = "All" | "membership" | "class" | "add_on" | "personal_training";

export default function Subscription() {
  const router = useRouter();
  const { subPlans = [] } = useSubscriptionPlans();

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilteredPlan>("membership");

  const filterCategories: FilteredPlan[] = [
    "All",
    "membership",
    "personal_training",
    "class",
    "add_on",
  ];

  // 1. Memoized Filter Logic
  const filteredSubPlans = useMemo(() => {
    if (activeFilter === "All") return subPlans;

    return subPlans.filter((plan) => {
      return plan.category.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [subPlans, activeFilter]);

  const selectedPlan = useMemo(() => {
    return subPlans.find((plan) => plan.id === selectedPlanId);
  }, [subPlans, selectedPlanId]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header Bar */}
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


      {/* 3. Horizontal Filter Tabs */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {filterCategories.map((category) => {
            const isActive = activeFilter === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => {
                  setActiveFilter(category);
                  // Optional: Reset plan selection on tab switch to avoid hidden state selections
                  setSelectedPlanId(null);
                }}
                className={`px-4 py-2 rounded-full border ${isActive
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
                  }`}
              >
                <Text
                  className={`font-semibold text-xs ${isActive ? "text-background" : "text-text-secondary"
                    }`}
                >
                  {category.replaceAll(/_+/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Plans Grid/List */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {filteredSubPlans.length > 0 ? (
          filteredSubPlans.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              {...sub}
              isSelected={selectedPlanId === sub.id}
              onSelect={() => setSelectedPlanId(sub.id)}
            />
          ))
        ) : (
          <View className="py-20 items-center justify-center">
            <Ionicons name="pricetags-outline" size={48} color={COLORS.textSecondary} style={{ opacity: 0.5 }} />
            <Text className="text-text-secondary mt-2 text-sm">
              No plans available under &quot;{activeFilter}&quot; right now.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 5. Fixed Checkout Button Footer */}
      <View className="left-0 right-0 px-4 pb-8 pt-4 bg-background border-t border-surface">
        <TouchableOpacity
          onPress={() => {
            if (!selectedPlan) return;

            router.push({
              pathname: "/(app)/(home)/payment-instructions",
              params: {
                transactionType: "plan",
                planId: selectedPlan.id,
                itemName: selectedPlan.name,
                amount: String(selectedPlan.price),
                quantity: "1",
                planName: selectedPlan.name,
              },
            });
          }}
          disabled={!selectedPlanId}
          className={`rounded-2xl py-4 items-center ${selectedPlanId ? "bg-primary" : "bg-surface opacity-60"
            }`}
        >
          <Text
            className={`font-bold text-base ${selectedPlanId ? "text-background" : "text-text-secondary"
              }`}
          >
            {selectedPlan
              ? `Get ${selectedPlan.name}`
              : "Select a Plan to Continue"}
          </Text>
        </TouchableOpacity>
        <Text className="text-text-secondary text-xs text-center mt-2">
          Cancel or pause anytime. No hidden fees.
        </Text>
      </View>
    </SafeAreaView>
  );
}