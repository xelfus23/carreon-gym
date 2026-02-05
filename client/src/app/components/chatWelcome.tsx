// src/components/Chat/WelcomeScreen.tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Dumbbell, Zap, Target } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";

interface WelcomeScreenProps {
    onStartChat: () => void;
    loading?: boolean;
}

export default function WelcomeScreen({
    onStartChat,
    loading,
}: WelcomeScreenProps) {
    return (
        <View className="flex-1 bg-background justify-center items-center px-8">
            {/* Hero Icon */}
            <View className="bg-primary-dark/20 p-6 rounded-full mb-6">
                <Dumbbell size={64} color={COLORS.primary} />
            </View>

            {/* Title */}
            <Text className="text-3xl font-bold text-white text-center mb-3">
                Meet Your AI Trainer
            </Text>

            {/* Subtitle */}
            <Text className="text-lg text-text-secondary text-center mb-8">
                Get personalized workout plans tailored to your goals
            </Text>

            {/* Features */}
            <View className="w-full gap-4 mb-8">
                <FeatureItem
                    icon={<Target size={24} color={COLORS.primary} />}
                    text="Custom routines based on your fitness level"
                />
                <FeatureItem
                    icon={<Zap size={24} color={COLORS.primary} />}
                    text="Real-time coaching and form tips"
                />
                <FeatureItem
                    icon={<Dumbbell size={24} color={COLORS.primary} />}
                    text="Workouts designed for Careon Gym equipment"
                />
            </View>

            {/* CTA Button */}
            <TouchableOpacity
                onPress={onStartChat}
                disabled={loading}
                className={`w-full py-4 rounded-xl ${
                    loading ? "bg-primary-dark/50" : "bg-primary-dark"
                }`}
            >
                <Text className="text-white text-center text-lg font-semibold">
                    {loading ? "Starting..." : "Start Training Session"}
                </Text>
            </TouchableOpacity>

            {/* Info Text */}
            <Text className="text-text-secondary text-sm text-center mt-6">
                Your conversation will be saved so you can pick up where you
                left off
            </Text>
        </View>
    );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <View className="flex-row items-center space-x-3 bg-surface p-4 gap-4 rounded-xl">
            <View>{icon}</View>
            <Text className="text-white flex-1">{text}</Text>
        </View>
    );
}
