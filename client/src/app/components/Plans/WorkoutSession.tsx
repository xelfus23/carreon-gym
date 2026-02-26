import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Vibration,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "@/src/consts/colors";
import { SafeAreaView } from "react-native-safe-area-context";

type SessionMode = "reps" | "timer";

export default function WorkoutSession() {
    const router = useRouter();
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
    const dayId = Number(params.dayId);
    const totalSets = Number(params.sets) || 1;
    const repsPerSet = params.reps ? Number(params.reps) : null;
    const durationSeconds = params.durationSeconds
        ? Number(params.durationSeconds)
        : null;

    const mode: SessionMode =
        durationSeconds !== null && repsPerSet === null ? "timer" : "reps";

    // ── Reps Mode State ──────────────────────────────────────────────
    const [currentSet, setCurrentSet] = useState(1);
    const [completedSets, setCompletedSets] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [restTimer, setRestTimer] = useState(60); // 60s rest between sets

    // ── Timer Mode State ──────────────────────────────────────────────
    const [timeLeft, setTimeLeft] = useState(durationSeconds ?? 0);
    const [isRunning, setIsRunning] = useState(false);
    const [timerDone, setTimerDone] = useState(false);

    // ── Animations ────────────────────────────────────────────────────
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const celebrationAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    }, [isRunning, mode]);

    // Timer countdown logic
    useEffect(() => {
        if (mode === "timer" && isRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setIsRunning(false);
                        setTimerDone(true);
                        Vibration.vibrate([0, 200, 100, 200]);
                        // Celebration animation
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
    }, [isRunning, mode, timeLeft]);

    // Rest timer between sets
    useEffect(() => {
        if (!isResting) return;
        const interval = setInterval(() => {
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
    }, [isResting]);

    // Progress bar animation (reps mode: by sets)
    useEffect(() => {
        if (mode === "reps") {
            Animated.timing(progressAnim, {
                toValue: completedSets / totalSets,
                duration: 400,
                useNativeDriver: false,
            }).start();
        }
    }, [completedSets, totalSets]);

    // Progress bar animation (timer mode: by time)
    useEffect(() => {
        if (mode === "timer" && durationSeconds) {
            Animated.timing(progressAnim, {
                toValue: 1 - timeLeft / durationSeconds,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    }, [timeLeft, durationSeconds]);

    const handleCompleteSet = useCallback(() => {
        Vibration.vibrate(50);
        const newCompleted = completedSets + 1;
        setCompletedSets(newCompleted);

        if (newCompleted >= totalSets) {
            // All sets done → navigate back with result
            Animated.spring(celebrationAnim, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
            setTimeout(() => handleFinish(newCompleted), 600);
        } else {
            setCurrentSet(newCompleted + 1);
            setIsResting(true);
        }
    }, [completedSets, totalSets]);

    const handleSkipRest = () => {
        setIsResting(false);
        setRestTimer(60);
    };

    const handleFinish = (setsCompleted = completedSets) => {
        // Navigate back with exercise log data
        // Use router.back() and pass results via a shared store / context / params
        router.back();
        // NOTE: Wire this to your openLogModal or directly call workoutService.logExercise
        // by passing a callback through router params or a Zustand/context store.
        // Example pattern shown in integration notes below.
    };

    const handleQuit = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        router.back();
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

    const isComplete =
        (mode === "reps" && completedSets >= totalSets) ||
        (mode === "timer" && timerDone);

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
                <TouchableOpacity
                    onPress={handleQuit}
                    className="w-10 h-10 bg-surface rounded-full items-center justify-center"
                >
                    <Ionicons
                        name="close"
                        size={20}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
                <Text className="text-text-secondary text-sm font-medium">
                    {mode === "reps"
                        ? `Set ${Math.min(currentSet, totalSets)} of ${totalSets}`
                        : "Timed Exercise"}
                </Text>
                <View className="w-10" />
            </View>

            {/* Progress Bar */}
            <View className="mx-5 h-1.5 bg-surface rounded-full overflow-hidden mb-6">
                <Animated.View
                    className="h-full bg-primary rounded-full"
                    style={{ width: progressWidth }}
                />
            </View>

            {/* Exercise Name */}
            <View className="px-5 mb-8">
                <Text className="text-text-secondary text-xs uppercase tracking-widest mb-1">
                    Now Working
                </Text>
                <Text className="text-text-primary font-bold text-3xl leading-tight">
                    {exerciseName}
                </Text>
            </View>

            {/* ── REPS MODE ─────────────────────────────────────────────── */}
            {mode === "reps" && (
                <View className="flex-1 items-center justify-center px-5">
                    {isResting ? (
                        /* Rest Screen */
                        <View className="items-center">
                            <Text className="text-text-secondary text-base mb-4 uppercase tracking-widest">
                                Rest
                            </Text>
                            <View className="w-48 h-48 rounded-full border-4 border-primary/30 items-center justify-center mb-8 bg-primary/5">
                                <Text className="text-primary font-bold text-6xl">
                                    {restTimer}
                                </Text>
                                <Text className="text-text-secondary text-sm mt-1">
                                    seconds
                                </Text>
                            </View>
                            <Text className="text-text-secondary text-center mb-8">
                                Great set! Recover and prepare for the next.
                            </Text>
                            <TouchableOpacity
                                onPress={handleSkipRest}
                                className="border border-border rounded-2xl px-8 py-3"
                            >
                                <Text className="text-text-secondary font-semibold">
                                    Skip Rest
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : isComplete ? (
                        /* Completion State */
                        <Animated.View
                            className="items-center"
                            style={{ transform: [{ scale: celebrationAnim }] }}
                        >
                            <View className="w-32 h-32 rounded-full bg-green-500/20 items-center justify-center mb-6">
                                <Ionicons
                                    name="trophy"
                                    size={60}
                                    color="#10B981"
                                />
                            </View>
                            <Text className="text-green-500 font-bold text-2xl mb-2">
                                Exercise Complete!
                            </Text>
                            <Text className="text-text-secondary text-center">
                                {totalSets} sets completed 💪
                            </Text>
                        </Animated.View>
                    ) : (
                        /* Active Set Screen */
                        <View className="items-center w-full">
                            <View className="items-center mb-10">
                                <Text className="text-text-secondary text-sm mb-2 uppercase tracking-widest">
                                    Target Reps
                                </Text>
                                <Text className="text-text-primary font-bold text-8xl leading-none">
                                    {repsPerSet ?? "—"}
                                </Text>
                            </View>

                            {/* Set dots */}
                            <View className="flex-row gap-2 mb-12">
                                {Array.from({ length: totalSets }).map(
                                    (_, i) => (
                                        <View
                                            key={i}
                                            className={`w-3 h-3 rounded-full ${
                                                i < completedSets
                                                    ? "bg-green-500"
                                                    : i === completedSets
                                                      ? "bg-primary"
                                                      : "bg-surface"
                                            }`}
                                        />
                                    ),
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={handleCompleteSet}
                                className="bg-primary rounded-3xl px-16 py-5 items-center"
                                activeOpacity={0.85}
                                style={{
                                    shadowColor: COLORS.primary,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 16,
                                    elevation: 8,
                                }}
                            >
                                <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color="#fff"
                                    style={{ marginBottom: 4 }}
                                />
                                <Text className="text-white font-bold text-lg">
                                    Set Done
                                </Text>
                                <Text className="text-white/70 text-xs mt-0.5">
                                    Tap when finished
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* ── TIMER MODE ─────────────────────────────────────────────── */}
            {mode === "timer" && (
                <View className="flex-1 items-center justify-center px-5">
                    {timerDone ? (
                        /* Completion State */
                        <Animated.View
                            className="items-center"
                            style={{ transform: [{ scale: celebrationAnim }] }}
                        >
                            <View className="w-32 h-32 rounded-full bg-green-500/20 items-center justify-center mb-6">
                                <Ionicons
                                    name="trophy"
                                    size={60}
                                    color="#10B981"
                                />
                            </View>
                            <Text className="text-green-500 font-bold text-2xl mb-2">
                                Time&apos;s Up!
                            </Text>
                            <Text className="text-text-secondary text-center mb-8">
                                Great work! Exercise complete 💪
                            </Text>
                            <TouchableOpacity
                                onPress={() => handleFinish()}
                                className="bg-green-500 rounded-2xl px-10 py-4"
                            >
                                <Text className="text-white font-bold text-base">
                                    Continue
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <View className="items-center w-full">
                            {/* Circular Timer */}
                            <Animated.View
                                className="w-56 h-56 rounded-full border-4 items-center justify-center mb-12"
                                style={{
                                    borderColor: isRunning
                                        ? COLORS.primary
                                        : "#374151",
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

                            <View className="flex-row gap-4">
                                <TouchableOpacity
                                    onPress={() => setIsRunning((v) => !v)}
                                    className="bg-primary rounded-2xl px-10 py-4 flex-row items-center gap-2"
                                    activeOpacity={0.85}
                                >
                                    <Ionicons
                                        name={isRunning ? "pause" : "play"}
                                        size={20}
                                        color="#fff"
                                    />
                                    <Text className="text-white font-bold text-base">
                                        {isRunning ? "Pause" : "Start"}
                                    </Text>
                                </TouchableOpacity>

                                {!isRunning &&
                                    timeLeft < (durationSeconds ?? 0) && (
                                        <TouchableOpacity
                                            onPress={() =>
                                                setTimeLeft(
                                                    durationSeconds ?? 0,
                                                )
                                            }
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

            {/* Bottom safe area */}
            <View className="h-8" />
        </SafeAreaView>
    );
}
