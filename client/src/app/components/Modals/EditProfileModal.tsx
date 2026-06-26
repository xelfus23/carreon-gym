import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import { useUserProfile } from "@/src/context/profileProvider";
import { Profile, CurrentStats } from "@/src/types/users";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const GOAL_OPTIONS = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "build_muscle", label: "Build Muscle" },
  { value: "maintain", label: "Maintain" },
  { value: "improve_endurance", label: "Improve Endurance" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very Active" },
];

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  placeholder?: string;
  unit?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-text-secondary text-xs uppercase tracking-wider mb-2">
        {label}
      </Text>
      <View className="flex-row items-center bg-background border border-border rounded-xl px-4">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          className="flex-1 text-text-primary py-3 text-base font-inter"
        />
        {unit && (
          <Text className="text-text-secondary text-sm ml-2">{unit}</Text>
        )}
      </View>
    </View>
  );
}

function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-text-secondary text-xs uppercase tracking-wider mb-2">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={`px-3 py-2 rounded-xl border ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              }`}
            >
              <Text
                className={`text-sm ${
                  selected ? "text-primary font-semibold" : "text-text-secondary"
                }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function EditProfileModal({
  visible,
  onClose,
}: EditProfileModalProps) {
  const { profile, updateProfile, updateStats, refreshProfile } =
    useUserProfile();
  const [saving, setSaving] = useState(false);

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [muscleMassKg, setMuscleMassKg] = useState("");
  const [goal, setGoal] = useState("lose_weight");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [gender, setGender] = useState("male");

  useEffect(() => {
    if (!visible || !profile) return;

    setHeightCm(String(profile.profile?.heightCm ?? ""));
    setWeightKg(String(profile.currentStats?.weightKg ?? ""));
    setBodyFatPercent(
      profile.currentStats?.bodyFatPercent != null
        ? String(profile.currentStats.bodyFatPercent)
        : "",
    );
    setMuscleMassKg(
      profile.currentStats?.muscleMassKg != null
        ? String(profile.currentStats.muscleMassKg)
        : "",
    );
    setGoal(profile.profile?.goal ?? "lose_weight");
    setActivityLevel(profile.profile?.activityLevel ?? "moderate");
    setExperienceLevel(profile.profile?.experienceLevel ?? "beginner");
    setGender(profile.profile?.gender ?? "male");
  }, [visible, profile]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const profileUpdates: Partial<Profile> = {
        heightCm: Number(heightCm) || profile.profile?.heightCm,
        goal,
        activityLevel: activityLevel as Profile["activityLevel"],
        experienceLevel: experienceLevel as Profile["experienceLevel"],
        gender: gender as Profile["gender"],
      };

      const statsUpdates: Partial<CurrentStats> = {
        weightKg: Number(weightKg) || profile.currentStats?.weightKg,
      };

      if (bodyFatPercent.trim()) {
        statsUpdates.bodyFatPercent = Number(bodyFatPercent);
      }
      if (muscleMassKg.trim()) {
        statsUpdates.muscleMassKg = Number(muscleMassKg);
      }

      await updateProfile(profileUpdates);
      await updateStats(statsUpdates);
      await refreshProfile();
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
          <Text className="text-text-primary font-bold text-xl">
            Edit Profile
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-text-secondary text-sm mb-4">
            Update your fitness profile so the AI trainer can personalize
            workouts and nutrition advice.
          </Text>

          <Field
            label="Height"
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="numeric"
            placeholder={profile?.profile?.heightCm?.toString() || "0"}
            unit="cm"
          />
          <Field
            label="Weight"
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
            placeholder={profile?.currentStats?.weightKg?.toString() || "0"}
            unit="kg"
          />
          <Field
            label="Body Fat"
            value={bodyFatPercent}
            onChangeText={setBodyFatPercent}
            keyboardType="decimal-pad"
            placeholder={profile?.currentStats?.bodyFatPercent?.toString() || "0"}
            unit="%"
          />
          <Field
            label="Muscle Mass"
            value={muscleMassKg}
            onChangeText={setMuscleMassKg}
            keyboardType="decimal-pad"
            placeholder={profile?.currentStats?.muscleMassKg?.toString() || "0"}
            unit="kg"
          />

          <ChipSelect
            label="Gender"
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
            value={gender}
            onChange={setGender}
          />
          <ChipSelect
            label="Goal"
            options={GOAL_OPTIONS}
            value={goal}
            onChange={setGoal}
          />
          <ChipSelect
            label="Activity Level"
            options={ACTIVITY_OPTIONS}
            value={activityLevel}
            onChange={setActivityLevel}
          />
          <ChipSelect
            label="Experience"
            options={EXPERIENCE_OPTIONS}
            value={experienceLevel}
            onChange={setExperienceLevel}
          />
        </ScrollView>

        <View className="px-5 pb-6 pt-3 border-t border-border">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`py-4 rounded-2xl items-center ${
              saving ? "bg-primary/50" : "bg-primary"
            }`}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-background font-bold text-base">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
