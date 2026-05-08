import React from "react";
import { Tabs } from "expo-router";
import { COLORS } from "@/src/consts/colors";
import { TouchableOpacity, View } from "react-native";
import { ClipboardCheck, ClipboardList } from "lucide-react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const PlanTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    return (
        <View>
            <View className="flex-row bg-surface bottom-20 self-center w-[40%] rounded-full border border-border px-2 py-2">
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

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
                                className={`items-center overflow-hidden justify-center`}
                            >
                                {options.tabBarIcon &&
                                    options.tabBarIcon({
                                        focused: isFocused,
                                        color: isFocused
                                            ? COLORS.textPrimary
                                            : COLORS.textSecondary,
                                        size: 16,
                                    })}
                            </View>

                            {isFocused && (
                                <View className="h-1 w-1 bg-text-primary rounded-full mt-1" />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export default function WorkoutLayout() {
    return (
        <Tabs
            tabBar={(props) => <PlanTabBar {...props} />}
            screenOptions={{
                headerShown: false,
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
                name="today-exercise"
                options={{
                    title: "Today's Workout",
                    tabBarIcon: (props) => <ClipboardCheck {...props} />,
                }}
            />
            <Tabs.Screen
                name="plan-list"
                options={{
                    title: "Workout Plans",
                    tabBarIcon: (props) => <ClipboardList {...props} />,
                }}
            />
        </Tabs>
    );
}
