import { Drawer } from "expo-router/drawer";
import CustomDrawerContent from "../components/CustomDrawer";
import { COLORS } from "@/src/consts/colors";
import { History, Home, Settings, ShoppingBasket } from "lucide-react-native";
import { ModalProvider } from "@/src/context/ModalProvider";

export default function DrawerLayout() {
  return (
    <ModalProvider>
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
          name="(store)"
          options={{
            drawerLabel: "Store Menu",
            drawerIcon: ({ focused }) => (
              <ShoppingBasket
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
          name="(purchase-history)"
          options={{
            drawerLabel: "Purchase History",
            drawerIcon: ({ focused }) => (
              <History
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
    </ModalProvider>
  );
}
