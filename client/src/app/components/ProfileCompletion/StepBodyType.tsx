import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";
import MaleFolder from "@/src/assets/ui/human/male";
import FemaleFolder from "@/src/assets/ui/human/female";

export default function StepBodyType({
    data,
    setData,
    onNext,
    onBack,
}: ProfileCompletionScreenProps) {
    const images = data?.gender === "male" ? MaleFolder : FemaleFolder;

    const bodyTypes = [
        { key: "lean", src: images.lean },
        { key: "average", src: images.average },
        { key: "overweight", src: images.overweight },
        { key: "obese", src: images.obese },
        { key: "muscular", src: images.muscular },
    ];

    return (
        <View className="w-full flex-1 py-16 px-4">
            {/* Header */}
            <View className="mb-8">
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

            {/* Image Grid */}
            <View className="flex flex-row flex-wrap justify-between">
                {bodyTypes.map((item) => {
                    const selected = data?.bodyType === item.key;

                    return (
                        <TouchableOpacity
                            key={item.key}
                            onPress={() =>
                                setData({ ...data, bodyType: item.key })
                            }
                            className={`w-[48%] mb-4 rounded-2xl border-2 overflow-hidden ${
                                selected ? "border-primary" : "border-border"
                            }`}
                        >
                            <Image
                                source={item.src}
                                className="w-full h-40"
                                resizeMode="contain"
                            />

                            <Text className="text-center py-2 text-sm text-text-secondary">
                                {item.key.charAt(0).toUpperCase() +
                                    item.key.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Buttons */}
            <View className="flex flex-row gap-4 mt-auto">
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
                        {data?.bodyType ? "Next" : "Skip"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
