import { View, Text, Image, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import React, { useMemo, useState } from "react";
import { useGymDetails } from "@/src/hooks/useGymDetails";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePayments } from "@/src/hooks/usePayments";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";

export default function PaymentInstructions() {
  const { gymDetails, isLoading: gymLoading } = useGymDetails();
  const { createPurchase } = usePayments();
  const router = useRouter();
  
  const params = useLocalSearchParams<{
    transactionType?: "plan" | "product";
    itemName?: string;
    amount?: string;
    quantity?: string;
    planId?: string;
    planName?: string;
    productId?: string;
  }>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const transactionType = params.transactionType ?? "plan";
  const quantity = Number(params.quantity ?? "1");

  const itemSummary = useMemo(() => ({
    itemName: params.itemName ?? params.planName ?? "Subscription Item",
    amount: Number(params.amount ?? "0"),
  }), [params]);

  const handleConfirmOrder = async () => {
    try {
      setIsSubmitting(true);

      // Step 1: Create transaction record in backend database status: 'pending'
      await createPurchase({
        transactionType,
        planId: params.planId ? Number(params.planId) : undefined,
        planName: params.planName,
        productId: params.productId ? Number(params.productId) : undefined,
        quantity,
        method: "gcash",
      });

      Alert.alert(
        "Order Initialized",
        "Your order request has been generated! Please pay via GCash, keep your receipt screenshot, and upload it inside your Billing History tab.",
        [
          { 
            text: "Go to History", 
            onPress: () => router.replace("/(app)/(home)/(tabs)/profile") // Route to your history page path
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        "Order Failed",
        error instanceof Error ? error.message : "Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (gymLoading) {
    return (
      <SafeAreaView className="bg-background flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF4500" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      {/* Structural Header Wrapper */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-border/40"
        >
          <Ionicons name="close" size={20} color={COLORS.textSecondary ?? "#6B7280"} />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-xl">GCash Instructions</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}>
        <Text className="text-text-secondary text-sm mb-5">
          Follow these directions to process your gym subscription tracking request.
        </Text>

        {/* Merchant Card Information */}
        <View className="bg-surface p-5 rounded-2xl border border-border mb-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="wallet" size={18} color="#FF4500" />
            <Text className="text-text-primary font-bold text-xs tracking-wider uppercase">Official Receiver</Text>
          </View>
          
          <View className="border-b border-border/60 pb-3 mb-3">
            <Text className="text-xs text-text-secondary uppercase">GCash Number</Text>
            <Text className="font-bold text-xl text-primary mt-0.5 select-all">
              {gymDetails?.gcash_number || "N/A"}
            </Text>
          </View>

          <View>
            <Text className="text-xs text-text-secondary uppercase">Account Name</Text>
            <Text className="font-semibold text-base text-text-primary mt-0.5">
              {gymDetails?.gcash_name || "Careon Gym"}
            </Text>
          </View>
        </View>

        {/* QR Scan Container Component */}
        <View className="bg-surface p-4 rounded-2xl border border-border items-center justify-center shadow-sm mb-5">
          <Image
            source={require("../../../assets/ui/gcash-qr.jpg")}
            style={{ width: 220, height: 220 }}
            resizeMode="contain"
          />
          <Text className="mt-3 text-xs text-text-secondary text-center italic px-4">
            Take a screenshot of this QR code to scan directly inside your native GCash Application.
          </Text>
        </View>

        {/* Invoice Summary Card */}
        <View className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
          <Text className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2">Checkout Details</Text>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-text-primary font-semibold text-sm">{itemSummary.itemName}</Text>
            <Text className="text-text-secondary text-sm">x{quantity}</Text>
          </View>
          <View className="flex-row justify-between items-center border-t border-border/60 pt-2 mt-2">
            <Text className="text-text-primary font-bold">Total Amount Due</Text>
            <Text className="text-primary font-bold text-base">PHP {itemSummary.amount.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Primary Execution Confirmation Target */}
      <View className="px-4 pb-8 pt-4 bg-background border-t border-surface">
        <TouchableOpacity
          onPress={handleConfirmOrder}
          disabled={isSubmitting}
          className="bg-primary rounded-2xl py-4 items-center justify-center min-h-[56px]"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-background font-bold text-base">I Have Paid — File Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}