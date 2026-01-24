import { Stack } from "expo-router";
import { Text, View } from "react-native";
import { AuthProvider } from "../context/authContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
    return (
        <AuthProvider>
            <SafeAreaView className="flex-1 bg-gray-950">
                <Stack>
                    <Stack.Screen
                        name="start"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="login"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="register"
                        options={{ headerShown: false }}
                    />
                </Stack>
            </SafeAreaView>
        </AuthProvider>
    );
}
