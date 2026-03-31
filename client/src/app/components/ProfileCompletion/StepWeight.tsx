import { CurrentStats, Profile } from "@/src/types/users";
import { Dispatch, SetStateAction, useRef } from "react";
import {
    Text,
    TouchableOpacity,
    View,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Dimensions,
} from "react-native";
import { ChevronUp } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_WIDTH = 15; // Narrower for horizontal so more ticks fit
const WEIGHT_DATA = Array.from({ length: 2201 }, (_, i) =>
    (30 + i * 0.1).toFixed(1),
);

export default function StepWeight({
    data,
    setData,
    onNext,
    onBack,
}: {
    data: CurrentStats & Profile;
    setData: Dispatch<SetStateAction<CurrentStats & Profile>>;
    onNext: () => void;
    onBack: () => void;
}) {
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const xOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(xOffset / ITEM_WIDTH);
        const newValue = parseFloat(WEIGHT_DATA[index]);

        if (!isNaN(newValue) && newValue !== data.weightKg) {
            setData((prev) => ({ ...prev, weightKg: newValue }));
        }
    };

    const renderItem = ({ item }: { item: string }) => {
        const val = parseFloat(item);
        const isMajor = val % 1 === 0;
        const isHalf = val % 0.5 === 0;
        const isSelected = data.weightKg === val;

        return (
            <View
                style={{ width: ITEM_WIDTH }}
                className="items-center justify-end pb-4"
            >
                {/* Number (Only show for whole numbers) */}
                <View className="h-8 justify-center">
                    {isMajor && (
                        <Text
                            className={`text-xs ${
                                isSelected
                                    ? "text-primary font-bold"
                                    : "text-text-secondary"
                            }`}
                        >
                            {Math.floor(val)}
                        </Text>
                    )}
                </View>

                {/* Vertical Ruler Ticks */}
                <View
                    className={`w-[2px] rounded-full ${
                        isMajor
                            ? "h-10 bg-primary"
                            : isHalf
                              ? "h-6 bg-text-secondary"
                              : "h-3 bg-border"
                    }`}
                />
            </View>
        );
    };

    return (
        <View className="bg-background w-full flex-1 justify-center py-16">
            <Text className="text-3xl font-bold text-text-primary mb-2 px-4">
                Weight
            </Text>
            <Text className="text-text-secondary text-lg mb-10 px-4">
                Be honest, we&apos;re here to help
            </Text>

            <View className="flex-1 justify-center">
                {/* Value Preview - Large and Centered */}
                <View className="items-center mb-10">
                    <View className="flex-row items-baseline">
                        <Text className="text-text-primary text-7xl font-black">
                            {Math.floor(data.weightKg || 70)}
                        </Text>
                        <Text className="text-primary text-5xl font-bold">
                            .
                            {
                                ((data.weightKg || 70) % 1)
                                    .toFixed(1)
                                    .split(".")[1]
                            }
                        </Text>
                        <Text className="text-text-secondary text-2xl ml-2 uppercase">
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

                    <FlatList
                        ref={flatListRef}
                        horizontal
                        data={WEIGHT_DATA}
                        keyExtractor={(item) => item}
                        renderItem={renderItem}
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={ITEM_WIDTH}
                        decelerationRate="fast"
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        // Padding left/right so the numbers can reach the exact center
                        contentContainerStyle={{
                            paddingHorizontal:
                                SCREEN_WIDTH / 2 - ITEM_WIDTH / 2,
                        }}
                        getItemLayout={(_, index) => ({
                            length: ITEM_WIDTH,
                            offset: ITEM_WIDTH * index,
                            index,
                        })}
                        initialScrollIndex={
                            data.weightKg
                                ? Math.round((data.weightKg - 30) / 0.1)
                                : 400 // Default to 70kg
                        }
                    />
                </View>
            </View>

            {/* Navigation */}
            <View className="flex flex-row justify-evenly gap-4 px-4 mt-10">
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
                    className="flex-[2] p-4 rounded-2xl bg-primary items-center"
                >
                    <Text className="text-background font-black text-lg">
                        Next
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
