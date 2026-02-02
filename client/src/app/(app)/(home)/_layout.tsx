import React from "react";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import {
    CameraIcon,
    LayoutGrid,
    LucideDumbbell,
    MessageSquare,
    User2,
} from "lucide-react-native";

import { COLORS } from "@/src/consts/colors";
import CustomHeader from "@/src/app/components/CustomHeader";

export default function ProtectedRouteLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarHideOnKeyboard: true,
                header: (props) => <CustomHeader title={props.route.name} />,
                headerBackground: () => <View className="bg-surface h-full" />,
                tabBarBackground: () => (
                    <View className="bg-surface h-full border-t border-border" />
                ),
                tabBarStyle: {
                    borderTopWidth: 0,
                    paddingTop: 2,
                },
                tabBarLabel: ({ children }) => (
                    <Text className="text-gray-400 text-xs">
                        {children.charAt(0).toUpperCase() + children.slice(1)}
                    </Text>
                ),
            }}
        >
            <Tabs.Screen
                name="chat"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <MessageSquare
                            color={
                                focused
                                    ? COLORS.textPrimary
                                    : COLORS.textSecondary
                            }
                        />
                    ),
                    tabBarHideOnKeyboard: true,
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <LayoutGrid
                            color={
                                focused
                                    ? COLORS.textPrimary
                                    : COLORS.textSecondary
                            }
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="plans"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <LucideDumbbell
                            color={
                                focused
                                    ? COLORS.textPrimary
                                    : COLORS.textSecondary
                            }
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <User2
                            color={
                                focused
                                    ? COLORS.textPrimary
                                    : COLORS.textSecondary
                            }
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="camera"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <CameraIcon
                            color={
                                focused
                                    ? COLORS.textPrimary
                                    : COLORS.textSecondary
                            }
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
