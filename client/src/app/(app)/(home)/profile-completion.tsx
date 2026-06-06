import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
    Dispatch,
    SetStateAction,
} from "react";
import { View, Alert, Animated } from "react-native";
import { COLORS } from "@/src/consts/colors";

import { useUserProfile } from "@/src/context/profileProvider";
import { CurrentStats, Profile } from "@/src/types/users";

import StepWeight from "../../components/ProfileCompletion/StepWeight";
import StepHeight from "@/src/app/components/ProfileCompletion/StepHeight";
import StepActivityLevel from "../../components/ProfileCompletion/StepActivityLevel";
import StepGender from "../../components/ProfileCompletion/StepGender";
import StepStart from "../../components/ProfileCompletion/StepStart";
import StepBirthdate from "../../components/ProfileCompletion/StepBirthdate";
import StepGoals from "../../components/ProfileCompletion/StepGoals";
import StepBodyType from "../../components/ProfileCompletion/StepBodyType";

import { router } from "expo-router";

export interface ProfileCompletionScreenProps {
    data?: CurrentStats & Profile;
    setData?: Dispatch<SetStateAction<CurrentStats & Profile>>;
    onNext?: () => void;
    onBack?: () => void;
    finalSubmission?: () => void;
}

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
        bodyFatPercent: 10,
        muscleMassKg: 11,
    });

    const animatedWidth = useRef(new Animated.Value(0)).current;

    const TOTAL_SCREENS = 8;

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
            router.push('/(app)/(home)/(tabs)/dashboard')
        } catch (error) {
            Alert.alert("Error", "Failed to save profile.");
            console.error(error);
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
            <StepBodyType
                key={8}
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
            <StepGoals
                key={7}
                data={formData}
                setData={setFormData}
                finalSubmission={handleFinalSubmit}
                onBack={prevStep}
            />,
        ],
        [formData, nextStep, prevStep, handleFinalSubmit],
    );

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: (step / TOTAL_SCREENS) * 100,
            duration: 450,
            useNativeDriver: false,
        }).start();
    }, [step, TOTAL_SCREENS, animatedWidth]);

    return (
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
    );
}
