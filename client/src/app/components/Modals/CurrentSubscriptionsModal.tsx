import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";
import { useUserProfile } from "@/src/context/profileProvider";
import { formatDate } from "@/src/utils/formatDate";
import {
  formatSubscriptionCategory,
  formatSubscriptionStatus,
  getSubscriptionStatusBadge,
  getSubscriptionStatusColor,
  getUserSubscriptions,
} from "@/src/utils/subscription";

interface CurrentSubscriptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export default function CurrentSubscriptionsModal({
  visible,
  onClose,
  onUpgrade,
}: CurrentSubscriptionsModalProps) {
  const { profile } = useUserProfile();
  const subscriptions = getUserSubscriptions(profile);

  return (
    <Modal transparent visible={visible} animationType="slide">
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 bg-surface rounded-full items-center justify-center"
          >
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text className="text-text-primary font-bold text-xl">
            My Subscriptions
          </Text>
          <View className="w-10" />
        </View>

        <Text className="text-text-secondary text-sm px-5 pb-4">
          Your current gym plans across membership, classes, and add-ons.
        </Text>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 24,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
        >
          {subscriptions.length > 0 ? (
            subscriptions.map((sub) => (
              <View
                key={`${sub.id ?? sub.planName}-${sub.category ?? "plan"}`}
                className="bg-surface rounded-2xl p-4 border border-border"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-text-primary text-base font-bold">
                      {sub.planName}
                    </Text>
                    <Text className="text-text-secondary text-xs mt-1">
                      {formatSubscriptionCategory(sub.category)}
                    </Text>
                  </View>

                  <View
                    className={`px-2.5 py-1 rounded-full ${getSubscriptionStatusBadge(sub.status)}`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${getSubscriptionStatusColor(sub.status)}`}
                    >
                      {formatSubscriptionStatus(sub.status)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-6 mt-4">
                  {sub.startDate && (
                    <View>
                      <Text className="text-text-secondary text-[11px]">
                        Started
                      </Text>
                      <Text className="text-text-primary text-sm font-medium mt-0.5">
                        {formatDate(sub.startDate, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  )}

                  {sub.expiryDate && (
                    <View>
                      <Text className="text-text-secondary text-[11px]">
                        Expires
                      </Text>
                      <Text className="text-text-primary text-sm font-medium mt-0.5">
                        {formatDate(sub.expiryDate, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View className="py-20 items-center justify-center">
              <Ionicons
                name="card-outline"
                size={48}
                color={COLORS.textSecondary}
                style={{ opacity: 0.5 }}
              />
              <Text className="text-text-primary font-semibold mt-3">
                No subscriptions yet
              </Text>
              <Text className="text-text-secondary text-sm text-center mt-1 px-8">
                Choose a plan to unlock gym access, classes, and more.
              </Text>
            </View>
          )}
        </ScrollView>

        {onUpgrade && (
          <View className="px-4 pb-8 pt-4 bg-background border-t border-surface">
            <TouchableOpacity
              onPress={onUpgrade}
              className="rounded-2xl py-4 items-center bg-primary"
            >
              <Text className="font-bold text-base text-background">
                {subscriptions.length > 0
                  ? "Upgrade or Add a Plan"
                  : "Browse Subscription Plans"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
