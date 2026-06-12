import { Modal, Text, View, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { useRouter } from "expo-router";

export default function SubscriptionReminder({
  title,
  text,
  setReminderOpen,
}: {
  text: string;
  title: string;
  setReminderOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const router = useRouter()

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Modal transparent animationType="none">
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="flex-1 items-center justify-center bg-background/80"
      >
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="items-center gap-4 w-full"
        >
          <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
            <Ionicons
              name="lock-closed"
              size={28}
              color="#your-primary-color"
            />
          </View>

          <View>
            <Text className="text-text-primary text-xl text-center font-interBold">
              {title}
            </Text>
            <Text className="text-text-secondary text-sm text-center leading-5 font-inter">
              {text}
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/(app)/(home)/subscription-plan")} className="bg-primary py-3 w-[50%] rounded-full items-center mt-2 active:opacity-80">
            <Text className="text-background font-interBold text-base">
              View Plans
            </Text>
          </TouchableOpacity>

          {/* Secondary action */}
          <TouchableOpacity className="pb-1" onPress={() => setReminderOpen(false)}>
            <Text className="text-text-secondary text-sm font-inter">
              Maybe later
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
