import React from "react";
import { Tabs } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import {
  CameraIcon,
  LayoutGrid,
  LucideDumbbell,
  MessagesSquare,
  Plus,
  PlusCircle,
  User2,
} from "lucide-react-native";

import { COLORS } from "@/src/consts/colors";
import CustomHeader from "@/src/app/components/CustomHeader";

import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";

export function MyTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <SafeAreaView
      edges={["bottom"]}
      className="bg-background pb-2 border border-border"
    >
      <View className="flex-row  self-center w-[92%]">
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
              className="flex-1 items-center justify-center py-2"
            >
              <View
                className={`items-center overflow-hidden justify-center rounded-full w-12 h-12`}
              >
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? COLORS.primary : COLORS.textSecondary,
                    size: isFocused ? 28 : 24,
                  })}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function ProtectedRouteLayout() {
  return (
    <Tabs
      tabBar={(props) => <MyTabBar {...props} />}
      screenOptions={{
        header: ({ route, options }) => (
          <CustomHeader title={options.title ?? route.name} />
        ),
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
        name="todayExercise"
        options={{
          title: "My Workout",
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
          tabBarIcon: (props) => (
            <PlusCircle {...props} size={48} strokeWidth={1} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "QR Scanner",
          tabBarIcon: (props) => <CameraIcon {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "My Profile",
          tabBarIcon: (props) => <User2 {...props} />,
        }}
      />
    </Tabs>
  );
}
