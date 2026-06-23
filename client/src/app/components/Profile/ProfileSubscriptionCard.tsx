import { useUserProfile } from "@/src/context/profileProvider";
import { useModal } from "@/src/context/ModalProvider";
import { formatDate } from "@/src/utils/formatDate";
import {
  getActiveSubscriptions,
  getSubscriptionStatusColor,
  getSubscriptionSummary,
  getUserSubscriptions,
} from "@/src/utils/subscription";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";

export default function SubscriptionCard() {
  const { profile } = useUserProfile();
  const { currentSubscriptions } = useModal();

  const summary = getSubscriptionSummary(profile);
  const activeSubscriptions = getActiveSubscriptions(profile);
  const subscriptions = getUserSubscriptions(profile);
  const primaryActive = activeSubscriptions[0];
  const hasMore = subscriptions.length > 1;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={currentSubscriptions.show}
      className="bg-surface rounded-2xl p-4 mb-4 border border-primary"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1 pr-3">
          <Text className="text-text-secondary text-xs mb-1">
            Subscription Status
          </Text>
          <Text
            className={`text-lg font-bold ${getSubscriptionStatusColor(summary.status === "none" ? undefined : summary.status)}`}
          >
            {summary.headline}
          </Text>
          {summary.subtitle && (
            <Text className="text-text-secondary text-xs mt-1" numberOfLines={2}>
              {summary.subtitle}
            </Text>
          )}
          {hasMore && (
            <Text className="text-primary text-[11px] font-semibold mt-1">
              View all {subscriptions.length} plans
            </Text>
          )}
        </View>

        <View className="items-end gap-2">
          {primaryActive?.expiryDate && (
            <View className="items-end">
              <Text className="text-text-secondary text-xs">Expires</Text>
              <Text className="text-text-primary text-sm font-medium">
                {formatDate(primaryActive.expiryDate, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-1">
            <Text className="text-primary text-xs font-semibold">Details</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={COLORS.primary}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
