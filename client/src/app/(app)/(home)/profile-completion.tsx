import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react";
import { View, Alert, Animated } from "react-native";

import { useUserProfile } from "@/src/context/profileProvider";
import { CurrentStats, Profile } from "@/src/types/users";

import CustomKeyboardAvoidingView from "@/src/app/components/CustomKeyboardAvoidingView";
import StepWeight from "../../components/ProfileCompletion/StepWeight";
import StepHeight from "@/src/app/components/ProfileCompletion/StepHeight";
import StepActivityLevel from "../../components/ProfileCompletion/StepActivityLevel";
import StepGender from "../../components/ProfileCompletion/StepGender";
import StepStart from "../../components/ProfileCompletion/StepStart";
import { COLORS } from "@/src/consts/colors";
import StepBirthdate from "../../components/ProfileCompletion/StepBirthdate";

export default function ProfileCompletion() {
    const [step, setStep] = useState(1);
    const { updateProfile, updateStats, refreshProfile } = useUserProfile();

    const [formData, setFormData] = useState<CurrentStats & Profile>({
        gender: "male",
        birthDate: "",
        heightCm: 160,
        weightKg: 24,
        goal: "lose_weight",
        activityLevel: "moderate",
        bodyFatPercent: 0,
        muscleMassKg: 0,
    });

    const animatedWidth = useRef(new Animated.Value(0)).current;

    // FIX 1: Define total number of screens as a constant
    // This breaks the circular dependency error
    const TOTAL_SCREENS = 5;

    // FIX 2: Use useCallback for functions, not useMemo
    const nextStep = useCallback(() => {
        setStep((prev) => (prev < TOTAL_SCREENS ? prev + 1 : prev));
    }, [TOTAL_SCREENS]);

    const prevStep = useCallback(() => {
        setStep((prev) => (prev > 1 ? prev - 1 : 1));
    }, []);

    const handleFinalSubmit = useCallback(async () => {
        try {
            await updateProfile({
                heightCm: Number(formData.heightCm),
                gender: formData.gender as any,
                birthDate: formData.birthDate,
                goal: formData.goal,
                activityLevel: formData.activityLevel as any,
            });

            await updateStats({
                weightKg: Number(formData.weightKg),
                bodyFatPercent: Number(formData.bodyFatPercent),
                muscleMassKg: Number(formData.muscleMassKg),
            });

            await refreshProfile();
        } catch (error) {
            Alert.alert("Error", "Failed to save profile.");
        }
    }, [formData, refreshProfile, updateProfile, updateStats]);

    const screens = useMemo(
        () => [
            <StepStart key={1} onNext={nextStep} />,
            <StepGender
                key={2}
                data={formData}
                setData={setFormData}
                onNext={nextStep}
                onBack={prevStep}
            />,
            <StepBirthdate
                key={3}
                data={formData}
                setData={setFormData}
                onNext={nextStep}
                onBack={prevStep}
            />,
            <StepHeight
                key={4}
                data={formData}
                setData={setFormData}
                onNext={nextStep}
                onBack={prevStep}
            />,
            <StepWeight
                key={5}
                data={formData}
                setData={setFormData}
                onNext={nextStep}
                onBack={prevStep}
            />,
            <StepActivityLevel
                key={6}
                data={formData}
                setData={setFormData}
                onNext={nextStep}
                onBack={prevStep}
            />,
        ],
        [formData, nextStep, prevStep],
    );

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: (step / TOTAL_SCREENS) * 100,
            duration: 450,
            useNativeDriver: false,
        }).start();
    }, [step, TOTAL_SCREENS, animatedWidth]);

    return (
        <CustomKeyboardAvoidingView>
            <View className="bg-background flex-1">
                <View className="w-full h-2 mt-24 px-6">
                    <View className="w-full bg-surface h-full rounded-full overflow-hidden">
                        <Animated.View
                            style={{
                                width: animatedWidth.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ["0%", "100%"],
                                }),
                                height: "100%",
                                backgroundColor: COLORS.primary,
                            }}
                            className="rounded-full"
                        />
                    </View>
                </View>

                <View className="flex-1 justify-center items-center">
                    {screens[step - 1]}
                </View>
            </View>
        </CustomKeyboardAvoidingView>
    );
}
