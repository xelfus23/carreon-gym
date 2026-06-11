import { useRef, useCallback, useEffect, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  TextInput,
  PixelRatio,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/src/consts/colors";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";

const VISIBLE_HEIGHT = 500;
const ITEM_HEIGHT = PixelRatio.roundToNearestPixel(48);
const HEIGHT_DATA = Array.from({ length: 151 }, (_, i) => (250 - i).toString());

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function StepHeight({
  data,
  setData,
  onNext,
  onBack,
}: ProfileCompletionScreenProps) {
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<any>(null);
  const lastIndexRef = useRef<number>(-1);
  const scrollY = useRef(new Animated.Value(0)).current;

  const initialValue = data?.heightCm || 170;
  const initialIndex = 250 - initialValue;

  // Lightweight local state exclusively for instant visual tick-highlighting
  const [localHeight, setLocalHeight] = useState<number>(initialValue);

  // Synchronize local layout if parent state changes externally
  useEffect(() => {
    if (data?.heightCm && data.heightCm !== localHeight) {
      setLocalHeight(data.heightCm);
    }
  }, [data?.heightCm, localHeight]);

  // 1. High-speed native scroll listener
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const index = Math.round(value / ITEM_HEIGHT);

      if (index === lastIndexRef.current) return;
      lastIndexRef.current = index;

      if (HEIGHT_DATA[index]) {
        const currentVal = parseInt(HEIGHT_DATA[index]);
        if (!isNaN(currentVal)) {
          // Update the native text layout instantly
          if (textInputRef.current) {
            textInputRef.current.setNativeProps({ text: HEIGHT_DATA[index] });
          }

          // Instantly update local state to refresh the active highlighting line
          setLocalHeight(currentVal);

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    });

    return () => scrollY.removeListener(listenerId);
  }, [scrollY]);

  // 2. Heavy global state commits only when the scroll comes to a complete halt
  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const yOffset = event.nativeEvent.contentOffset.y;
      const index = Math.round(yOffset / ITEM_HEIGHT);

      if (HEIGHT_DATA[index]) {
        const newValue = parseInt(HEIGHT_DATA[index]);
        if (!isNaN(newValue) && data?.heightCm !== newValue) {
          setData!((prev) => ({ ...prev, heightCm: newValue }));
        }
      }
    },
    [data?.heightCm, setData],
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      const val = parseInt(item);
      // Fixed: Checked against localHeight so lines change color instantly during momentum slides
      const isMajor = val % 10 === 0;

      return (
        <View
          className="flex-row items-center justify-start px-4"
          style={{
            height: ITEM_HEIGHT,
            minHeight: ITEM_HEIGHT,
            maxHeight: ITEM_HEIGHT,
            justifyContent: "flex-start",
          }}
        >
          <View
            className={`h-[2px] rounded-full ${
              isMajor ? "w-12 bg-primary" : "w-6 bg-border"
            }`}
          />
          <View className="ml-4">
            <Text
              className="text-text-secondary font-medium text-xs opacity-40"
              style={{
                fontSize: 12,
                lineHeight: 12,
                includeFontPadding: false,
                color: COLORS.textPrimary,
              }}
            >
              {val}
            </Text>
          </View>
        </View>
      );
    },
    [], // Re-evaluates items instantly when localHeight shifts
  );

  return (
    <View className="bg-background w-full flex-1 justify-center py-16">
      {/* Header */}
      <View className="mb-8 px-4">
        <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
          HEIGHT
        </Text>
        <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
          Select your Height
        </Text>
      </View>

      <View className="flex-1 flex-row items-center">
        {/* Left Side: Big Result Display */}
        <View className="flex-1 items-center justify-center">
          <View className="flex-row items-baseline">
            <AnimatedTextInput
              ref={textInputRef}
              underlineColorAndroid="transparent"
              editable={false}
              defaultValue={initialValue.toString()}
              style={{
                fontSize: 72,
                fontWeight: "900",
                color: COLORS.textPrimary || "#000",
                textAlign: "right",
              }}
            />
            <Text className="text-primary text-2xl ml-2 uppercase font-black">
              cm
            </Text>
          </View>
        </View>

        {/* Right Side: The Ruler Picker */}
        <View className="w-1/3 h-full justify-center">
          <View
            style={{
              position: "absolute",
              left: -20,
              top: "50%",
              marginTop: -16,
              zIndex: 10,
            }}
          >
            <ChevronRight size={32} color={COLORS.primary} />
          </View>

          <View className="h-[500px] overflow-hidden">
            <Animated.FlatList
              ref={flatListRef as any}
              data={HEIGHT_DATA}
              keyExtractor={(item) => item}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
              onMomentumScrollEnd={handleScrollEnd}
              onScrollEndDrag={handleScrollEnd}
              contentContainerStyle={{
                paddingVertical: (VISIBLE_HEIGHT - ITEM_HEIGHT) / 2,
              }}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              initialScrollIndex={initialIndex}
            />
          </View>
        </View>
      </View>

      {/* Footer Buttons */}
      <View className="flex flex-row justify-evenly gap-4 px-4 mt-8">
        <TouchableOpacity
          onPress={onBack}
          className="flex-1 p-4 rounded-2xl bg-surface border border-border items-center"
        >
          <Text className="text-text-secondary font-bold text-lg">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          className="flex-[2] p-4 rounded-2xl bg-primary items-center shadow-lg shadow-primary/30"
        >
          <Text className="text-background font-black text-lg">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
