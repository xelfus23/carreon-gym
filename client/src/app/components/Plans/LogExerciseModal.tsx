import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/consts/colors";
import type { LogModalState } from "@/src/hooks/useWorkout";
import DifficultySelector from "./DifficultySelector";
import { KeyboardScreen } from "../KeyboardScreen";

type Props = {
  modal: LogModalState;
  formSets: string;
  formReps: string;
  formDuration: string;
  formWeight: string;
  formDifficulty: string;
  isSaving: boolean;
  onSetFormSets: (v: string) => void;
  onSetFormReps: (v: string) => void;
  onSetFormDuration: (v: string) => void;
  onSetFormWeight: (v: string) => void;
  onSetFormDifficulty: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
};

export default function LogExerciseModal({
  modal,
  formSets,
  formReps,
  formDuration,
  formWeight,
  formDifficulty,
  isSaving,
  onSetFormSets,
  onSetFormReps,
  onSetFormDuration,
  onSetFormWeight,
  onSetFormDifficulty,
  onClose,
  onSave,
  actionLabel = "Mark Done",
  actionIcon = "checkmark-circle-outline",
  onAction,
}: Props) {
  // Determine if this is a duration-based exercise (has duration_seconds but no reps)
  const isDurationBased =
    modal.defaultDuration !== null && modal.defaultReps === null;
  return (
    <Modal
      visible={modal.visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardScreen>
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={onClose}
        />
        <View className="bg-surface rounded-t-3xl px-6 pt-4 pb-10">
          <View className="w-10 h-1 bg-border rounded-full self-center mb-4" />

          <Text className="text-text-primary font-bold text-xl mb-1">
            Log Exercise
          </Text>
          <Text
            className="text-text-secondary text-sm mb-6"
            numberOfLines={1}
          >
            {modal.exerciseName}
          </Text>

          <View className="flex-row gap-4 mb-5">
            <View className="flex-1">
              <Text className="text-text-secondary text-xs mb-2">
                Sets completed
              </Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-base"
                placeholder={
                  modal.defaultSets
                    ? String(modal.defaultSets)
                    : "0"
                }
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
                value={formSets}
                onChangeText={onSetFormSets}
              />
            </View>
            <View className="flex-1">
              {isDurationBased ? (
                <>
                  <Text className="text-text-secondary text-xs mb-2">
                    Duration (seconds)
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-base"
                    placeholder={
                      modal.defaultDuration
                        ? String(modal.defaultDuration)
                        : "0"
                    }
                    placeholderTextColor={
                      COLORS.textSecondary
                    }
                    keyboardType="number-pad"
                    value={formDuration}
                    onChangeText={onSetFormDuration}
                  />
                </>
              ) : (
                <>
                  <Text className="text-text-secondary text-xs mb-2">
                    Reps completed
                  </Text>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-base"
                    placeholder={
                      modal.defaultReps
                        ? String(modal.defaultReps)
                        : "0"
                    }
                    placeholderTextColor={
                      COLORS.textSecondary
                    }
                    keyboardType="number-pad"
                    value={formReps}
                    onChangeText={onSetFormReps}
                  />
                </>
              )}
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-text-secondary text-xs mb-2">
              Weight used (kg) — optional
            </Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-base"
              placeholder="e.g. 20.5"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="decimal-pad"
              value={formWeight}
              onChangeText={onSetFormWeight}
            />
          </View>

          <View className="mb-6">
            <DifficultySelector
              value={formDifficulty}
              onChange={onSetFormDifficulty}
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 border border-border rounded-2xl py-4 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-text-secondary font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onAction ?? onSave}
              disabled={isSaving}
              className="flex-2 bg-primary rounded-2xl py-4 px-8 items-center justify-center flex-row gap-2"
              activeOpacity={0.8}
              style={{ flex: 2 }}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={actionIcon}
                    size={18}
                    color={COLORS.background}
                  />
                  <Text className="text-background font-bold text-base">
                    {actionLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardScreen>
    </Modal>
  );
}
