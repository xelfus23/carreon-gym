import { View, Text, TouchableOpacity } from "react-native";
import { Check, Shield, Zap, Award } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import { ProfileCompletionScreenProps } from "../../(app)/(home)/profile-completion";

const EXPERIENCE_LEVELS = [
  {
    value: "beginner",
    label: "Beginner",
    subtitle: "New to training or returning after a long break",
    icon: Shield,
  },
  {
    value: "intermediate",
    label: "Intermediate",
    subtitle: "Consistently lifting/training for 6–24 months",
    icon: Zap,
  },
  {
    value: "advanced",
    label: "Advanced",
    subtitle: "Years of dedicated structured training",
    icon: Award,
  },
] as const;

function ExperienceCard({
  experience,
  isSelected,
  onPress,
}: {
  experience: (typeof EXPERIENCE_LEVELS)[number];
  isSelected: boolean;
  onPress: () => void;
}) {
  const Icon = experience.icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`flex-row items-center gap-4 p-5 rounded-2xl border ${isSelected
        ? "bg-primary/10 border-primary"
        : "bg-surface border-border"
        }`}
    >
      {/* Icon bubble */}
      <View
        className={`w-11 h-11 rounded-xl items-center justify-center ${isSelected ? "bg-primary/20" : "bg-background"
          }`}
      >
        <Icon
          size={22}
          color={isSelected ? COLORS.primary : COLORS.textSecondary}
          strokeWidth={2}
        />
      </View>

      {/* Labels */}
      <View className="flex-1">
        <Text
          className={`text-base font-bold mb-0.5 ${isSelected ? "text-primary" : "text-text-primary"
            }`}
        >
          {experience.label}
        </Text>
        <Text
          className={`text-sm ${isSelected ? "text-primary/70" : "text-text-secondary"
            }`}
        >
          {experience.subtitle}
        </Text>
      </View>

      {/* Check badge */}
      {isSelected && (
        <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
          <Check
            size={14}
            color={COLORS.background}
            strokeWidth={3}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function StepExperienceLevel({
  data,
  setData,
  onNext,
  onBack,
}: ProfileCompletionScreenProps) {
  return (
    <View className="w-full flex-1 py-16">
      {/* Header */}
      <View className="mb-8 px-4">
        <Text className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
          Experience Level
        </Text>
        <Text className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
          What&apos;s your fitness level?
        </Text>
        <Text className="text-base text-text-secondary leading-relaxed">
          This helps Carreon AI tailor your workout progressions accurately.
        </Text>
      </View>

      {/* Cards */}
      <View className="flex-1 gap-3 px-4">
        {EXPERIENCE_LEVELS.map((experience) => (
          <ExperienceCard
            key={experience.value}
            experience={experience}
            isSelected={data?.experienceLevel === experience.value}
            onPress={() =>
              setData!({
                ...data!,
                experienceLevel: experience.value,
              })
            }
          />
        ))}
      </View>

      {/* Navigation Actions */}
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