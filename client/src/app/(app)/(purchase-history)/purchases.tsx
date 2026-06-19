import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { usePayments } from "@/src/hooks/usePayments";
import { uploadImage } from "@/src/utils/uploadImage";
import { COLORS } from "@/src/consts/colors";
import getCustomLoader from "../../components/CustomRefreshControl";

export interface ProductItemProps {
  id: number;
  name: string;
  quantity: number;
  price_at_purchase: number;
  icon_url: string;
}

export type TransactionProps = {
  transaction_id: number;
  user_id: number;
  member_name: string;
  transaction_type: "plan" | "product";
  items: ProductItemProps[];
  amount: number;
  method: string;
  status: "pending" | "paid" | "cancelled" | "rejected";
  paid_at: string;
  created_at: string;
  reference_no: string | null;
  receipt_image_url?: string | null;
  origin: "mobile_online" | "walk_in_pos";
  quantity: number;
};

export default function Purchases() {
  const { submitProof, paymentHistory, isLoading, refresh } = usePayments();
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  useEffect(() => {
    console.log("Synced Purchases:", paymentHistory);
  }, [paymentHistory]);

  const handleUploadReceipt = async (paymentId: number) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos to upload a payment receipt.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) return;

    const selectedUri = pickerResult.assets[0].uri;

    try {
      setIsUploading(paymentId);
      const uploadResult = await uploadImage(selectedUri, "receipts");
      const hostedS3Url = uploadResult.data?.url;

      if (!hostedS3Url) {
        throw new Error("Server failed to generate image access link.");
      }

      await submitProof(paymentId, hostedS3Url);
      Alert.alert("Success", "Receipt linked successfully! Awaiting admin review.");
      refresh();
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not save verification image.");
    } finally {
      setIsUploading(null);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "paid":
        return { text: "text-emerald-400", bg: "bg-emerald-950/45 border-emerald-800/60" };
      case "cancelled":
      case "rejected":
        return { text: "text-rose-400", bg: "bg-rose-950/45 border-rose-800/60" };
      default:
        return { text: "text-amber-400", bg: "bg-amber-950/45 border-amber-800/60" };
    }
  };

  const getMethodStyles = (method: string) => {
    switch (method?.toLowerCase()) {
      case "gcash":
        return "bg-sky-500";
      case "cash":
        return "bg-emerald-500";
      default:
        return "bg-amber-500";
    }
  };

  const renderItem = ({ item }: { item: TransactionProps }) => {
    const statusStyle = getStatusStyles(item.status);
    const methodStyle = getMethodStyles(item.method);
    const isExpanded = expandedCardId === item.transaction_id;

    const dateFormatted = new Date(item.paid_at || item.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Extract item data clean from your structured items array object
    const itemsArray = item.items || [];
    const itemsCount = itemsArray.length;

    // Fallback display calculation
    const primaryDisplayName = itemsCount > 0
      ? `${itemsArray[0].name} ${itemsArray[0].quantity > 1 ? `(x${itemsArray[0].quantity})` : ""}`
      : item.transaction_type === "plan" ? "Subscription Plan" : "Gym Product";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpandedCardId(isExpanded ? null : item.transaction_id)}
        className={`bg-zinc-900 border mb-4 rounded-2xl p-4 transition-all ${isExpanded ? "border-zinc-700" : "border-zinc-800"
          }`}
      >
        {/* Header Summary */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase">
              Ref: {item.reference_no || `TRX-${item.transaction_id}`}
            </Text>
            <Text className="text-white text-base font-bold mt-0.5" numberOfLines={1}>
              {primaryDisplayName}
            </Text>
            <Text className="text-zinc-500 text-xs mt-0.5">{dateFormatted}</Text>
          </View>

          <View className="items-end">
            <View className={`px-2.5 py-0.5 rounded-full border ${statusStyle.bg}`}>
              <Text className={`text-[10px] font-black uppercase tracking-wider ${statusStyle.text}`}>
                {item.status}
              </Text>
            </View>
            <View className={`px-2 py-0.5 rounded-md border mt-1.5 ${methodStyle}`}>
              <Text className="text-[9px] font-bold capitalize tracking-wide">{item.method}</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Nested Items Drawer */}
        {isExpanded && itemsCount > 0 && (
          <View className="mt-4 pt-3 border-t border-zinc-800">
            <Text className="text-zinc-400 text-xs font-semibold mb-2">Order Breakdown</Text>

            {itemsArray.map((productItem, index) => (
              <View
                key={index}
                className="bg-zinc-950/50 rounded-xl p-2.5 mb-1.5 border border-zinc-800/40 flex-row justify-between items-center"
              >
                {/* IMAGE FRAME CONTAINER */}
                <View className="w-10 h-10 bg-zinc-900 rounded-lg mr-3 items-center justify-center overflow-hidden border border-zinc-800">
                  {productItem.icon_url ? (
                    <Image
                      source={{ uri: productItem.icon_url }}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  ) : (
                    /* Fallback indicator typography when no media asset exists */
                    <Text className="text-[10px] text-zinc-600 font-bold font-mono">
                      {item.transaction_type === "plan" ? "📋" : "📦"}
                    </Text>
                  )}
                </View>

                {/* DETAILS COLUMN */}
                <Text className="text-zinc-300 text-xs font-medium flex-1 pr-2">
                  {productItem.name}
                </Text>

                <Text className="text-zinc-500 text-xs font-bold">
                  Qty: {productItem.quantity || item.quantity || 1}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="h-[1px] bg-zinc-800/80 my-3" />

        {/* Footer Pricing & Verification Status Triggers */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">Amount</Text>
            <Text className="text-primary text-lg font-black mt-0.5">
              ₱{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View className="flex-1 items-end pl-4">
            {item.status === "pending" && (
              <>
                {item.receipt_image_url ? (
                  <View className="bg-zinc-800/60 px-3 py-2 rounded-xl border border-zinc-700/50">
                    <Text className="text-zinc-400 text-xs font-semibold tracking-wide">Awaiting Verification</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleUploadReceipt(item.transaction_id)}
                    disabled={isUploading !== null}
                    className="bg-primary active:bg-primary-dark px-4 py-2.5 rounded-xl flex-row items-center shadow-md"
                  >
                    {isUploading === item.transaction_id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-background text-xs font-black uppercase tracking-wider">Upload Receipt</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}

            {item.status === "paid" && (
              <Text className="text-emerald-500 text-xs font-bold italic tracking-wide">Verified Purchase</Text>
            )}

            {(item.status === "cancelled" || item.status === "rejected") && (
              <Text className="text-zinc-500 text-xs font-bold italic tracking-wide">Declined</Text>
            )}

          </View>
        </View>

        {/* Subtle touch indicator for items summary list mapping */}
        {!isExpanded && itemsCount > 1 && (
          <View className="items-center mt-2 -mb-1">
            <Text className="text-red-500/80 text-[10px] font-bold tracking-wider uppercase">
              + View All {itemsCount} Items
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-zinc-950">
      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-2xl font-black tracking-tight">Payment History</Text>
            <Text className="text-zinc-400 text-xs mt-0.5">Track your gym orders and subscriptions</Text>
          </View>
          {isLoading && isUploading === null && <ActivityIndicator color={COLORS.primary} />}
        </View>

        {paymentHistory.length === 0 && !isLoading ? (
          <View className="flex-1 justify-center items-center px-8 pb-12">
            <Text className="text-zinc-500 text-center font-semibold text-lg">No records found</Text>
            <Text className="text-zinc-600 text-center text-xs mt-1">
              Any requests you make via checkout or plan activation will appear right here.
            </Text>
            <TouchableOpacity
              onPress={refresh}
              className="mt-4 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl"
            >
              <Text className="text-white text-xs font-bold">Refresh Page</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={paymentHistory}
            keyExtractor={(item) => item.transaction_id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            refreshControl={getCustomLoader(isLoading && isUploading === null, refresh)}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </View>
  );
}