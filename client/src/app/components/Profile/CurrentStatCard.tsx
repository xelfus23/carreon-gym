import { useUserProfile } from "@/src/context/profileProvider";
import { formatDate } from "@/src/utils/formatDate";
import { Text, View } from "react-native";
import StatCard from "./StatCard";

export default function CurrentStatCard() {
    const { profile } = useUserProfile();

    return (
        <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-text-primary text-lg font-bold">
                    Current Stats
                </Text>
                {profile?.currentStats?.lastRecorded && (
                    <Text className="text-text-secondary text-xs">
                        Updated: {formatDate(profile.currentStats.lastRecorded)}
                    </Text>
                )}
            </View>

            <View className="flex-row flex-wrap gap-3">
                <StatCard
                    label="Weight"
                    value={profile?.currentStats?.weightKg || null}
                    unit="kg"
                />
                <StatCard
                    label="Body Fat"
                    value={profile?.currentStats?.bodyFatPercent || null}
                    unit="%"
                />
                <StatCard
                    label="Muscle Mass"
                    value={profile?.currentStats?.muscleMassKg || null}
                    unit="kg"
                />
            </View>
        </View>
    );
}
