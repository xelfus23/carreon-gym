import React, { useState } from "react";
import { View, Alert } from "react-native";

// Import your sub-step components (defined below)
import { useUserProfile } from "@/src/context/profileProvider";
import { CurrentStats, Profile } from "@/src/types/users";
import CustomKeyboardAvoidingView from "@/src/app/components/CustomKeyboardAvoidingView";
import StepBasics from "@/src/app/components/ProfileCompletion/StepBasic";
import StepWeight from "../../components/ProfileCompletion/StepWeight";
import StepHeight from "@/src/app/components/ProfileCompletion/StepHeight";

export default function ProfileCompletion() {
    const [step, setStep] = useState(1);
    const { updateProfile, updateStats, refreshProfile } = useUserProfile();

    // Combined local state for the whole form
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

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleFinalSubmit = async () => {
        try {
            // 1. Update Profile Table
            await updateProfile({
                heightCm: Number(formData.heightCm),
                gender: formData.gender as any,
                birthDate: formData.birthDate,
                goal: formData.goal,
                activityLevel: formData.activityLevel as any,
            });

            // 2. Update Stats (You need to add this to your Provider)
            // Assuming you added updateStats to authService as discussed previously
            await updateStats({
                weightKg: Number(formData.weightKg),
                bodyFatPercent: Number(formData.bodyFatPercent),
                muscleMassKg: Number(formData.muscleMassKg),
            });

            // 3. Trigger a refresh to update the global 'profile' state
            // This will satisfy the checkUserProfile effect and redirect home
            await refreshProfile();
        } catch (error) {
            console.error(error);
            Alert.alert(
                "Error",
                "Failed to save profile. Please check your inputs.",
            );
        }
    };

    return (
        <CustomKeyboardAvoidingView>
            <View className="bg-background flex-1 justify-center items-center">
                {step === 1 && (
                    <StepBasics
                        data={formData}
                        setData={setFormData}
                        onNext={nextStep}
                    />
                )}
                {step === 2 && (
                    <StepHeight
                        data={formData}
                        setData={setFormData}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                )}
                {step === 3 && (
                    <StepWeight
                        data={formData}
                        setData={setFormData}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                )}
            </View>
        </CustomKeyboardAvoidingView>
    );
}
