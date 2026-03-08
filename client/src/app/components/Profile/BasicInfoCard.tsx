import { Text, View } from "react-native";
import InfoRow from "./InfoRow";
import { displayValue } from "@/src/utils/displayValue";
import { useUserProfile } from "@/src/context/profileProvider";

export default function BasicInfoCard() {
    const { profile } = useUserProfile();

    return (
        <View className="bg-surface rounded-2xl p-4 mb-4">
            <Text className="text-text-primary text-lg font-bold mb-4">
                Basic Information
            </Text>

            <InfoRow
                label="First Name"
                value={displayValue(profile?.firstName)}
            />
            <InfoRow
                label="Last Name"
                value={displayValue(profile?.lastName)}
            />
            <InfoRow
                label="Phone Number"
                value={displayValue(profile?.phoneNumber)}
            />
            <InfoRow
                label="Account Status"
                value={profile?.verified ? "Verified" : "Not Verified"}
                valueColor={
                    profile?.verified ? "text-success" : "text-text-secondary"
                }
                isLast
            />
        </View>
    );
}
