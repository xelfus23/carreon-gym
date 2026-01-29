import { Drawer } from "expo-router/drawer";
import CustomDrawerContent from "../components/CustomDrawer";
import { COLORS } from "@/src/consts/colors";
import { Home, Settings } from "lucide-react-native";

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
        </Drawer>
    );
}
