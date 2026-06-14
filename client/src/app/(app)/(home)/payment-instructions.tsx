import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useMemo, useState } from "react";
import { useGymDetails } from "@/src/hooks/useGymDetails";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePayments } from "@/src/hooks/usePayments";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";

type PaymentMethod = "gcash" | "cash";

interface CartItemParam {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  icon_url?: string;
}

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
    // Serialized CartItemParam[] for multi-product checkout
    items?: string;
  }>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("gcash");

  const transactionType = params.transactionType ?? "plan";
  const quantity = Number(params.quantity ?? "1");

  // Parse multi-item cart if present (from Store checkout)
  const cartItems: CartItemParam[] = useMemo(() => {
    if (params.items) {
      try {
        return JSON.parse(params.items);
      } catch {
        return [];
      }
    }
    return [];
  }, [params.items]);

  const itemSummary = useMemo(
    () => ({
      itemName: params.itemName ?? params.planName ?? "Subscription Item",
      amount: Number(params.amount ?? "0"),
    }),
    [params],
  );

  const handleConfirmOrder = async () => {
    try {
      setIsSubmitting(true);

      // if (transactionType === "product" && cartItems.length > 0) {
      //   // Fire one purchase request per cart line item
      //   for (const ci of cartItems) {
      //     await createPurchase({
      //       transactionType: "product",
      //       productId: ci.productId,
      //       quantity: ci.quantity,
      //       method: selectedMethod,
      //     });
      //   }
      // } else {

      // }

      await createPurchase({
        transactionType,
        planId: params.planId ? Number(params.planId) : undefined,
        planName: params.planName,
        productId: params.productId ? Number(params.productId) : undefined,
        quantity,
        method: selectedMethod,
      });

      // Redirect to purchase history to submit proof
      router.replace("/(app)/(purchase-history)/purchases")
    } catch (error) {
      Alert.alert(
        "Order Failed",
        error instanceof Error ? error.message : "Please try again later.",
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

  const showGCashDetails = selectedMethod === "gcash";

  return (
    <SafeAreaView className="bg-background flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-border/40"
        >
          <Ionicons
            name="close"
            size={20}
            color={COLORS.textSecondary ?? "#6B7280"}
          />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-xl">
          Online Payment Instructions
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
          paddingTop: 8,
        }}
      >
        <Text className="text-text-secondary text-sm mb-5">
          Choose your payment method and complete the steps below.
        </Text>

        {/* ── Payment Method Selector ── */}
        <View className="mb-5">
          <Text className="text-text-primary font-bold text-xs tracking-wider uppercase mb-3">
            Payment Method
          </Text>
          <View className="flex-row gap-3">
            {(["gcash"] as PaymentMethod[]).map((method) => {
              const isActive = selectedMethod === method;
              const icon =
                method === "gcash" ? "phone-portrait-outline" : "cash-outline";
              const label = method === "gcash" ? "GCash" : "Cash";
              const activeColor =
                method === "gcash"
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-emerald-500 bg-emerald-500/10";
              const activeText =
                method === "gcash" ? "text-sky-400" : "text-emerald-400";
              const activeIcon = method === "gcash" ? "#38bdf8" : "#34d399";

              return (
                <TouchableOpacity
                  key={method}
                  onPress={() => setSelectedMethod(method)}
                  className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl border-2 ${isActive ? activeColor : "border-border bg-surface"
                    }`}
                >
                  <Ionicons
                    name={icon as any}
                    size={18}
                    color={
                      isActive
                        ? activeIcon
                        : (COLORS.textSecondary ?? "#6B7280")
                    }
                  />
                  <Text
                    className={`font-bold text-sm ${isActive ? activeText : "text-text-secondary"
                      }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── GCash Details (conditional) ── */}
        {showGCashDetails && (
          <>
            <View className="bg-surface p-5 rounded-2xl border border-border mb-5 shadow-sm">
              <View className="flex-row items-center gap-2 mb-4">
                <Ionicons name="wallet" size={18} color={COLORS.primary} />
                <Text className="text-text-primary font-bold text-xs tracking-wider uppercase">
                  Official Receiver
                </Text>
              </View>

              <View className="border-b border-border/60 pb-3 mb-3">
                <Text className="text-xs text-text-secondary uppercase">
                  GCash Number
                </Text>
                <Text className="font-bold text-xl text-primary-dark mt-0.5 select-all">
                  {gymDetails?.gcash_number || "N/A"}
                </Text>
              </View>

              <View>
                <Text className="text-xs text-text-secondary uppercase">
                  Account Name
                </Text>
                <Text className="font-semibold text-base text-text-primary mt-0.5">
                  {gymDetails?.gcash_name || "Careon Gym"}
                </Text>
              </View>
            </View>

            <View className="bg-surface p-4 rounded-2xl border border-border items-center justify-center shadow-sm mb-5">
              <Image
                source={require("../../../assets/ui/gcash-qr.jpg")}
                style={{ width: 220, height: 220 }}
                resizeMode="contain"
              />
              <Text className="mt-3 text-xs text-text-secondary text-center italic px-4">
                Take a screenshot of this QR code to scan inside your GCash app.
              </Text>
            </View>
          </>
        )}

        {/* ── Cash Instructions (conditional) ── */}
        {!showGCashDetails && (
          <View className="bg-surface p-5 rounded-2xl border border-border mb-5 shadow-sm">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text className="text-text-primary font-bold text-xs tracking-wider uppercase">
                Cash Payment Instructions
              </Text>
            </View>
            <Text className="text-text-secondary text-sm leading-relaxed">
              Please pay the exact amount at the front desk. Our staff will
              issue a physical receipt. Upload a photo of that receipt in the
              next step to confirm your order.
            </Text>
          </View>
        )}

        {/* ── Order Summary ── */}
        <View className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
          <Text className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-3">
            Order Summary
          </Text>

          {/* Multi-item breakdown for product checkout */}
          {cartItems.length > 0 ? (
            <>
              {cartItems.map((ci, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between py-2 border-b border-border/40 last:border-b-0"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    {ci.icon_url ? (
                      <Image
                        source={{ uri: ci.icon_url }}
                        className="w-8 h-8 rounded-lg mr-2"
                        resizeMode="contain"
                      />
                    ) : (
                      <View className="w-8 h-8 bg-background rounded-lg mr-2 items-center justify-center">
                        <Text className="text-[10px]">📦</Text>
                      </View>
                    )}
                    <Text
                      className="text-text-primary font-semibold text-sm flex-1"
                      numberOfLines={1}
                    >
                      {ci.name}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-text-secondary text-xs">
                      x{ci.quantity}
                    </Text>
                    <Text className="text-text-primary text-xs font-bold">
                      ₱{(ci.price * ci.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            /* Single-item display for plan/single-product */
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-text-primary font-semibold text-sm">
                {itemSummary.itemName}
              </Text>
              <Text className="text-text-secondary text-sm">x{quantity}</Text>
            </View>
          )}

          <View className="flex-row justify-between items-center border-t border-border/60 pt-3 mt-2">
            <Text className="text-text-primary font-bold">
              Total Amount Due
            </Text>
            <Text className="text-primary font-bold text-base">
              ₱{itemSummary.amount.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA Footer */}
      <View className="px-4 pb-8 pt-4 bg-background border-t border-surface">
        <TouchableOpacity
          onPress={handleConfirmOrder}
          disabled={isSubmitting}
          className="bg-primary rounded-2xl py-4 items-center justify-center min-h-[56px]"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-background font-bold text-base">
                Submit Payment Request
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text className="text-text-secondary text-xs text-center mt-2">
          You&apos;ll be taken to your purchase history to upload your receipt.
        </Text>
      </View>
    </SafeAreaView>
  );
}
