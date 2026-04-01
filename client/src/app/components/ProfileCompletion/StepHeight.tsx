import { CurrentStats, Profile } from "@/src/types/users";
import { Dispatch, SetStateAction, useRef } from "react";
import {
    Text,
    TouchableOpacity,
    View,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";

const ITEM_HEIGHT = 40;
const HEIGHT_DATA = Array.from({ length: 1501 }, (_, i) =>
    (100 + i * 0.1).toFixed(1),
);

export default function StepHeight({
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
        const yOffset = event.nativeEvent.contentOffset.y;
        const index = Math.round(yOffset / ITEM_HEIGHT);
        const newValue = parseFloat(HEIGHT_DATA[index]);

        if (!isNaN(newValue) && newValue !== data.heightCm) {
            setData((prev) => ({ ...prev, heightCm: newValue }));
        }
    };

    const renderItem = ({ item, index }: { item: string; index: number }) => {
        const val = parseFloat(item);
        const isMajor = val % 1 === 0; // Whole numbers (170.0)
        const isHalf = val % 0.5 === 0; // Half numbers (170.5)
        const isSelected = data.heightCm === val;

        return (
            <View
                style={{ height: ITEM_HEIGHT }}
                className="flex-row items-center justify-center px-6"
            >
                {/* Left Ticks */}
                <View className="flex-1 items-end pr-4">
                    <View
                        className={`h-[2px] rounded-full ${
                            isMajor
                                ? "w-10 bg-primary"
                                : isHalf
                                  ? "w-6 bg-text-secondary"
                                  : "w-3 bg-border"
                        }`}
                    />
                </View>

                {/* Number (Only show for whole numbers to avoid clutter) */}
                <View className="w-20 items-center">
                    {isMajor && (
                        <Text
                            className={`text-xl ${isSelected ? "text-primary font-black" : "text-text-secondary font-medium"}`}
                        >
                            {Math.floor(val)}
                        </Text>
                    )}
                </View>

                <View className="flex-1 items-start pl-4">
                    <View
                        className={`h-[2px] rounded-full ${
                            isMajor
                                ? "w-10 bg-primary"
                                : isHalf
                                  ? "w-6 bg-text-secondary"
                                  : "w-3 bg-border"
                        }`}
                    />
                </View>
            </View>
        );
    };

    return (
        <View className="bg-background w-full flex-1 justify-center py-16">
            <Text className="text-3xl font-bold text-text-primary mb-2 px-4">
                Height
            </Text>
            <Text className="text-text-secondary text-lg mb-10 px-4">
                Precise is better
            </Text>

            <View className="flex-1 justify-center">
                <View className="w-full items-center">
                    <View className="justify-center w-1/2">
                        <View className="absolute self-center w-full flex-row items-center justify-between px-2 z-10 pointer-events-none">
                            <ChevronRight size={32} color={COLORS.primary} />
                            <View className="absolute left-0 right-0 h-12 -z-10" />
                            <ChevronLeft size={32} color={COLORS.primary} />
                        </View>

                        <View className="h-[400px] overflow-hidden">
                            <FlatList
                                ref={flatListRef}
                                data={HEIGHT_DATA}
                                keyExtractor={(item) => item}
                                renderItem={renderItem}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={ITEM_HEIGHT}
                                decelerationRate="normal"
                                onMomentumScrollEnd={handleScroll}
                                onScrollBeginDrag={handleScroll}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                contentContainerStyle={{ paddingVertical: 180 }}
                                getItemLayout={(_, index) => ({
                                    length: ITEM_HEIGHT,
                                    offset: ITEM_HEIGHT * index,
                                    index,
                                })}
                                initialScrollIndex={
                                    data.heightCm
                                        ? Math.round(
                                              (data.heightCm - 100) / 0.1,
                                          )
                                        : 700
                                }
                            />
                        </View>
                    </View>
                </View>

                {/* Value Preview with Decimal focus */}
                <View className="items-center">
                    <View className="flex-row items-baseline">
                        <Text className="text-text-primary text-6xl font-black">
                            {Math.floor(data.heightCm)}
                        </Text>
                        <Text className="text-primary text-4xl font-bold">
                            .{(data.heightCm % 1).toFixed(1).split(".")[1]}
                        </Text>
                        <Text className="text-text-secondary text-xl ml-2 uppercase">
                            cm
                        </Text>
                    </View>
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
