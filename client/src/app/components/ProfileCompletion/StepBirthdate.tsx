import {
  View,
  Text,
  NativeScrollEvent,
  FlatList,
  NativeSyntheticEvent,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import React, { memo, useEffect, useMemo, useState, useRef } from "react";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 7;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const CENTER_OFFSET = (VISIBLE_ITEMS - 1) / 2;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 50 }, (_, i) =>
  (new Date().getFullYear() - i).toString()
);

type ScrollPickerType = {
  items: string[];
  currentValue: string | number;
  onValueChange: (val: string) => void;
  flex?: number;
};

const PickerItem = memo(
  function PickerItem({
    item,
    index,
    scrollY,
  }: {
    item: string;
    index: number;
    scrollY: Animated.Value;
  }) {
    const itemOffset = index * ITEM_HEIGHT;

    const scale = scrollY.interpolate({
      inputRange: [
        itemOffset - ITEM_HEIGHT * 3,
        itemOffset - ITEM_HEIGHT * 2,
        itemOffset - ITEM_HEIGHT,
        itemOffset,
        itemOffset + ITEM_HEIGHT,
        itemOffset + ITEM_HEIGHT * 2,
        itemOffset + ITEM_HEIGHT * 3,

      ],
      outputRange: [0.8, 0.82, 0.92, 1.2, 0.92, 0.82, 0.8],
      extrapolate: "clamp",
    });

    const opacity = scrollY.interpolate({
      inputRange: [
        itemOffset - ITEM_HEIGHT * 3,
        itemOffset - ITEM_HEIGHT * 2,
        itemOffset - ITEM_HEIGHT,
        itemOffset,
        itemOffset + ITEM_HEIGHT,
        itemOffset + ITEM_HEIGHT * 2,
        itemOffset + ITEM_HEIGHT * 3,
      ],
      outputRange: [0, 0.2, 0.4, 1, 0.4, 0.2, 0],
      extrapolate: "clamp",
    });

    return (
      <View style={{ height: ITEM_HEIGHT }} className="items-center justify-center px-1">
        <Animated.View style={{ transform: [{ scale }], opacity }} className="items-center justify-center w-full">
          <Text numberOfLines={1} className="text-base tracking-tight text-text-primary dark:text-white font-bold">
            {item}
          </Text>
        </Animated.View>
      </View>
    );
  }
);


const ScrollPicker = memo(function ScrollPicker({
  items,
  currentValue,
  onValueChange,
  flex = 1,
}: ScrollPickerType) {
  const flatListRef = useRef<FlatList>(null);
  const selectedStr = currentValue.toString();
  const currentIndex = items.indexOf(selectedStr);
  const scrollY = useRef(new Animated.Value(0)).current;
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current && currentIndex !== -1) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: currentIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 30);
      hasMounted.current = true;
      return () => clearTimeout(timer);
    }
  });

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    if (index >= 0 && index < items.length) {
      const targetValue = items[index];
      if (targetValue !== selectedStr) {
        onValueChange(targetValue);
      }
    }
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocity = event.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(velocity) < 0.1) {
      handleScrollEnd(event);
    }
  };

  const Spacer = () => <View style={{ height: ITEM_HEIGHT * CENTER_OFFSET }} />;

  return (
    <View style={{ flex, height: PICKER_HEIGHT }} className="overflow-hidden">
      <Animated.FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        ListHeaderComponent={Spacer}
        ListFooterComponent={Spacer}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        initialNumToRender={VISIBLE_ITEMS + 2}
        maxToRenderPerBatch={VISIBLE_ITEMS}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item, index }) => (
          <PickerItem item={item} index={index} scrollY={scrollY} />
        )}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.currentValue.toString() === nextProps.currentValue.toString() &&
    prevProps.items.length === nextProps.items.length
  );
});

export default function StepBirthdate({
  data,
  setData,
  onNext,
  onBack,
}: ProfileCompletionScreenProps) {
  const initialDate = useMemo(
    () =>
      data?.birthDate
        ? new Date(data.birthDate)
        : new Date(new Date().getFullYear() - 22, 0, 1),
    [data?.birthDate],
  );

  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());

  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    [selectedMonth, selectedYear],
  );

  const DAYS = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
    [daysInMonth],
  );

  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  const handleNext = () => {
    if (setData) {
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
      setData((prev) => ({ ...prev, birthDate: dateString }));
    }
    if (onNext) onNext();
  };

  return (
    <View className="w-full flex-1 py-16 justify-between">
      <View className="mb-10 px-4">
        <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
          Birthday
        </Text>
        <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-2">
          When were you born?
        </Text>
        <Text className="text-base text-text-secondary leading-relaxed">
          Carreon AI uses your age parameters to build safer, customized exertion baselines.
        </Text>
      </View>

      <View className="flex-1 px-4">
        <View
          style={{ height: PICKER_HEIGHT }}
          className="flex-row items-center px-4 relative overflow-hidden"
        >
          <View
            pointerEvents="none"
            style={{
              height: ITEM_HEIGHT,
              top: ITEM_HEIGHT * CENTER_OFFSET
            }}
            className="absolute left-4 right-4 border-y-2 border-primary/20 rounded-xl"
          />

          <ScrollPicker
            items={MONTHS}
            currentValue={MONTHS[selectedMonth]}
            onValueChange={(val) => setSelectedMonth(MONTHS.indexOf(val))}
            flex={1.3}
          />
          <ScrollPicker
            items={DAYS}
            currentValue={selectedDay}
            onValueChange={(val) => setSelectedDay(parseInt(val))}
            flex={0.8}
          />
          <ScrollPicker
            items={YEARS}
            currentValue={selectedYear}
            onValueChange={(val) => setSelectedYear(parseInt(val))}
            flex={1}
          />
        </View>
      </View>

      <View className="flex flex-row justify-evenly gap-4 px-4 mt-6">
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          className="flex-1 p-4 rounded-2xl bg-surface border border-border items-center justify-center"
        >
          <Text className="text-text-secondary font-bold text-lg">
            Back
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          className="flex-[2] p-4 rounded-2xl bg-primary items-center justify-center shadow-md shadow-primary/20"
        >
          <Text className="text-background font-black text-lg">
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}