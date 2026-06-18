import { AuthProvider } from "../context/authProvider";
import "../../global.css";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import {
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from "@expo-google-fonts/montserrat";

import { UserProfileProvider } from "../context/profileProvider";
import { KeyboardProvider } from "react-native-keyboard-controller";
import FloatingSessionTimer from "./components/FloatingSessionTimer";
import { PortalHost, PortalProvider } from "@gorhom/portal";
import SessionTimerProvider from "./components/SessionTimer";

export default function RootLayout() {

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <KeyboardProvider>
      <PortalProvider>
        <AuthProvider>

          <UserProfileProvider>
            <Slot />

            <SessionTimerProvider>
              <FloatingSessionTimer />
              <PortalHost name="floating" />
            </SessionTimerProvider>
          </UserProfileProvider>
        </AuthProvider>
      </PortalProvider>
    </KeyboardProvider>
  );
}
