import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { COLORS } from "@/src/consts/colors";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";

export default function StepMuscleMass({
    data,
    setData,
    onNext,
    onBack,
}: ProfileCompletionScreenProps) {
    const handleChange = (text: string) => {
        const val = text.replace(/[^0-9.]/g, "");
        setData!((prev) => ({ ...prev, muscleMassKg: Number(val) }));
    };

    return (
        <View className="w-full flex-1 justify-center py-16 px-4">
            <View className="mb-8">
                <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
                    Advanced Metrics
                </Text>
                <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
                    Muscle Mass
                </Text>
                <Text className="text-base text-text-secondary leading-relaxed">
                    Enter your current muscle mass in kilograms.
                </Text>
            </View>

            <View className="flex-1 justify-center items-center">
                <View className="flex-row items-end gap-2">
                    <TextInput
                        keyboardType="decimal-pad"
                        placeholder="0"
                        value={data?.muscleMassKg?.toString() || ""}
                        onChangeText={handleChange}
                        className="text-6xl font-black text-primary text-center min-w-[120px]"
                        placeholderTextColor={COLORS.border}
                    />
                    <Text className="text-2xl font-bold text-text-secondary mb-3">
                        kg
                    </Text>
                </View>
            </View>

            <View className="flex flex-row gap-4">
                <TouchableOpacity
                    onPress={onBack}
                    className="flex-1 p-4 rounded-2xl bg-surface border border-border items-center"
                >
                    <Text className="text-text-secondary font-bold text-lg">
                        Back
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onNext}
                    className="flex-[2] p-4 rounded-2xl bg-primary items-center"
                >
                    <Text className="text-background font-black text-lg">
                        {data?.muscleMassKg ? "Next" : "Skip"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
