import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/consts/colors";
import KeyboardScreen from "../KeyboardScreen";

export type ExerciseDetail = {
  id: number;
  exercise_name?: string;
  name?: string;
  description?: string | null;
  muscle_group?: string | null;
  secondary_muscles?: string | string[] | null;
  equipment_name?: string | string[];
  equipment?: string;
  sets?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  notes?: string | null;
  exercise_type?: string | null;
};

type Props = {
  visible: boolean;
  sessionId: number | null; // was sessionId
  exercise: ExerciseDetail | null;
  onClose: () => void;
};

const equipmentLabel = (eq: string | string[] | undefined) =>
  !eq ? "Bodyweight" : Array.isArray(eq) ? eq.join(", ") : String(eq);

const exerciseName = (ex: ExerciseDetail) => ex.exercise_name ?? ex.name ?? "";

const isDurationBased = (ex: ExerciseDetail) =>
  ex.duration_seconds != null && ex.reps == null;

export default function ExerciseDetailModal({
  visible,
  sessionId,
  exercise,
  onClose,
}: Props) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [setsInput, setSetsInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [durationInput, setDurationInput] = useState("");

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [slideAnim, visible]);

  const timedMode = exercise ? isDurationBased(exercise) : false;
  const defaultSets = String(exercise?.sets ?? 1);
  const defaultReps = exercise?.reps != null ? String(exercise.reps) : "";
  const defaultDuration =
    exercise?.duration_seconds != null ? String(exercise.duration_seconds) : "";

  useEffect(() => {
    if (!visible || !exercise) return;
    setSetsInput(defaultSets);
    setRepsInput(defaultReps);
    setDurationInput(defaultDuration);
  }, [visible, exercise, defaultSets, defaultReps, defaultDuration]);

  if (!exercise) return null;

  const handleStartSession = () => {
    const parsedSets = Number.parseInt(setsInput, 10);
    const parsedReps = Number.parseInt(repsInput, 10);
    const parsedDuration = Number.parseInt(durationInput, 10);

    const finalSets = Number.isFinite(parsedSets) && parsedSets > 0 ? parsedSets : 1;
    const finalReps =
      !timedMode && Number.isFinite(parsedReps) && parsedReps > 0
        ? parsedReps
        : null;
    const finalDuration =
      timedMode && Number.isFinite(parsedDuration) && parsedDuration > 0
        ? parsedDuration
        : exercise.duration_seconds ?? null;

    onClose();
    router.push({
      pathname: "/(app)/(home)/workout-session",
      params: {
        exerciseId: String(exercise.id),
        exerciseName: exerciseName(exercise),
        sessionId: String(sessionId ?? 0),
        sets: String(finalSets),
        reps: finalReps != null ? String(finalReps) : "",
        durationSeconds: finalDuration != null ? String(finalDuration) : "",
      },
    });
  };

  const formatDuration = (secs: number) => {
    if (secs >= 60) {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return s > 0 ? `${m}m ${s}s` : `${m} min`;
    }
    return `${secs}s`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardScreen scrollable={true}>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
          />
          <Animated.View
            className="bg-surface rounded-t-3xl overflow-hidden"
            style={{ transform: [{ translateY: slideAnim }] }}
          >
            {/* Drag handle */}
            <View className="w-10 h-1 bg-border rounded-full self-center mt-4 mb-2" />

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              className="max-h-[80%]"
            >
              <View className="px-6 pt-2 pb-6">
                {/* Exercise type badge */}
                <View className="flex-row gap-2 mb-3">
                  <View
                    className={`px-3 py-1 rounded-full ${timedMode
                      ? "bg-blue-500/20"
                      : "bg-primary/20"
                      }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${timedMode
                        ? "text-blue-400"
                        : "text-primary"
                        }`}
                    >
                      {timedMode ? "⏱ Timed" : "🔁 Reps"}
                    </Text>
                  </View>
                  {exercise.exercise_type && (
                    <View className="bg-surface border border-border px-3 py-1 rounded-full">
                      <Text className="text-text-secondary text-xs capitalize">
                        {exercise.exercise_type}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Name */}
                <Text className="text-text-primary font-bold text-2xl mb-1">
                  {exerciseName(exercise)}
                </Text>

                {/* Equipment */}
                <View className="flex-row items-center gap-1.5 mb-5">
                  <Ionicons
                    name="barbell-outline"
                    size={14}
                    color={COLORS.textSecondary}
                  />
                  <Text className="text-text-secondary text-sm">
                    {equipmentLabel(
                      exercise.equipment_name ??
                      exercise.equipment,
                    )}
                  </Text>
                </View>

                {/* Stats row */}
                <View className="flex-row gap-3 mb-5">
                  {exercise.sets != null && (
                    <View className="flex-1 bg-background rounded-2xl p-4 items-center">
                      <Ionicons
                        name="repeat-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                      <Text className="text-text-primary font-bold text-xl mt-1">
                        {exercise.sets}
                      </Text>
                      <Text className="text-text-secondary text-xs">
                        Sets
                      </Text>
                    </View>
                  )}
                  {!timedMode && exercise.reps != null && (
                    <View className="flex-1 bg-background rounded-2xl p-4 items-center">
                      <Ionicons
                        name="infinite"
                        size={20}
                        color={COLORS.primary}
                      />
                      <Text className="text-text-primary font-bold text-xl mt-1">
                        {exercise.reps}
                      </Text>
                      <Text className="text-text-secondary text-xs">
                        Reps
                      </Text>
                    </View>
                  )}
                  {timedMode &&
                    exercise.duration_seconds != null && (
                      <View className="flex-1 bg-background rounded-2xl p-4 items-center">
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#3B82F6"
                        />
                        <Text className="text-text-primary font-bold text-xl mt-1">
                          {formatDuration(
                            exercise.duration_seconds,
                          )}
                        </Text>
                        <Text className="text-text-secondary text-xs">
                          Duration
                        </Text>
                      </View>
                    )}
                </View>

                {/* Editable targets before starting */}
                <View className="bg-background rounded-2xl p-4 mb-5">
                  <Text className="text-text-secondary text-xs uppercase tracking-widest mb-3">
                    Session Targets
                  </Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-text-secondary text-xs mb-2">
                        Sets
                      </Text>
                      <TextInput
                        className="bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
                        keyboardType="number-pad"
                        value={setsInput}
                        onChangeText={setSetsInput}
                        placeholder="1"
                        placeholderTextColor={COLORS.textSecondary}
                      />
                    </View>
                    {timedMode ? (
                      <View className="flex-1">
                        <Text className="text-text-secondary text-xs mb-2">
                          Duration (seconds)
                        </Text>
                        <TextInput
                          className="bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
                          keyboardType="number-pad"
                          value={durationInput}
                          onChangeText={setDurationInput}
                          placeholder={defaultDuration || "30"}
                          placeholderTextColor={COLORS.textSecondary}
                        />
                      </View>
                    ) : (
                      <View className="flex-1">
                        <Text className="text-text-secondary text-xs mb-2">
                          Reps
                        </Text>
                        <TextInput
                          className="bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
                          keyboardType="number-pad"
                          value={repsInput}
                          onChangeText={setRepsInput}
                          placeholder={defaultReps || "8"}
                          placeholderTextColor={COLORS.textSecondary}
                        />
                      </View>
                    )}
                  </View>
                </View>

                {/* Muscle Groups */}
                {(exercise.muscle_group ||
                  exercise.secondary_muscles) && (
                    <View className="bg-background rounded-2xl p-4 mb-4">
                      <Text className="text-text-secondary text-xs uppercase tracking-widest mb-3">
                        Muscles
                      </Text>
                      {exercise.muscle_group && (
                        <View className="flex-row items-center gap-2 mb-2">
                          <View className="w-2 h-2 rounded-full bg-primary" />
                          <Text className="text-text-secondary text-xs">
                            Primary:
                          </Text>
                          <Text className="text-text-primary text-sm font-medium capitalize">
                            {exercise.muscle_group}
                          </Text>
                        </View>
                      )}
                      {exercise.secondary_muscles && (
                        <View className="flex-row items-center gap-2">
                          <View className="w-2 h-2 rounded-full bg-border" />
                          <Text className="text-text-secondary text-xs">
                            Secondary:
                          </Text>
                          <Text className="text-text-primary text-sm font-medium capitalize">
                            {Array.isArray(
                              exercise.secondary_muscles,
                            )
                              ? exercise.secondary_muscles.join(
                                ", ",
                              )
                              : exercise.secondary_muscles}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                {/* Description */}
                {exercise.description && (
                  <View className="mb-4">
                    <Text className="text-text-secondary text-xs uppercase tracking-widest mb-2">
                      Instructions
                    </Text>
                    <Text className="text-text-primary text-sm leading-6">
                      {exercise.description}
                    </Text>
                  </View>
                )}

                {/* Notes */}
                {exercise.notes && (
                  <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 flex-row gap-2">
                    <Text className="text-base">💡</Text>
                    <Text className="text-yellow-600 text-sm flex-1 leading-5">
                      {exercise.notes}
                    </Text>
                  </View>
                )}

                {/* Timer mode info banner */}
                {timedMode && (
                  <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-5 flex-row items-center gap-2">
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color="#3B82F6"
                    />
                    <Text className="text-blue-400 text-sm flex-1">
                      This is a timed exercise. The session
                      will auto-complete when the timer ends.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="px-6 pb-10 pt-3 border-t border-border flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="border border-border rounded-2xl py-4 px-5 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStartSession}
                className="flex-1 bg-primary rounded-2xl py-4 items-center justify-center flex-row gap-2"
                activeOpacity={0.85}
                style={{
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Ionicons
                  name="play-circle"
                  size={22}
                  color={COLORS.background}
                />
                <Text className="text-background font-bold text-base">
                  Start Exercise
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardScreen>

    </Modal>
  );
}
