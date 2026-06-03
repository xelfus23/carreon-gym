import { useRef, useCallback, useEffect, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  Animated,
  TextInput,
} from "react-native";
import { ChevronUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/src/consts/colors";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_WIDTH = 20;
const WEIGHT_DATA = Array.from({ length: 2201 }, (_, i) =>
  (30 + i * 0.1).toFixed(1),
);

// Allows input components to accept high-speed direct native property hooks
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function StepWeight({
  data,
  setData,
  onNext,
  onBack,
}: ProfileCompletionScreenProps) {
  const flatListRef = useRef<FlatList>(null);
  const integerInputRef = useRef<any>(null);
  const decimalInputRef = useRef<any>(null);
  const lastIndexRef = useRef<number>(-1);

  // Track scroll position seamlessly on the Native UI thread
  const scrollX = useRef(new Animated.Value(0)).current;

  const initialValue = data?.weightKg || 70.0;
  const initialIndex = Math.round((initialValue - 30) / 0.1);

  // Separate visual state exclusively for live tick highlight calculations
  const [localWeight, setLocalWeight] = useState<number>(initialValue);

  // Keep local layout synchronized if external data changes
  useEffect(() => {
    if (data?.weightKg && data.weightKg !== localWeight) {
      setLocalWeight(data.weightKg);
    }
  }, [data?.weightKg, localWeight]);

  // 1. Native Listener to update labels and trigger haptics at 60fps/120fps
  useEffect(() => {
    const listenerId = scrollX.addListener(({ value }) => {
      const index = Math.round(value / ITEM_WIDTH);

      if (index === lastIndexRef.current) return;
      lastIndexRef.current = index;

      if (WEIGHT_DATA[index]) {
        const currentVal = parseFloat(WEIGHT_DATA[index]);
        if (!isNaN(currentVal)) {
          const stringVal = currentVal.toFixed(1);
          const [integerPart, decimalPart] = stringVal.split(".");

          // Update both large text labels directly via native DOM injection
          if (integerInputRef.current) {
            integerInputRef.current.setNativeProps({ text: integerPart });
          }
          if (decimalInputRef.current) {
            decimalInputRef.current.setNativeProps({ text: `.${decimalPart}` });
          }

          // Instantly sync visual state for line color rendering updates
          setLocalWeight(currentVal);

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    });

    return () => scrollX.removeListener(listenerId);
  }, [scrollX]);

  // 2. Commit data updates into global data form structures once momentum stops completely
  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const xOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(xOffset / ITEM_WIDTH);

      if (WEIGHT_DATA[index]) {
        const newValue = parseFloat(WEIGHT_DATA[index]);
        if (!isNaN(newValue) && data?.weightKg !== newValue) {
          setData!((prev) => ({ ...prev, weightKg: newValue }));
        }
      }
    },
    [data?.weightKg, setData],
  );

  const renderItem = useCallback(({ item }: { item: string }) => {
    const val = parseFloat(item);
    const isMajor = val % 1 === 0;
    const isHalf = val % 0.5 === 0;

    return (
      <View
        style={{ width: ITEM_WIDTH }}
        className="items-center justify-end pb-4"
      >
        <View className="h-8 justify-center">
          {isMajor && (
            <Text
              className={`text-xs text-text-secondary opacity-50`}
            >
              {Math.floor(val)}
            </Text>
          )}
        </View>

        <View
          className={`w-[2px] rounded-full ${isMajor
            ? "h-10 bg-primary opacity-60"
            : isHalf
              ? "h-6 bg-text-secondary opacity-40"
              : "h-3 bg-border"
            }`}
        />
      </View>
    );
  }, []);

  const initialString = initialValue.toFixed(1);
  const [initialInteger, initialDecimal] = initialString.split(".");

  return (
    <View className="bg-background w-full flex-1 justify-center py-16">
      <View className="mb-8 px-4">
        <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
          Weight
        </Text>
        <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
          Select your weight
        </Text>
        <Text className="text-base text-text-secondary leading-relaxed">
          Be honest, we&apos;re here to help
        </Text>
      </View>

      <View className="flex-1 justify-center">
        {/* Value Preview - Fixed Split Performance Strings */}
        <View className="items-center mb-10">
          <View className="flex-row items-baseline">
            <AnimatedTextInput
              ref={integerInputRef}
              underlineColorAndroid="transparent"
              editable={false}
              defaultValue={initialInteger}
              style={{
                fontSize: 72,
                fontWeight: "900",
                color: COLORS.textPrimary || "#000",
                textAlign: "right",
                includeFontPadding: false,
              }}
            />
            <AnimatedTextInput
              ref={decimalInputRef}
              underlineColorAndroid="transparent"
              editable={false}
              defaultValue={`.${initialDecimal}`}
              style={{
                fontSize: 48,
                fontWeight: "700",
                color: COLORS.primary || "#000",
                textAlign: "left",
                includeFontPadding: false,
              }}
            />
            <Text className="text-text-secondary text-2xl ml-2 uppercase font-semibold">
              kg
            </Text>
          </View>
        </View>

        {/* Horizontal Ruler Container */}
        <View className="h-32 justify-center">
          {/* Fixed Center Indicator (The Arrow) */}
          <View className="absolute self-center bottom-0 z-10 items-center pointer-events-none">
            <ChevronUp size={28} color={COLORS.primary} />
            <View className="w-[2px] h-20 bg-primary/40 absolute bottom-6" />
          </View>

          <Animated.FlatList
            ref={flatListRef as any}
            horizontal
            data={WEIGHT_DATA}
            keyExtractor={(item) => item}
            renderItem={renderItem}
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"

            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}

            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}

            contentContainerStyle={{
              paddingHorizontal: SCREEN_WIDTH / 2 - ITEM_WIDTH / 2,
            }}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            initialScrollIndex={initialIndex}
          />
        </View>
      </View>

      {/* Navigation */}
      <View className="flex flex-row justify-evenly gap-4 px-4 mt-10">
        <TouchableOpacity
          onPress={onBack}
          className="flex-1 p-4 rounded-2xl bg-surface border border-border items-center"
        >
          <Text className="text-text-secondary font-bold text-lg">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNext}
          className="flex-[2] p-4 rounded-2xl bg-primary items-center"
        >
          <Text className="text-background font-black text-lg">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}