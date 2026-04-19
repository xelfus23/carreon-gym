import { Drawer } from "expo-router/drawer";
import CustomDrawerContent from "../components/CustomDrawer";
import { COLORS } from "@/src/consts/colors";
import { Home, Settings, Star, Store, Subscript } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DrawerLayout() {
    return (
        <Drawer
            screenOptions={{
                headerShown: false,
                drawerActiveBackgroundColor: COLORS.primaryDark,
                drawerActiveTintColor: COLORS.textPrimary,
                drawerInactiveTintColor: COLORS.textSecondary,
                drawerStyle: {
                    backgroundColor: COLORS.surface,
                    width: "70%",
                },
            }}
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            initialRouteName="(home)"
        >
            <Drawer.Screen
                name="(home)"
                options={{
                    drawerLabel: "Home",
                    drawerIcon: ({ focused }) => (
                        <Home
                            color={
                                focused
                                    ? COLORS.textPrimary
                                    : COLORS.textSecondary
                            }
                        />
                    ),
                }}
            />

            <Drawer.Screen
                name="(settings)"
                options={{
                    drawerLabel: "Settings",
                    drawerIcon: ({ focused }) => (
                        <Settings
                            color={
                                focused
                                    ? COLORS.textPrimary
                                    : COLORS.textSecondary
                            }
                        />
                    ),
                }}
            />
            <Drawer.Screen
                name="(store)"
                options={{
                    drawerLabel: "Store",
                    drawerIcon: ({ focused }) => (
                        <Store
                            color={
                                focused
                                    ? COLORS.textPrimary
                                    : COLORS.textSecondary
                            }
                        />
                    ),
                }}
            />
        </Drawer>
    );
}
