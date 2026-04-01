import { COLORS } from "@/src/consts/colors";
import { CurrentStats, Profile } from "@/src/types/users";
import { Mars, Venus, VenusAndMars } from "lucide-react-native";

import React, { Dispatch, SetStateAction } from "react";

import { Text, TouchableOpacity, View } from "react-native";

export default function StepGender({
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
    const GENDER_OPTIONS = [
        { IconComponent: Mars, value: "male" },
        { IconComponent: Venus, value: "female" },
        { IconComponent: VenusAndMars, value: "other" },
    ] as const;

    return (
        <View className="w-full flex-1 justify-between py-16">
            <View className="flex-1 px-4 gap-4">
                <View className="mb-8">
                    <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
                        Gender
                    </Text>
                    <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
                        Select your gender
                    </Text>
                    <Text className="text-base text-text-secondary leading-relaxed">
                        We&apos;ll use this information to help you achieve your
                        goals.
                    </Text>
                </View>
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
