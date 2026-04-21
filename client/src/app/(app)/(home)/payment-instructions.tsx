import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { useGymDetails } from "@/src/hooks/useGymDetails";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentInstructions() {
    const { gymDetails, isLoading } = useGymDetails();

    // 1. Handle the loading state so the app doesn't show empty fields
    if (isLoading) {
        return (
            <SafeAreaView className="bg-background flex-1 justify-center items-center">
                <Text>Loading Payment Info...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="bg-background flex-1">
            <View className="px-4">
                <Text className="text-text-primary font-bold text-xl mb-2">
                    PAYMENT INSTRUCTIONS
                </Text>

                <View className="bg-surface p-4 rounded-lg shadow-sm border border-border">
                    <Text className="text-text-secondary">
                        1. Send payment to GCash:
                        <Text className="font-bold text-primary">
                            {" "}
                            {gymDetails?.gcash_number || "N/A"}
                        </Text>
                    </Text>

                    <Text className="text-text-secondary mb-4">
                        Account Name:
                        <Text className="font-bold text-primary">
                            {" "}
                            {gymDetails?.gcash_name || "Careon Gym"}
                        </Text>
                    </Text>

                    {/* 2. Added explicit dimensions and better styling */}
                    <View className="items-center justify-center p-4 rounded-md">
                        <Image
                            source={require("../../../assets/ui/gcash-qr.jpg")}
                            style={{ width: 250, height: 250 }}
                            resizeMode="contain"
                        />
                        <Text className="mt-2 text-xs text-text-secondary italic">
                            Scan to pay via GCash
                        </Text>
                    </View>
                </View>

                <Text className="text-text-secondary mt-6">
                    2. Take a screenshot of your receipt and upload it in the
                    next step.
                </Text>
            </View>

            <View>
                <TouchableOpacity>
                    <Text>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                    <Text>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
