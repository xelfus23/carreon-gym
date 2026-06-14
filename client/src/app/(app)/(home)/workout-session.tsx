import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Vibration,
  StatusBar,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "@/src/consts/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkout } from "@/src/hooks/useWorkout";
import { useAudioPlayer } from "expo-audio";

type SessionMode = "reps" | "timer";

export default function WorkoutSession() {
  const router = useRouter();
  const { saveLog } = useWorkout();

  const params = useLocalSearchParams<{
    exerciseId: string;
    exerciseName: string;
    sets: string;
    reps: string;
    durationSeconds: string;
    dayId: string;
  }>();

  const exerciseId = Number(params.exerciseId);
  const exerciseName = params.exerciseName ?? "Exercise";
  const totalSets = Number(params.sets) || 1;
  const repsPerSet = params.reps ? Number(params.reps) : null;
  const durationSeconds = params.durationSeconds
    ? Number(params.durationSeconds)
    : null;

  const mode: SessionMode =
    durationSeconds !== null && repsPerSet === null ? "timer" : "reps";

  // Shared structural tracking counters
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(60);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(durationSeconds ?? 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Post-exercise summary configuration state
  const [showSummary, setShowSummary] = useState(false);
  const [difficulty, setDifficulty] = useState<number | null>(null); // 1 = Too Easy, 2 = Perfect, 3 = Too Hard
  const [notes, setNotes] = useState("");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tickSound1 = useAudioPlayer(require("@/src/assets/sounds/tick1.mp3"));
  const tickSound2 = useAudioPlayer(require("@/src/assets/sounds/tick2.mp3"));
  const tickSoundFinal = useAudioPlayer(
    require("@/src/assets/sounds/tick3.mp3"),
  );

  const useFirstTickTrack = useRef(true);

  // const playTick = useCallback((currentTime: number) => {
  //   const basePlayer = useFirstTickTrack.current ? tickSound1 : tickSound2;
  //   if (basePlayer) {
  //     basePlayer.seekTo(0);
  //     basePlayer.play();
  //   }
  //   useFirstTickTrack.current = !useFirstTickTrack.current;

  //   if (currentTime <= 5 && currentTime > 0) {
  //     if (tickSoundFinal) {
  //       tickSoundFinal.seekTo(0);
  //       tickSoundFinal.play();
  //     }
  //   }
  // }, [tickSound1, tickSound2, tickSoundFinal]);

  // Pulse animation effect loop
  useEffect(() => {
    if (isRunning && mode === "timer") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRunning, mode, pulseAnim]);

  // Handle Multi-Set progression completion logic
  const handleCompleteSet = useCallback(() => {
    Vibration.vibrate(50);
    const newCompleted = completedSets + 1;
    setCompletedSets(newCompleted);

    if (newCompleted >= totalSets) {
      setIsRunning(false);
      // Open our post-workout feedback layout instead of auto-submitting
      Animated.spring(celebrationAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      setShowSummary(true);
    } else {
      setCurrentSet(newCompleted + 1);
      setIsResting(true);
    }
  }, [completedSets, totalSets, celebrationAnim]);

  useEffect(() => {
    if (mode === "timer" && isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        // Pass the current state value to play the audio tick safely
        // playTick(timeLeft);

        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            setIsRunning(false);
            Vibration.vibrate([0, 200, 100, 200]);
            const hasMoreSets = completedSets + 1 < totalSets;
            handleCompleteSet();
            if (hasMoreSets && mode === "timer" && durationSeconds) {
              return durationSeconds;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // }, [isRunning, mode, playTick, handleCompleteSet]);
  }, [
    isRunning,
    mode,
    handleCompleteSet,
    completedSets,
    totalSets,
    durationSeconds,
  ]);

  const finishRest = useCallback(() => {
    setIsResting(false);
    setRestTimer(60);
    if (mode === "timer" && durationSeconds) {
      setTimeLeft(durationSeconds);
    }
  }, [mode, durationSeconds]);

  // Resting period timer loop execution
  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(() => {
      // playTick(restTimer);

      setRestTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishRest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // }, [isResting, playTick]);
  }, [isResting, finishRest]);

  // Universal visual loading meter logic
  useEffect(() => {
    let targetValue = 0;
    if (mode === "reps") {
      targetValue = completedSets / totalSets;
    } else if (mode === "timer" && durationSeconds) {
      // Combines total set counts plus active single-set bar tracking resolution
      const baseProgress = completedSets / totalSets;
      const currentSetContribution =
        ((durationSeconds - timeLeft) / durationSeconds) * (1 / totalSets);
      targetValue = baseProgress + currentSetContribution;
    }

    Animated.timing(progressAnim, {
      toValue: Math.min(targetValue, 1),
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [completedSets, timeLeft, totalSets, durationSeconds, mode, progressAnim]);

  const handleFinishSave = async () => {
    if (!exerciseId || isSaving) return;
    setIsSaving(true);
    try {
      await saveLog({
        session_exercise_id: exerciseId,
        completed_sets: totalSets,
        completed_reps: mode === "reps" ? repsPerSet : null,
        duration_seconds: mode === "timer" ? durationSeconds : null,
        difficulty_rating: difficulty,
        notes: notes.trim() ? notes.trim() : null,
      });
      router.back();
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipRest = () => {
    finishRest();
  };

  const handleAddRestTime = () => {
    setRestTimer((prev) => prev + 10);
  };

  const handleQuit = () => {
    Alert.alert(
      "Quit Workout?",
      "Your progress for this exercise won't be saved.",
      [
        { text: "Keep Going", style: "cancel" },
        {
          text: "Quit",
          style: "destructive",
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            router.back();
          },
        },
      ],
    );
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header Element */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <TouchableOpacity
            onPress={handleQuit}
            className="w-10 h-10 bg-surface rounded-full items-center justify-center"
          >
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text className="text-text-secondary text-sm font-medium">
            {!showSummary
              ? `Set ${Math.min(completedSets + 1, totalSets)} of ${totalSets}`
              : "Review & Submit"}
          </Text>
          <View className="w-10" />
        </View>

        {/* Progress Bar Track */}
        <View className="mx-5 h-1.5 bg-surface rounded-full overflow-hidden mb-6">
          <Animated.View
            className="h-full bg-primary rounded-full"
            style={{ width: progressWidth }}
          />
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
        >
          {/* ── SUMMARY FEEDBACK CARD SCREEN ─────────────────────────────── */}
          {showSummary ? (
            <Animated.View
              className="flex-1 px-5 justify-center py-6"
              style={{ transform: [{ scale: celebrationAnim }] }}
            >
              <View className="items-center mb-6">
                <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-4">
                  <Ionicons name="trophy" size={48} color={COLORS.primary} />
                </View>
                <Text className="text-text-primary font-bold text-2xl text-center">
                  Exercise Finished!
                </Text>
                <Text className="text-text-secondary text-center mt-1">
                  Logged {totalSets} sets for {exerciseName}
                </Text>
              </View>

              {/* Difficulty Intensity Selectors */}
              <View className="bg-surface rounded-3xl p-5 mb-5 border border-border/40">
                <Text className="text-text-primary font-semibold text-base mb-3">
                  How was the difficulty?
                </Text>
                <View className="flex-row gap-2">
                  {[
                    {
                      id: 1,
                      label: "Too Easy",
                      color:
                        "border-green-500/30 text-green-500 bg-green-500/5",
                    },
                    {
                      id: 2,
                      label: "Perfect",
                      color: "border-primary/30 text-primary bg-primary/5",
                    },
                    {
                      id: 3,
                      label: "Too Hard",
                      color: "border-red-500/30 text-red-500 bg-red-500/5",
                    },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setDifficulty(item.id)}
                      className={`flex-1 py-3 border rounded-2xl items-center justify-center ${
                        difficulty === item.id
                          ? "bg-primary border-primary"
                          : "bg-transparent border-border"
                      }`}
                    >
                      <Text
                        className={`font-semibold text-sm ${difficulty === item.id ? "text-background" : "text-text-secondary"}`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Optional Comments Input Area */}
              <View className="bg-surface rounded-3xl p-5 mb-8 border border-border/40">
                <Text className="text-text-primary font-semibold text-base mb-2">
                  Notes{" "}
                  <Text className="text-text-secondary text-xs font-normal">
                    (Optional)
                  </Text>
                </Text>
                <TextInput
                  placeholder="Form variations, pain, or changes in mechanical weight feeling..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                  className="bg-background text-text-primary rounded-xl px-4 py-3 min-h-[80px] text-sm text-left align-top border border-border"
                />
              </View>

              <TouchableOpacity
                onPress={handleFinishSave}
                disabled={isSaving}
                className="bg-primary w-full rounded-2xl py-4 items-center justify-center active:opacity-90"
              >
                <Text className="text-background font-bold text-base">
                  {isSaving ? "Saving Progress..." : "Complete & Log"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            /* ACTIVE LIFTCYCLE SECTIONS */
            <View className="flex-1">
              <View className="px-5 mb-8">
                <Text className="text-text-secondary text-xs uppercase tracking-widest mb-1">
                  Now Working
                </Text>
                <Text className="text-text-primary font-bold text-3xl leading-tight">
                  {exerciseName}
                </Text>
              </View>

              {isResting ? (
                /* Rest Interface Screen Overlay */
                <View className="flex-1 items-center justify-center px-5 py-8">
                  <Text className="text-text-secondary text-base mb-4 uppercase tracking-widest">
                    Rest Interval
                  </Text>
                  <View className="w-48 h-48 rounded-full border-4 border-primary/30 items-center justify-center mb-8 bg-primary/5">
                    <Text className="text-primary font-bold text-6xl">
                      {restTimer}
                    </Text>
                    <Text className="text-text-secondary text-sm mt-1">
                      seconds
                    </Text>
                  </View>
                  <Text className="text-text-secondary text-center mb-8 px-4">
                    Great effort! Recover breathing patterns and step back up.
                  </Text>

                  <View className="flex-row gap-4 items-center justify-center">
                    <TouchableOpacity
                      onPress={handleSkipRest}
                      className="border border-border rounded-2xl px-6 py-3"
                    >
                      <Text className="text-text-secondary font-semibold">
                        Skip Rest
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleAddRestTime}
                      className="bg-surface border border-primary/20 rounded-2xl px-6 py-3 flex-row items-center gap-1.5"
                    >
                      <Ionicons name="add" size={16} color={COLORS.primary} />
                      <Text className="text-primary font-semibold">
                        +10s Rest
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* CORE RENDERING SWITCH BLOCK (Timer vs Reps) */
                <View className="flex-1 items-center justify-center px-5 pb-12">
                  {mode === "reps" ? (
                    <View className="items-center w-full">
                      <View className="items-center mb-10">
                        <Text className="text-text-secondary text-sm mb-2 uppercase tracking-widest">
                          Target Reps
                        </Text>
                        <Text className="text-text-primary font-bold text-8xl leading-none">
                          {repsPerSet ?? "—"}
                        </Text>
                      </View>

                      <View className="flex-row gap-2 mb-12">
                        {Array.from({ length: totalSets }).map((_, i) => (
                          <View
                            key={i}
                            className={`w-3 h-3 rounded-full ${i <= completedSets ? "bg-primary" : "bg-surface"}`}
                          />
                        ))}
                      </View>

                      <TouchableOpacity
                        onPress={handleCompleteSet}
                        className="bg-primary gap-4 rounded-3xl flex flex-row px-6 py-3 items-center justify-center"
                        activeOpacity={0.85}
                      >
                        <Text className="text-background font-bold text-xl">
                          Set Done
                        </Text>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.background}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* ── FIX: REPEATING TIMER MODE SETS ── */
                    <View className="items-center w-full">
                      <Animated.View
                        className="w-56 h-56 rounded-full border-4 items-center justify-center mb-8"
                        style={{
                          borderColor: isRunning ? COLORS.primary : "#374151",
                          transform: [{ scale: pulseAnim }],
                          backgroundColor: isRunning
                            ? `${COLORS.primary}10`
                            : "#1F2937",
                        }}
                      >
                        <Text className="text-text-primary font-bold text-6xl">
                          {formatTime(timeLeft)}
                        </Text>
                        <Text className="text-text-secondary text-sm mt-1">
                          {isRunning ? "remaining" : "ready"}
                        </Text>
                      </Animated.View>

                      <View className="flex-row gap-2 mb-8">
                        {Array.from({ length: totalSets }).map((_, i) => (
                          <View
                            key={i}
                            className={`w-3 h-3 rounded-full ${i <= completedSets ? "bg-primary" : "bg-surface"}`}
                          />
                        ))}
                      </View>

                      <View className="flex-row gap-4">
                        <TouchableOpacity
                          onPress={() => setIsRunning((v) => !v)}
                          className="bg-primary rounded-2xl px-10 py-4 flex-row items-center gap-2"
                        >
                          <Ionicons
                            name={isRunning ? "pause" : "play"}
                            size={20}
                            color={COLORS.background}
                          />
                          <Text className="text-background font-bold text-base">
                            {isRunning ? "Pause" : "Start"}
                          </Text>
                        </TouchableOpacity>

                        {!isRunning && timeLeft < (durationSeconds ?? 0) && (
                          <TouchableOpacity
                            onPress={() => setTimeLeft(durationSeconds ?? 0)}
                            className="bg-surface rounded-2xl px-5 py-4 items-center justify-center"
                          >
                            <Ionicons
                              name="refresh"
                              size={20}
                              color={COLORS.textSecondary}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
