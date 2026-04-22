import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import React, { useMemo, useState } from "react";
import { useGymDetails } from "@/src/hooks/useGymDetails";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { submitPendingPayment } from "@/src/services/purchaseService";

export default function PaymentInstructions() {
  const { gymDetails, isLoading } = useGymDetails();
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

  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const transactionType = params.transactionType ?? "plan";
  const quantity = Number(params.quantity ?? "1");

  const itemSummary = useMemo(
    () => ({
      itemName:
        params.itemName ??
        params.planName ??
        (transactionType === "plan" ? "Subscription Plan" : "Product"),
      amount: Number(params.amount ?? "0"),
    }),
    [params.amount, params.itemName, params.planName, transactionType],
  );

  const pickReceipt = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Needed",
        "Allow photo library access to upload your receipt screenshot.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!receiptUri) {
      Alert.alert("Missing Receipt", "Please upload your receipt first.");
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await submitPendingPayment({
        transactionType,
        planId: Number(params.planId),
        planName: params.planName,
        productId: params.productId
          ? Number(params.productId)
          : undefined,
        quantity,
        method: "gcash",
        receiptUri,
      });
      Alert.alert(
        "Submitted",
        "Your payment is now pending verification. Admin will mark it as paid after review.",
      );
      router.back();
    } catch (error) {
      Alert.alert(
        "Submission Failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Handle the loading state so the app doesn't show empty fields
  if (isLoading) {
    return (
      <SafeAreaView className="bg-background flex-1 justify-center items-center">
        <Text>Loading Payment Info...</Text>
      </SafeAreaView>
    );
  }

  if (step === 1) {
    return (
      <SafeAreaView className="bg-background flex-1">
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        >
          <Text className="text-text-primary font-bold text-xl mb-2">
            PAYMENT INSTRUCTIONS
          </Text>

          <View className="bg-surface p-4 rounded-lg shadow-sm border border-border">
            <Text className="text-text-secondary">
              1. Send payment to GCash:
              <Text className="font-bold text-primary">
                {" "}
                {gymDetails?.gcash_number || "N/A"}
              </Text>
            </Text>

            <Text className="text-text-secondary mb-4">
              Account Name:
              <Text className="font-bold text-primary">
                {" "}
                {gymDetails?.gcash_name || "Careon Gym"}
              </Text>
            </Text>

            <View className="items-center justify-center p-4 rounded-md">
              <Image
                source={require("../../../assets/ui/gcash-qr.jpg")}
                style={{ width: 250, height: 250 }}
                resizeMode="contain"
              />
              <Text className="mt-2 text-xs text-text-secondary italic">
                Scan to pay via GCash
              </Text>
            </View>
          </View>

          <Text className="text-text-secondary mt-6">
            2. Take a screenshot of your receipt and continue to
            upload.
          </Text>

          <View className="bg-surface p-4 rounded-lg border border-border mt-4">
            <Text className="text-text-primary font-semibold">
              Payment For: {itemSummary.itemName}
            </Text>
            <Text className="text-text-secondary mt-1">
              Amount: PHP {itemSummary.amount.toFixed(2)}
            </Text>
            <Text className="text-text-secondary">
              Quantity: {quantity}
            </Text>
          </View>
        </ScrollView>

        <View className="px-4 pb-6 gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="py-3 rounded-lg border bg-surface border-border items-center"
          >
            <Text className="text-red-400">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStep(2)}
            className="bg-primary py-4 rounded-lg items-center"
          >
            <Text className="text-background font-bold">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <Text className="text-text-primary font-bold text-xl mb-2">
          UPLOAD RECEIPT
        </Text>
        <Text className="text-text-secondary mb-4">
          Upload your screenshot so admin can verify and mark this
          payment as paid.
        </Text>

        <View className="bg-surface p-4 rounded-lg border border-border mb-4">
          <Text className="text-text-primary font-semibold">
            {itemSummary.itemName}
          </Text>
          <Text className="text-text-secondary mt-1">
            Amount: PHP {itemSummary.amount.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={pickReceipt}
          className="py-3 rounded-lg border border-primary items-center mb-4"
        >
          <Text className="text-primary font-semibold">
            {receiptUri
              ? "Change Receipt Screenshot"
              : "Upload Receipt Screenshot"}
          </Text>
        </TouchableOpacity>

        <View className="bg-surface rounded-lg border border-border p-2 items-center justify-center">
          {receiptUri ? (
            <Image
              source={{ uri: receiptUri }}
              style={{
                width: "100%",
                height: 420,
                borderRadius: 10,
              }}
              resizeMode="contain"
            />
          ) : (
            <Text className="text-text-secondary py-20">
              No receipt selected yet.
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="px-4 pb-6 gap-3">
        <TouchableOpacity
          onPress={() => setStep(1)}
          className="py-3 rounded-lg border bg-surface border-border items-center"
        >
          <Text className="text-text-primary">
            Back to Instructions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="bg-primary py-4 rounded-lg items-center"
        >
          <Text className="text-background font-bold">
            {isSubmitting
              ? "Submitting..."
              : "Submit Payment Proof"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
