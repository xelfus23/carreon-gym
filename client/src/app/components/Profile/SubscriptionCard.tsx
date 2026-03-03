import { useUserProfile } from "@/src/context/profileContext";
import { displayValue } from "@/src/utils/displayValue";
import { formatDate } from "@/src/utils/formatDate";
import { Text, TouchableOpacity, View } from "react-native";

export default function SubscriptionCard() {
    const { profile } = useUserProfile();

    // Get subscription status color
    const getSubscriptionTextColor = (status: string | undefined) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "text-primary";
            case "expired":
                return "text-danger";
            case "cancelled":
                return "text-danger";
            case "pending":
                return "text-yellow-500";
            default:
                return "text-text-secondary";
        }
    };

    return (
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-primary">
            <View className="flex-row justify-between items-center">
                <View className="flex-1">
                    <Text className="text-text-secondary text-xs mb-1">
                        Subscription Status
                    </Text>
                    <Text
                        className={`text-lg font-bold ${getSubscriptionTextColor(profile?.subscription?.status)}`}
                    >
                        {displayValue(
                            profile?.subscription?.status
                                ? profile.subscription.status
                                      .charAt(0)
                                      .toUpperCase() +
                                      profile.subscription.status.slice(1)
                                : null,
                            "No Active Plan",
                        )}
                    </Text>
                    {profile?.subscription?.planName && (
                        <Text className="text-text-secondary text-xs mt-1">
                            {profile.subscription.planName}
                        </Text>
                    )}
                </View>
                {profile?.subscription?.expiryDate && (
                    <View className="items-end">
                        <Text className="text-text-secondary text-xs">
                            Expires
                        </Text>
                        <Text className="text-text-primary text-sm font-medium">
                            {formatDate(profile.subscription.expiryDate)}
                        </Text>
                    </View>
                )}
            </View>

            {profile?.subscription?.status !== "active" && (
                <TouchableOpacity className="bg-primary rounded-lg p-3 mt-3">
                    <Text className="text-background font-bold text-center text-sm">
                        Upgrade Membership
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
