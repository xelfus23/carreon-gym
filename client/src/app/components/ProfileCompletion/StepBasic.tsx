import { COLORS } from "@/src/consts/colors";
import { CurrentStats, Profile } from "@/src/types/users";
import { Mars, Venus, VenusAndMars } from "lucide-react-native";
import React, {
    Dispatch,
    SetStateAction,
    useState,
    useMemo,
    useEffect,
    memo,
} from "react";
import {
    Text,
    TouchableOpacity,
    View,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";

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

// 1. Memoize the Picker Column to prevent cross-column flickering
const ScrollPicker = memo(function ScrollPicker({
    items,
    currentValue,
    onValueChange,
    flex = 1,
}: {
    items: string[];
    currentValue: string | number;
    onValueChange: (val: string) => void;
    flex?: number;
}) {
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

export default function StepBasics({
    data,
    setData,
    onNext,
}: {
    data: CurrentStats & Profile;
    setData: Dispatch<SetStateAction<CurrentStats & Profile>>;
    onNext: () => void;
}) {
    const GENDER_OPTIONS = [
        { IconComponent: Mars, value: "male" },
        { IconComponent: Venus, value: "female" },
        { IconComponent: VenusAndMars, value: "other" },
    ] as const;

    const initialDate = useMemo(
        () =>
            data.birthDate
                ? new Date(data.birthDate)
                : new Date(new Date().getFullYear() - 13, 0, 1),
        [data.birthDate],
    );

    const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
    const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());

    // 2. Sync with parent state silently
    useEffect(() => {
        const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
        if (data.birthDate !== dateString) {
            setData((prev) => ({ ...prev, birthDate: dateString }));
        }

        console.log(dateString);
    }, [selectedDay, selectedMonth, selectedYear, setData, data.birthDate]);

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
        <View className="w-full flex-1 justify-center py-16">
            <View className="px-4">
                <Text className="text-3xl font-bold text-text-primary mb-2">
                    Basic Info
                </Text>
                <Text className="text-text-secondary text-lg mb-10">
                    Select your gender and birthday
                </Text>
            </View>

            <View className="flex-1 px-4 gap-4">
                <Text className="text-text-secondary font-bold uppercase tracking-wider mb-4">
                    Gender
                </Text>
                <View className="flex-row gap-3 mb-12">
                    {GENDER_OPTIONS.map((g) => (
                        <TouchableOpacity
                            key={g.value}
                            onPress={() =>
                                setData((prev) => ({
                                    ...prev,
                                    gender: g.value,
                                }))
                            }
                            className={`flex-1 flex-row gap-2 p-4 rounded-2xl border-2 items-center ${data.gender === g.value ? "bg-primary/10 border-primary" : "bg-surface border-border"}`}
                        >
                            <g.IconComponent
                                color={
                                    data.gender === g.value
                                        ? COLORS.primary
                                        : COLORS.textPrimary
                                }
                            />
                            <Text
                                className={`capitalize ${data.gender === g.value ? "text-primary font-black" : "text-text-secondary font-medium"}`}
                            >
                                {g.value}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text className="text-text-secondary font-bold uppercase tracking-wider mb-4">
                    Birthday
                </Text>
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

            <View className="px-4 mt-auto">
                <TouchableOpacity
                    onPress={onNext}
                    disabled={!data.gender || !data.birthDate}
                    className={`p-4 rounded-2xl items-center ${!data.gender || !data.birthDate ? "bg-border" : "bg-primary"}`}
                >
                    <Text
                        className={`font-black text-lg ${!data.gender || !data.birthDate ? "text-text-secondary" : "text-background"}`}
                    >
                        Next
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
