import { Stack } from "expo-router";

export default function HomeLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
                name="plan-list"
                options={{
                    headerShown: false,
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                    animationDuration: 0.1,
                    gestureEnabled: true,
                }}
            />
            <Stack.Screen
                name="subscription-plan"
                options={{
                    headerShown: false,
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                    animationDuration: 0.1,
                    gestureEnabled: true,
                }}
            />
            <Stack.Screen
                name="exercise-log"
                options={{
                    headerShown: false,
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                }}
            />

            <Stack.Screen
                name="today-exercise"
                options={{
                    headerShown: false,
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                }}
            />
            <Stack.Screen
                name="workout-session"
                options={{
                    headerShown: false,
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                }}
            />
            <Stack.Screen
                name="profile-completion"
                options={{
                    headerShown: false,
                    presentation: "fullScreenModal",
                    animation: "slide_from_left",
                    gestureEnabled: false,
                }}
            />
        </Stack>
    );
}
