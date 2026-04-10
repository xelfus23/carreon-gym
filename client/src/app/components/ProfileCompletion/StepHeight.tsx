import { useRef, useCallback } from "react";
import {
    Text,
    TouchableOpacity,
    View,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";

const ITEM_HEIGHT = 50;
const HEIGHT_DATA = Array.from({ length: 151 }, (_, i) => (250 - i).toString());

export default function StepHeight({
    data,
    setData,
    onNext,
    onBack,
}: ProfileCompletionScreenProps) {
    const flatListRef = useRef<FlatList>(null);
    const lastIndexRef = useRef<number>(-1);

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const yOffset = event.nativeEvent.contentOffset.y;
            const index = Math.round(yOffset / ITEM_HEIGHT);

            // Skip update if same index
            if (index === lastIndexRef.current) return;
            lastIndexRef.current = index;

            if (HEIGHT_DATA[index]) {
                const newValue = parseInt(HEIGHT_DATA[index]);
                if (!isNaN(newValue)) {
                    setData!((prev) => ({ ...prev, heightCm: newValue }));
                }
            }
        },
        [setData],
    );

    const renderItem = useCallback(
        ({ item }: { item: string }) => {
            const val = parseInt(item);
            const isSelected = data?.heightCm === val;
            const isMajor = val % 10 === 0;

            return (
                <View
                    style={{ height: ITEM_HEIGHT }}
                    className="flex-row items-center justify-start px-4"
                >
                    <View
                        className={`h-[2px] rounded-full ${
                            isMajor ? "w-12 bg-primary" : "w-6 bg-border"
                        } ${isSelected ? "bg-primary w-16" : ""}`}
                    />
                    <View className="ml-4">
                        <Text
                            className={`${
                                isSelected
                                    ? "text-primary font-black text-lg scale-110"
                                    : "text-text-secondary font-medium text-xs opacity-40"
                            }`}
                        >
                            {val}
                        </Text>
                    </View>
                </View>
            );
        },
        [data?.heightCm], // Only re-render items when selected value changes
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
                        <Text className="text-text-primary text-7xl font-black">
                            {data?.heightCm || "170"}
                        </Text>
                        <Text className="text-primary text-2xl ml-2 uppercase font-black">
                            cm
                        </Text>
                    </View>
                </View>

                {/* Right Side: The Ruler Picker */}
                <View className="w-1/3 h-full justify-center">
                    <View className="absolute left-[-20] self-center z-10 pointer-events-none">
                        <ChevronRight size={32} color={COLORS.primary} />
                    </View>

                    <View className="h-[500px] overflow-hidden">
                        <FlatList
                            ref={flatListRef}
                            data={HEIGHT_DATA}
                            keyExtractor={(item) => item}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                            onScroll={handleScroll}
                            scrollEventThrottle={8}
                            contentContainerStyle={{ paddingVertical: 225 }}
                            getItemLayout={(_, index) => ({
                                length: ITEM_HEIGHT,
                                offset: ITEM_HEIGHT * index,
                                index,
                            })}
                            initialScrollIndex={
                                data?.heightCm ? 250 - data.heightCm : 250 - 170
                            }
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
                    <Text className="text-text-secondary font-bold text-lg">
                        Back
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onNext}
                    className="flex-[2] p-4 rounded-2xl bg-primary items-center shadow-lg shadow-primary/30"
                >
                    <Text className="text-background font-black text-lg">
                        Next
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
