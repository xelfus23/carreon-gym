import { Text, TouchableOpacity, View } from "react-native";
import "../global.css";
import { useRouter } from "expo-router";

export default function Start() {
    const router = useRouter();

    return (
        <View className="bg-gray-950 flex-1 items-center justify-center">
            <View className="container max-w-sm flex items-center justify-center gap-4">
                <Text className="text-gray-100 text-5xl font-bold text-center w-full">
                    Careon Gym App
                </Text>
                <TouchableOpacity
                    onPress={() => router.push("/login")}
                    className="bg-blue-500 rounded-full"
                >
                    <Text className="text-gray-100 px-8 py-4 text-xl">
                        Get Started
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
