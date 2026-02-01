import { useAuth } from "@/src/context/authContext";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../login";
import DrawerLayout from "../(drawer)/_layout";
import Start from "../index";
import Register from "../register";

const Stack = createNativeStackNavigator();

function DashboardNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="dashboard" component={DrawerLayout} />
        </Stack.Navigator>
    );
}

function AuthNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" component={Start} />
            <Stack.Screen name="login" component={Login} />
            <Stack.Screen name="register" component={Register} />
        </Stack.Navigator>
    );
}

//TODO: NOT WORKING!

export default function CheckAuth() {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) return null;

    if (isAuthenticated && user) {
        // Authenticated navigator
        return <DashboardNavigator />;
    } else {
        // Unauthenticated navigator
        return <AuthNavigator />;
    }
}
