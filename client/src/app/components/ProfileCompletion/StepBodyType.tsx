import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import React, { useCallback } from "react";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";
import MaleFolder from "@/src/assets/ui/human/male";
import FemaleFolder from "@/src/assets/ui/human/female";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.6;
const ITEM_SPACING = 16;
// The full distance from the start of one item to the start of the next
const FULL_ITEM_SIZE = ITEM_WIDTH + ITEM_SPACING;

export default function StepBodyType({
  data,
  setData,
  onNext,
  onBack,
}: ProfileCompletionScreenProps) {
  const images = data?.gender === "male" ? MaleFolder : FemaleFolder;

  const bodyTypeConfigs = [
    { key: "lean", src: images.lean, fatRate: 0.1, muscleRate: 0.45 },
    { key: "average", src: images.average, fatRate: 0.18, muscleRate: 0.4 },
    {
      key: "overweight",
      src: images.overweight,
      fatRate: 0.28,
      muscleRate: 0.35,
    },
    { key: "obese", src: images.obese, fatRate: 0.38, muscleRate: 0.32 },
    {
      key: "muscular",
      src: images.muscular,
      fatRate: 0.12,
      muscleRate: 0.52,
    },
  ];

  const bodyTypes = bodyTypeConfigs.map((type) => ({
    ...type,
    bodyFatPercent: Math.round(type.fatRate * 100),
    muscleMassKg: Math.round((Number(data?.weightKg) || 70) * type.muscleRate),
  }));

  // Function to calculate and set the middle item
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      // Divide current scroll position by the width of one item unit
      const index = Math.round(offsetX / FULL_ITEM_SIZE);

      const selectedItem = bodyTypes[index];

      if (
        selectedItem &&
        data?.bodyFatPercent !== selectedItem.bodyFatPercent
      ) {
        setData!({
          ...data!,
          bodyFatPercent: selectedItem.bodyFatPercent,
          muscleMassKg: selectedItem.muscleMassKg,
        });
      }
    },
    [data, bodyTypes, setData],
  );

  return (
    <View className="w-full flex-1 py-16">
      <View className="mb-8 px-4">
        <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
          Body Profile
        </Text>
        <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
          Select Your Body Type
        </Text>
        <Text className="text-base text-text-secondary leading-relaxed">
          Choose the option that looks closest to you.
        </Text>
      </View>

      {/* Horizontal Picker */}
      <View className="h-1/2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={FULL_ITEM_SIZE}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll} // Triggers when scroll stops
          contentContainerStyle={{
            paddingHorizontal: (width - ITEM_WIDTH) / 2,
          }}
          className="flex-row"
        >
          {bodyTypes.map((item) => {
            const isSelected = data?.bodyFatPercent === item.bodyFatPercent;

            return (
              <View
                key={item.key}
                style={{
                  width: ITEM_WIDTH,
                  marginRight: ITEM_SPACING,
                }}
                className={`h-full rounded-3xl border overflow-hidden bg-surface justify-center items-center transition-all ${
                  isSelected
                    ? "border-primary"
                    : "border-transparent opacity-80"
                }`}
              >
                <Image
                  source={item.src}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Stats Preview */}
      {data?.bodyFatPercent !== undefined && (
        <View className="px-8 mt-8 h-10 flex flex-col">
          <Text className="text-text-secondary text-sm italic">
            Estimated Body Fat:{" "}
            <Text className="text-text-primary font-bold">
              {data.bodyFatPercent}%
            </Text>
          </Text>
          <Text className="text-text-secondary text-sm italic">
            Estimated Muscle Mass:{" "}
            <Text className="text-text-primary font-bold">
              {data.muscleMassKg}kg
            </Text>
          </Text>
        </View>
      )}

      {/* Buttons */}
      <View className="flex flex-row gap-4 mt-auto px-4">
        <TouchableOpacity
          onPress={onBack}
          className="flex-1 p-4 rounded-2xl bg-surface border border-border items-center"
        >
          <Text className="text-text-secondary font-bold text-lg">Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          className={`flex-[2] p-4 rounded-2xl items-center ${data?.bodyFatPercent ? "bg-primary" : "bg-gray-400"}`}
          disabled={!data?.bodyFatPercent}
        >
          <Text className="text-background font-black text-lg">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
