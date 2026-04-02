import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons"; // Assuming you use Expo/Lucide
import { COLORS } from "@/src/consts/colors";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";

export default function StepStart({ onNext }: ProfileCompletionScreenProps) {
    return (
        <View className="bg-background w-full flex-1 justify-center py-16">
            <View className="flex-1 justify-center items-center px-4">
                <View
                    style={{ backgroundColor: COLORS.primary + "15" }}
                    className="w-32 h-32 rounded-full items-center justify-center mb-8"
                >
                    <Ionicons
                        name="sparkles"
                        size={60}
                        color={COLORS.primary}
                    />
                </View>

                <Text className="text-4xl font-bold text-primary text-center mb-4">
                    Let&apos;s get started
                </Text>

                <Text className="text-lg text-center font-medium text-text-primary px-4 leading-6">
                    We&apos;ll use your details to create a custom plan tailored
                    to your body and goals.
                </Text>

                <View className="mt-6 flex-row items-center p-3 rounded-xl">
                    <Ionicons
                        name="shield-checkmark"
                        size={20}
                        color={COLORS.textSecondary}
                    />
                    <Text className="text-sm text-text-secondary ml-2 italic">
                        Your data is stored securely and privately.
                    </Text>
                </View>
            </View>

            <View className="w-full px-4">
                <Text className="text-center text-text-secondary mb-6 font-medium">
                    Ready to transform?
                </Text>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onNext}
                    className="p-4 rounded-2xl bg-primary items-center "
                >
                    <View className="flex-row items-center">
                        <Text className="font-black text-xl text-background mr-2">
                            Continue
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
