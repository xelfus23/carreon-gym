import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Vibration,
  StatusBar,
  Alert,
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
  const durationSeconds = params.durationSeconds ? Number(params.durationSeconds) : null;

  const mode: SessionMode = durationSeconds !== null && repsPerSet === null ? "timer" : "reps";

  // ── Reps Mode State ──────────────────────────────────────────────
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(60);

  // ── Timer Mode State ──────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(durationSeconds ?? 0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Animations ────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Audio Engine Setup ────────────────────────────────────────────
  const tickSound1 = useAudioPlayer(require("@/src/assets/sounds/tick1.mp3"));
  const tickSound2 = useAudioPlayer(require("@/src/assets/sounds/tick2.mp3"));
  const tickSoundFinal = useAudioPlayer(require("@/src/assets/sounds/tick3.mp3"));

  // Track alternating track layers without causing re-renders
  const useFirstTickTrack = useRef(true);

  const playTick = useCallback((currentTime: number) => {
    // 1. Always play the regular alternating rhythm (tick1 or tick2)
    const basePlayer = useFirstTickTrack.current ? tickSound1 : tickSound2;
    if (basePlayer) {
      basePlayer.seekTo(0);
      basePlayer.play();
    }
    // Toggle the rhythm flag for next second boundary
    useFirstTickTrack.current = !useFirstTickTrack.current;

    // 2. Overlay tick3 layered on top during the final 5 seconds (5, 4, 3, 2, 1)
    if (currentTime <= 5 && currentTime > 0) {
      if (tickSoundFinal) {
        tickSoundFinal.seekTo(0);
        tickSoundFinal.play();
      }
    }
  }, [tickSound1, tickSound2, tickSoundFinal]);

  // Pulse animation for active timer
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

  // Timer countdown logic + Sound tick integration
  useEffect(() => {
    if (mode === "timer" && isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        // 🎵 Fires alternating rhythm + optional countdown overlay simultaneously
        playTick(timeLeft);

        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setTimerDone(true);
            Vibration.vibrate([0, 200, 100, 200]);

            Animated.spring(celebrationAnim, {
              toValue: 1,
              useNativeDriver: true,
            }).start();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, timeLeft, celebrationAnim, playTick]);

  // Rest timer countdown + Sound tick integration
  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(() => {
      // 🎵 Play sounds during rest periods
      playTick(restTimer);

      setRestTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResting(false);
          setRestTimer(60);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting, restTimer, playTick]);

  // Progress bar animation (reps mode: by sets)
  useEffect(() => {
    if (mode === "reps") {
      Animated.timing(progressAnim, {
        toValue: completedSets / totalSets,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [completedSets, totalSets, mode, progressAnim]);

  // Progress bar animation (timer mode: by time)
  useEffect(() => {
    if (mode === "timer" && durationSeconds) {
      Animated.timing(progressAnim, {
        toValue: 1 - timeLeft / durationSeconds,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, durationSeconds, progressAnim, mode]);

  const handleFinish = useCallback(
    async (setsCompleted = completedSets) => {
      if (!exerciseId || isSaving) return;
      setIsSaving(true);
      try {
        await saveLog({
          workout_exercise_id: exerciseId,
          completed_sets: mode === "reps" ? setsCompleted : totalSets,
          completed_reps: mode === "reps" ? repsPerSet : null,
          duration_seconds: mode === "timer" && durationSeconds != null ? durationSeconds : null,
        });
        router.back();
      } catch (err) {
        if (err instanceof Error) console.error(err.message);
      } finally {
        setIsSaving(false);
      }
    },
    [completedSets, exerciseId, isSaving, mode, repsPerSet, router, totalSets, durationSeconds, saveLog],
  );

  const handleCompleteSet = useCallback(() => {
    Vibration.vibrate(50);
    const newCompleted = completedSets + 1;
    setCompletedSets(newCompleted);

    if (newCompleted >= totalSets) {
      Animated.spring(celebrationAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        void handleFinish(newCompleted);
      }, 600);
    } else {
      setCurrentSet(newCompleted + 1);
      setIsResting(true);
    }
  }, [completedSets, totalSets, celebrationAnim, handleFinish]);

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTimer(60);
  };

  const handleAddRestTime = () => {
    setRestTimer((prev) => prev + 30);
  };

  const handleQuit = () => {
    Alert.alert(
      "Quit Workout?",
      "Your progress for this exercise won't be saved.",
      [
        {
          text: "Keep Going",
          style: "cancel",
        },
        {
          text: "Quit",
          style: "destructive",
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            router.back();
          },
        },
      ]
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

  const isComplete = (mode === "reps" && completedSets >= totalSets) || (mode === "timer" && timerDone);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={handleQuit}
          className="w-10 h-10 bg-surface rounded-full items-center justify-center"
        >
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text className="text-text-secondary text-sm font-medium">
          {mode === "reps" ? `Set ${Math.min(currentSet, totalSets)} of ${totalSets}` : "Timed Exercise"}
        </Text>
        <View className="w-10" />
      </View>

      {/* Progress Bar */}
      <View className="mx-5 h-1.5 bg-surface rounded-full overflow-hidden mb-6">
        <Animated.View className="h-full bg-primary rounded-full" style={{ width: progressWidth }} />
      </View>

      {/* Exercise Name */}
      <View className="px-5 mb-8">
        <Text className="text-text-secondary text-xs uppercase tracking-widest mb-1">Now Working</Text>
        <Text className="text-text-primary font-bold text-3xl leading-tight">{exerciseName}</Text>
      </View>

      {/* ── REPS MODE ─────────────────────────────────────────────── */}
      {mode === "reps" && (
        <View className="flex-1 items-center justify-center px-5">
          {isResting ? (
            /* Rest Screen */
            <View className="items-center">
              <Text className="text-text-secondary text-base mb-4 uppercase tracking-widest">Rest</Text>
              <View className="w-48 h-48 rounded-full border-4 border-primary/30 items-center justify-center mb-8 bg-primary/5">
                <Text className="text-primary font-bold text-6xl">{restTimer}</Text>
                <Text className="text-text-secondary text-sm mt-1">seconds</Text>
              </View>
              <Text className="text-text-secondary text-center mb-8">
                Great set! Recover and prepare for the next.
              </Text>

              {/* Action Buttons Row */}
              <View className="flex-row gap-4 items-center justify-center">
                <TouchableOpacity
                  onPress={handleSkipRest}
                  className="border border-border rounded-2xl px-6 py-3"
                >
                  <Text className="text-text-secondary font-semibold">Skip Rest</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddRestTime}
                  className="bg-surface border border-primary/20 rounded-2xl px-6 py-3 flex-row items-center gap-1.5"
                >
                  <Ionicons name="add" size={16} color={COLORS.primary} />
                  <Text className="text-primary font-semibold">+30s Rest</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isComplete ? (
            /* Completion State */
            <Animated.View className="items-center" style={{ transform: [{ scale: celebrationAnim }] }}>
              <View className="w-32 h-32 rounded-full bg-primary-dark/10 items-center justify-center mb-6">
                <Ionicons name="trophy" size={60} color={COLORS.primary} />
              </View>
              <Text className="text-primary font-bold text-2xl mb-2">Exercise Complete!</Text>
              <Text className="text-text-secondary text-center">{totalSets} sets completed 💪</Text>
            </Animated.View>
          ) : (
            /* Active Set Screen */
            <View className="items-center w-full">
              <View className="items-center mb-10">
                <Text className="text-text-secondary text-sm mb-2 uppercase tracking-widest">Target Reps</Text>
                <Text className="text-text-primary font-bold text-8xl leading-none">{repsPerSet ?? "—"}</Text>
              </View>

              {/* Set dots */}
              <View className="flex-row gap-2 mb-12">
                {Array.from({ length: totalSets }).map((_, i) => (
                  <View
                    key={i}
                    className={`w-3 h-3 rounded-full ${i < completedSets ? "bg-primary" : i === completedSets ? "bg-primary" : "bg-surface"
                      }`}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={handleCompleteSet}
                className="bg-primary gap-4 rounded-3xl flex flex-row px-4 py-2 items-center justify-center active:bg-primary-dark"
                activeOpacity={0.85}
              >
                <Text className="text-background font-bold text-xl">Set Done</Text>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.background} />
              </TouchableOpacity>
              <Text className="text-text-primary text-xs mt-2">Tap when finished</Text>
            </View>
          )}
        </View>
      )}

      {/* ── TIMER MODE ─────────────────────────────────────────────── */}
      {mode === "timer" && (
        <View className="flex-1 items-center justify-center px-5">
          {timerDone ? (
            /* Completion State */
            <Animated.View className="items-center" style={{ transform: [{ scale: celebrationAnim }] }}>
              <View className="w-32 h-32 rounded-full bg-primary-dark/10 items-center justify-center mb-6">
                <Ionicons name="trophy" size={60} color={COLORS.primary} />
              </View>
              <Text className="text-primary font-bold text-2xl mb-2">Time&apos;s Up!</Text>
              <Text className="text-text-secondary text-center mb-8">Great work! Exercise complete 💪</Text>
              <TouchableOpacity
                onPress={() => {
                  void handleFinish();
                }}
                disabled={isSaving}
                className="bg-primary rounded-2xl px-10 py-4"
              >
                <Text className="text-background font-bold text-base">
                  {isSaving ? "Saving..." : "Continue"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View className="items-center w-full">
              {/* Circular Timer */}
              <Animated.View
                className="w-56 h-56 rounded-full border-4 items-center justify-center mb-12"
                style={{
                  borderColor: isRunning ? COLORS.primary : "#374151",
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: isRunning ? `${COLORS.primary}10` : "#1F2937",
                }}
              >
                <Text className="text-text-primary font-bold text-6xl">{formatTime(timeLeft)}</Text>
                <Text className="text-text-secondary text-sm mt-1">{isRunning ? "remaining" : "ready"}</Text>
              </Animated.View>

              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => setIsRunning((v) => !v)}
                  className="bg-primary rounded-2xl px-10 py-4 flex-row items-center gap-2"
                  activeOpacity={0.85}
                >
                  <Ionicons name={isRunning ? "pause" : "play"} size={20} color={COLORS.background} />
                  <Text className="text-background font-bold text-base">{isRunning ? "Pause" : "Start"}</Text>
                </TouchableOpacity>

                {!isRunning && timeLeft < (durationSeconds ?? 0) && (
                  <TouchableOpacity
                    onPress={() => setTimeLeft(durationSeconds ?? 0)}
                    className="bg-surface rounded-2xl px-5 py-4 items-center justify-center"
                  >
                    <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}