import React, { useRef } from "react";
import { Animated, PanResponder, View, Text, Dimensions } from "react-native";
import { Portal } from "@gorhom/portal";
import { Clock } from "lucide-react-native";
import { useSessionTimer } from "./SessionTimer";
import { COLORS } from "@/src/consts/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const PILL_WIDTH = 130;
const PILL_HEIGHT = 44;
const TAB_BAR_HEIGHT = 60;
const BOTTOM_MARGIN = 12;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const FloatingSessionTimer = () => {
  const { elapsed, isRunning } = useSessionTimer();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

  const initialX = SCREEN_WIDTH - PILL_WIDTH - 16;
  const initialY = SCREEN_HEIGHT - PILL_HEIGHT - TAB_BAR_HEIGHT - insets.bottom - BOTTOM_MARGIN;

  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;


  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // ✅ Snapshot current flat position before each drag
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextX = clamp(
          gestureState.dx,
          -(pan.x as any)._offset,
          SCREEN_WIDTH - PILL_WIDTH - (pan.x as any)._offset
        );
        const nextY = clamp(
          gestureState.dy,
          -(pan.y as any)._offset,
          SCREEN_HEIGHT - PILL_HEIGHT - TAB_BAR_HEIGHT - insets.bottom - (pan.y as any)._offset
        );
        pan.setValue({ x: nextX, y: nextY });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset(); // ✅ Merge offset + value into a clean single value
      },
    })
  ).current;

  if (!isRunning) return null;

  return (
    <Portal hostName="floating">
      <Animated.View
        style={{
          position: "absolute",
          transform: pan.getTranslateTransform(),
          zIndex: 999,
        }}

        {...panResponder.panHandlers}
      >
        <View className="bg-background gap-2 items-center flex-row border border-primary/30 rounded-full px-4 py-2">
          <Clock size={14} color={COLORS.primary} />
          <Text
            style={{
              color: COLORS.primary,
              fontSize: 13,
              fontWeight: "600",
              letterSpacing: 1,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatTime(elapsed)}
          </Text>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: COLORS.primary,
              opacity: 0.8,
            }}
          />
        </View>
      </Animated.View>
    </Portal>
  );
};