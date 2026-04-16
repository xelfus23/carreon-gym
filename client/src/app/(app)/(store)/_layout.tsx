import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { Stack, useNavigation } from "expo-router";
import { Menu } from "lucide-react-native"; // Change to Menu Icon
import { DrawerActions } from "@react-navigation/native"; // Import this!
import { COLORS } from "@/src/consts/colors";
import CustomHeader from "../../components/CustomHeader";

export default function Layout() {
    const navigation = useNavigation();

    return (
        <Stack
            screenOptions={{
                header: (props) => <CustomHeader title={props.route.name} />,
            }}
        >
            <Stack.Screen name="store" />
        </Stack>
    );
}
