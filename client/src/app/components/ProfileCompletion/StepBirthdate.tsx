import {
    View,
    Text,
    NativeScrollEvent,
    FlatList,
    NativeSyntheticEvent,
    TouchableOpacity,
} from "react-native";
import React, { memo, useEffect, useMemo, useState } from "react";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const YEARS = Array.from({ length: 88 }, (_, i) =>
    (new Date().getFullYear() - 100 + i).toString(),
).reverse();

type ScrollPickerType = {
    items: string[];
    currentValue: string | number;
    onValueChange: (val: string) => void;
    flex?: number;
};

const ScrollPicker = memo(function ScrollPicker({
    items,
    currentValue,
    onValueChange,
    flex = 1,
}: ScrollPickerType) {
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const yOffset = event.nativeEvent.contentOffset.y;
        const index = Math.round(yOffset / ITEM_HEIGHT);
        if (items[index] && items[index] !== currentValue.toString()) {
            onValueChange(items[index]);
        }
    };

    return (
        <View style={{ flex: 1, height: PICKER_HEIGHT }}>
            <FlatList
                data={items}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
                initialScrollIndex={Math.max(
                    0,
                    items.indexOf(currentValue.toString()),
                )}
                renderItem={({ item }) => {
                    const isSelected = item === currentValue.toString();
                    return (
                        <View
                            style={{ height: ITEM_HEIGHT }}
                            className="justify-center items-center"
                        >
                            <Text
                                className={`text-lg ${isSelected ? "text-primary font-black" : "text-text-secondary font-medium"}`}
                            >
                                {item}
                            </Text>
                        </View>
                    );
                }}
            />
        </View>
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
                : new Date(new Date().getFullYear() - 13, 0, 1),
        [data?.birthDate],
    );

    const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
    const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());

    // 2. Sync with parent state silently
    useEffect(() => {
        const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
        if (data?.birthDate !== dateString) {
            if (!setData) return;

            setData((prev) => ({ ...prev, birthDate: dateString }));
        }

        console.log(dateString);
    }, [selectedDay, selectedMonth, selectedYear, setData, data?.birthDate]);

    const daysInMonth = useMemo(
        () => new Date(selectedYear, selectedMonth + 1, 0).getDate(),
        [selectedMonth, selectedYear],
    );
    const DAYS = useMemo(
        () => Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
        [daysInMonth],
    );

    useEffect(() => {
        if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
    }, [daysInMonth, selectedDay]);

    return (
        <View className="w-full flex-1 py-16 justify-between">
            <View className="flex-1 px-4 gap-4">
                <View className="mb-8">
                    <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
                        Birthday
                    </Text>
                    <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
                        Select your birthday
                    </Text>
                    <Text className="text-base text-text-secondary leading-relaxed">
                        We&apos;ll use this information to calculate your age
                        and other important information.
                    </Text>
                </View>
                <View className="border-background border rounded-3xl overflow-hidden flex-row items-center px-4">
                    <View
                        pointerEvents="none"
                        className="absolute left-0 right-0 h-12 border-y border-primary/10 bg-primary/5 self-center"
                        style={{ top: ITEM_HEIGHT }}
                    />
                    <ScrollPicker
                        items={MONTHS}
                        currentValue={MONTHS[selectedMonth]}
                        onValueChange={(val) =>
                            setSelectedMonth(MONTHS.indexOf(val))
                        }
                        flex={2}
                    />
                    <ScrollPicker
                        items={DAYS}
                        currentValue={selectedDay}
                        onValueChange={(val) => setSelectedDay(parseInt(val))}
                    />
                    <ScrollPicker
                        items={YEARS}
                        currentValue={selectedYear}
                        onValueChange={(val) => setSelectedYear(parseInt(val))}
                    />
                </View>
            </View>
            <View className="flex flex-row justify-evenly gap-4 px-4">
                <TouchableOpacity
                    onPress={onBack}
                    className="flex-1 p-4 rounded-2xl bg-surface border border-border items-center"
                >
                    <Text className="text-text-secondary font-bold text-lg">
                        Back
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onNext}
                    className="flex-[2] p-4 rounded-2xl bg-primary items-center "
                >
                    <Text className="text-background font-black text-lg">
                        Next
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
