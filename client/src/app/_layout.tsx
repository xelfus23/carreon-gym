import { AuthProvider } from "../context/authContext";
import "../../global.css";
import { useFonts } from "expo-font";

import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
} from "@expo-google-fonts/inter";

import {
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
} from "@expo-google-fonts/montserrat";
import { Stack } from "expo-router";
import { UserProfileProvider } from "../context/profileContext";
import CheckAuth from "./components/CheckAuth";

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_700Bold,
        Montserrat_700Bold,
        Montserrat_800ExtraBold,
    });

    // Prevent UI from rendering before fonts load
    if (!fontsLoaded) return null;

    return (
        <AuthProvider>
            <UserProfileProvider>
                <CheckAuth />
            </UserProfileProvider>
        </AuthProvider>
    );
}
