import React from "react";
import { Tabs } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import {
    CameraIcon,
    LayoutGrid,
    LucideDumbbell,
    MessagesSquare,
    User2,
} from "lucide-react-native";

import { COLORS } from "@/src/consts/colors";
import CustomHeader from "@/src/app/components/CustomHeader";

import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export function MyTabBar({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    return (
        <View className="bg-background">
            <View className="flex-row bg-surface bottom-16 self-center w-[92%] rounded-full border border-border px-2 py-2">
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const isChat = route.name === "chat";

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.name}
                            onPress={onPress}
                            activeOpacity={0.7}
                            className="flex-1 items-center justify-center"
                        >
                            <View
                                className={`items-center overflow-hidden justify-center ${
                                    isChat
                                        ? `${isFocused ? "bg-primary-dark" : "bg-primary"} rounded-full w-12 h-12 -top-1`
                                        : ""
                                }`}
                            >
                                {options.tabBarIcon &&
                                    options.tabBarIcon({
                                        focused: isFocused,
                                        color: isChat
                                            ? isFocused
                                                ? COLORS.textPrimary
                                                : COLORS.background
                                            : isFocused
                                              ? COLORS.textPrimary
                                              : COLORS.textSecondary,
                                        size: isChat ? 28 : 24,
                                    })}
                            </View>

                            {isFocused && !isChat && (
                                <View className="h-1 w-1 bg-text-primary rounded-full mt-1" />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export default function ProtectedRouteLayout() {
    return (
        <Tabs
            tabBar={(props) => <MyTabBar {...props} />}
            screenOptions={{
                header: (props) => <CustomHeader title={props.route.name} />,
                tabBarHideOnKeyboard: true,
                sceneStyle: {
                    backgroundColor: COLORS.background,
                },
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Home",
                    tabBarIcon: (props) => <LayoutGrid {...props} />,
                }}
            />
            <Tabs.Screen
                name="plans"
                options={{
                    title: "Workout",
                    tabBarIcon: (props) => (
                        <View style={{ transform: [{ rotate: "45deg" }] }}>
                            <LucideDumbbell {...props} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: "AI Trainer",
                    tabBarIcon: (props) => <MessagesSquare {...props} />,
                }}
            />
            <Tabs.Screen
                name="camera"
                options={{
                    title: "Scan",
                    tabBarIcon: (props) => <CameraIcon {...props} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: (props) => <User2 {...props} />,
                }}
            />
        </Tabs>
    );
}
