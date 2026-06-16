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
import { SessionExerciseProps } from "@/src/types/workout";

type Props = {
  visible: boolean;
  sessionId: number | null;
  exercise: SessionExerciseProps | null;
  onClose: () => void;
};

const equipmentLabel = (eq: string | string[] | undefined) =>
  !eq ? "Bodyweight" : Array.isArray(eq) ? eq.join(", ") : String(eq);

const exerciseName = (ex: SessionExerciseProps) => ex.exercise_name ?? ex.exercise_name ?? "";

const isDurationBased = (ex: SessionExerciseProps) =>
  ex.duration_seconds != null && ex.rep_count == null;

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
  const defaultSets = String(exercise?.set_count ?? 1);
  const defaultReps = exercise?.rep_count != null ? String(exercise.rep_count) : "";
  const defaultDuration =
    exercise?.duration_seconds != null ? String(exercise.duration_seconds) : "";

  useEffect(() => {
    if (!visible || !exercise) return;
    setSetsInput(defaultSets);
    setRepsInput(defaultReps);
    setDurationInput(defaultDuration);
  }, [visible, exercise, defaultSets, defaultReps, defaultDuration]);

  if (!exercise) return null;

  console.log(exercise)

  const handleStartSession = () => {
    const parsedSets = Number.parseInt(setsInput, 10);
    const parsedReps = Number.parseInt(repsInput, 10);
    const parsedDuration = Number.parseInt(durationInput, 10);

    const finalSets =
      Number.isFinite(parsedSets) && parsedSets > 0 ? parsedSets : 1;
    const finalReps =
      !timedMode && Number.isFinite(parsedReps) && parsedReps > 0
        ? parsedReps
        : null;
    const finalDuration =
      timedMode && Number.isFinite(parsedDuration) && parsedDuration > 0
        ? parsedDuration
        : (exercise.duration_seconds ?? null);

    onClose();
    router.push({
      pathname: "/(app)/(home)/workout-session",
      params: {
        exerciseId: String(exercise.exercise_id),
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

  console.log("EXERCISE: ", exercise);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      className="flex-1"
    >
      <View className="flex-1 bg-black/60 justify-end">
        <TouchableOpacity
          className="h-[20%]"
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          className="bg-surface flex-1 rounded-t-3xl"
          style={{ transform: [{ translateY: slideAnim }] }}
        >
          <View className="w-10 h-1 bg-border rounded-full self-center mt-4 mb-2" />

          <View
            className="flex-1"
          >
            <View className="px-6 pt-2 pb-6">


              <View className="flex-row gap-2 mb-3">
                <View
                  className={`px-3 py-1 rounded-full ${timedMode ? "bg-blue-500/20" : "bg-primary/20"
                    }`}
                >
                  <Text
                    className={`text-xs font-semibold ${timedMode ? "text-blue-400" : "text-primary"
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
                    exercise.equipment_name ?? exercise.equipment_name,
                  )}
                </Text>
              </View>

              {/* Description */}
              {exercise.description && (
                <View className="bg-background rounded-2xl p-4 mb-4">
                  {/* <Text className="text-text-secondary text-xs uppercase tracking-widest mb-2">
                    Description
                  </Text> */}
                  <Text className="text-text-primary text-sm leading-6">
                    {exercise.description}
                  </Text>
                </View>
              )}


              {/* Stats row */}
              <View className="flex-row gap-3 mb-5">
                {exercise.set_count != null && (
                  <View className="flex-1 bg-background rounded-2xl p-4 items-center">
                    <Ionicons
                      name="repeat-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text className="text-text-primary font-bold text-xl mt-1">
                      {exercise.set_count}
                    </Text>
                    <Text className="text-text-secondary text-xs">Sets</Text>
                  </View>
                )}
                {!timedMode && exercise.rep_count != null && (
                  <View className="flex-1 bg-background rounded-2xl p-4 items-center">
                    <Ionicons
                      name="infinite"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text className="text-text-primary font-bold text-xl mt-1">
                      {exercise.rep_count}
                    </Text>
                    <Text className="text-text-secondary text-xs">Reps</Text>
                  </View>
                )}
                {timedMode && exercise.duration_seconds != null && (
                  <View className="flex-1 bg-background rounded-2xl p-4 items-center">
                    <Ionicons name="time-outline" size={20} color="#3B82F6" />
                    <Text className="text-text-primary font-bold text-xl mt-1">
                      {formatDuration(exercise.duration_seconds)}
                    </Text>
                    <Text className="text-text-secondary text-xs">
                      Duration
                    </Text>
                  </View>
                )}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                className="max-h-[50%] border border-border p-2 rounded-3xl"
              >

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
                {(exercise.instructions) && (
                  <View className="bg-background rounded-2xl p-4 mb-4">
                    <Text className="text-text-secondary text-xs uppercase tracking-widest mb-3">
                      Instructions
                    </Text>
                    {exercise.instructions.map((v, idx) => (
                      <View key={v + idx} className="flex-row items-center gap-2 mb-2">
                        <Text className="text-text-primary text-sm font-medium capitalize">
                          {idx + 1}. {v}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}


                {(exercise.muscle_group) && (
                  <View className="bg-background rounded-2xl p-4 mb-4">
                    <Text className="text-text-secondary text-xs uppercase tracking-widest mb-3">
                      Muscles
                    </Text>
                    {exercise.muscle_group.map((v, idx) => (
                      <View key={v + idx} className="flex-row items-center gap-2 mb-2">
                        <View className="w-2 h-2 rounded-full bg-primary" />
                        <Text className="text-text-primary text-sm font-medium capitalize">
                          {v}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {exercise.weight_guidance && (
                  <View className="bg-background rounded-2xl p-4 mb-5 ">
                    <Text className="text-text-secondary text-xs uppercase tracking-widest mb-2">
                      Guide:
                    </Text>
                    <Text className="text-text-primary text-sm leading-6">
                      {exercise.weight_guidance}
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
                      This is a timed exercise. The session will auto-complete
                      when the timer ends.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="px-6 pt-3 pb-10 bg-surface border-t border-border flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="border border-border rounded-2xl py-4 px-5 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStartSession}
              className="flex-1 bg-primary rounded-2xl items-center justify-center flex-row gap-2"
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
      </View >
    </Modal >
  );
}
