import { useAuth } from "@/src/context/authContext";
import { Stack, Redirect } from "expo-router";
import { Text, View } from "react-native";

export default function CheckAuth() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Text>Loading...</Text>
            </View>
        );
    }

    return isAuthenticated ? (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(drawer)" />
        </Stack>
    ) : (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack>
    );
}
