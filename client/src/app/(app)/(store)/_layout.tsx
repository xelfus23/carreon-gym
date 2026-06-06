import React from "react";
import { Stack } from "expo-router";
import CustomHeader from "../../components/CustomHeader";
import { ShoppingBasket } from "lucide-react-native";
import { CustomScreenOptions } from "@/src/types/stackParam";



export default function Layout() {
  return (
    <Stack
      screenOptions={{
        header: (props) => {
          // 2. Cast the standard options to include your custom properties safely
          const options = props.options as typeof props.options & CustomScreenOptions;
          const renderIcon = options.headerIcon;

          return (
            <CustomHeader
              title={options.title ?? props.route.name}
              icon={typeof renderIcon === 'function' ? renderIcon() : null}
            />
          );
        },
      }}
    >
      <Stack.Screen
        name="store"
        options={{
          title: "Gym store menu",
          headerIcon: () => <ShoppingBasket color="#FFF" size={24} />,
        } as any}
      />
    </Stack>
  );
}