import { COLORS } from "@/src/consts/colors";
import { useWorkout } from "@/src/hooks/useWorkout";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type SectionHeaderProps = {
    title: string;
    count: number;
    accent: string;
};

export function SectionHeader({ title, count, accent }: SectionHeaderProps) {
    return (
        <View className="flex-row items-center justify-between mb-4 mt-2">
            <View className="flex-row items-center gap-2">
                <View
                    className="w-1.5 h-6 rounded-full"
                    style={{ backgroundColor: accent }}
                />
                <Text className="text-lg font-bold text-text-primary tracking-tight">
                    {title}
                </Text>
            </View>
            <View
                className="px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${accent}20` }}
            >
                <Text className="text-xs font-bold" style={{ color: accent }}>
                    {count}
                </Text>
            </View>
        </View>
    );
}

type ExerciseCardProps = {
    ex: any; // Ideally use your FlatExercise type here
    checked: boolean;
    onPress?: () => void;
};

export function ExerciseCard({ ex, checked, onPress }: ExerciseCardProps) {
    const isTimed = ex.duration_seconds != null && ex.reps == null;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={checked} // Disable interaction if already completed
            activeOpacity={0.7}
            className={`mb-3 rounded-2xl border p-4 flex-row items-center gap-4 ${
                checked
                    ? "bg-surface/50 border-green-500/20"
                    : "bg-surface border-border"
            }`}
        >
            {/* Left Icon/Status Indicator */}
            <View
                className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    checked ? "bg-green-500/10" : "bg-primary/10"
                }`}
            >
                {checked ? (
                    <Ionicons name="checkmark-done" size={24} color="#10B981" />
                ) : (
                    <Ionicons
                        name={isTimed ? "timer-outline" : "barbell-outline"}
                        size={22}
                        color={COLORS.primary}
                    />
                )}
            </View>

            {/* Middle Info */}
            <View className="flex-1">
                <Text
                    className={`text-base font-semibold ${
                        checked
                            ? "text-text-secondary line-through"
                            : "text-text-primary"
                    }`}
                    numberOfLines={1}
                >
                    {ex.exercise_name || "Unknown Exercise"}
                </Text>

                <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-text-secondary text-xs font-medium">
                        {isTimed
                            ? `${ex.duration_seconds}s`
                            : `${ex.sets ?? 0} sets × ${ex.reps ?? 0} reps`}
                    </Text>
                    <View className="w-1 h-1 rounded-full bg-text-secondary/30" />
                    <Text
                        className="text-text-secondary text-xs"
                        numberOfLines={1}
                    >
                        {Array.isArray(ex.equipment_name)
                            ? ex.equipment_name[0]
                            : ex.equipment_name || "Bodyweight"}
                    </Text>
                </View>
            </View>

            {/* Right Action Arrow */}
            {!checked && (
                <View className="bg-border/30 rounded-full p-1">
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={COLORS.textSecondary}
                    />
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function TodayWorkoutScreen() {
    const { workoutPlans, isExerciseChecked, openLogModal } = useWorkout();

    // 1. Get ONLY the active plan
    const activePlan = workoutPlans.find((p) => p.is_active);

    // 2. Get ONLY today's exercises
    const todayStr = new Date().toISOString().split("T")[0];

    const todayExercises =
        activePlan?.days
            ?.filter((day) => day.day_date.toString() === todayStr) // Filter by day_date
            .flatMap((day) =>
                day.exercises.map((ex) => ({
                    ...ex,
                    dayId: day.id,
                    dayTitle: day.title,
                })),
            ) || [];

    // 3. Split by completion status
    const incomplete = todayExercises.filter(
        (ex) => !isExerciseChecked(ex.dayId, ex.id),
    );
    const completed = todayExercises.filter((ex) =>
        isExerciseChecked(ex.dayId, ex.id),
    );

    return (
        <ScrollView className="flex-1 bg-background p-4">
            <Text className="text-2xl font-bold">Today&Apos;s Session</Text>

            {/* INCOMPLETE FIRST */}
            <SectionHeader
                title="To Do"
                count={incomplete.length}
                accent={COLORS.primary}
            />
            {incomplete.map((ex) => (
                <ExerciseCard
                    key={ex.id}
                    ex={ex}
                    checked={false}
                    onPress={() =>
                        openLogModal(
                            ex.dayId,
                            ex.id,
                            ex.exercise_name,
                            ex.sets,
                            ex.reps,
                            ex.duration_seconds,
                        )
                    }
                />
            ))}

            {/* COMPLETED SECOND */}
            {completed.length > 0 && (
                <View className="mt-6 opacity-60">
                    <SectionHeader
                        title="Completed"
                        count={completed.length}
                        accent={COLORS.success}
                    />
                    {completed.map((ex) => (
                        <ExerciseCard key={ex.id} ex={ex} checked={true} />
                    ))}
                </View>
            )}
        </ScrollView>
    );
}
