import { View, Text } from "react-native";
import React from "react";
import { useUserProfile } from "@/src/context/profileContext";

export default function Dashboard() {
    const { profile } = useUserProfile();

    if (!profile) return;

    return (
        <View className="flex-1 bg-background">
            <View className="p-4 h-1/5 justify-center">
                {/* <Text className="text-text-primary text-5xl">
                    Hello{" "}
                    <Text className="text-primary font-bold">
                        {profile?.firstName.charAt(0).toUpperCase() +
                            profile?.firstName.slice(1)}
                    </Text>
                </Text> */}
            </View>
        </View>
    );
}
