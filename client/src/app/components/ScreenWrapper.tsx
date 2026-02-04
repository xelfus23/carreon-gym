import { View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
    children: React.ReactNode;
    bg?: string; // Optional custom background color
};

export default function ScreenWrapper({
    children,
    bg = "bg-background",
}: Props) {
    return (
        <View className={`flex-1 border  ${bg}`}>
            <SafeAreaView edges={["left", "right"]} className="flex-1">
                {children}
            </SafeAreaView>
        </View>
    );
}
