import { Image, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

export default function Start() {
    const router = useRouter();

    return (
        <View className="bg-background flex-1 items-center justify-center">
            <View className="container max-w-sm flex items-center justify-center gap-4">
                <Image
                    className="h-32"
                    resizeMode="contain"
                    source={require("../assets/images/brand-logo.png")}
                />
                <TouchableOpacity
                    onPress={() => router.push("/login")}
                    className="bg-primary rounded-full"
                >
                    <Text className="text-background font-interBold px-8 py-4 text-xl">
                        Get Started
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
