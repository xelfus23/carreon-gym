import { useUserProfile } from "@/src/context/profileProvider";
import { displayValue } from "@/src/utils/displayValue";
import { formatDate } from "@/src/utils/formatDate";
import { Text, View } from "react-native";
import InfoRow from "./InfoRow";
import { formatActivityLevel } from "@/src/utils/formatActivityLevel";

export default function ProfileDetailsCard() {
    const { profile } = useUserProfile();

    return (
        <View className="bg-surface rounded-2xl p-4 mb-4">
            <Text className="text-text-primary text-lg font-bold mb-4">
                Profile Details
            </Text>

            <InfoRow
                label="Height"
                value={
                    profile?.profile?.heightCm
                        ? `${profile.profile.heightCm} cm`
                        : "N/A"
                }
            />
            <InfoRow
                label="Gender"
                value={displayValue(
                    profile?.profile?.gender
                        ? profile.profile.gender.charAt(0).toUpperCase() +
                              profile.profile.gender.slice(1)
                        : null,
                )}
            />
            <InfoRow
                label="Birth Date"
                value={formatDate(profile?.profile?.birthDate)}
            />
            <InfoRow
                label="Activity Level"
                value={formatActivityLevel(profile?.profile?.activityLevel)}
            />
            <InfoRow
                label="Goal"
                value={displayValue(profile?.profile?.goal)}
                isLast
            />
        </View>
    );
}
