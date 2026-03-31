import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useUserProfile } from "@/src/context/profileProvider";
import { PlayIcon } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import { useRouter } from "expo-router";

export default function Dashboard() {
    const { profile } = useUserProfile();
    const router = useRouter();

    if (!profile) return null;

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    // Mock data - replace with real data from your backend
    const todayStats = {
        workoutsCompleted: 1,
        caloriesBurned: 450,
        activeMinutes: 45,
        streak: 7,
    };

    const weeklyProgress = {
        workoutsThisWeek: 4,
        workoutsGoal: 5,
        percentage: 80,
    };

    const upcomingWorkout = {
        name: "Upper Body Strength",
        time: "6:00 PM",
        duration: "45 min",
    };

    const recentAchievements = [
        { id: 1, title: "7 Day Streak", icon: "🔥", unlocked: true },
        { id: 2, title: "First Workout", icon: "💪", unlocked: true },
        { id: 3, title: "Early Bird", icon: "🌅", unlocked: true },
        { id: 4, title: "10 Workouts", icon: "⭐", unlocked: false },
    ];

    return (
        <ScrollView className="flex-1 bg-background">
            {/* Header/Greeting Section */}

            <View className="p-4 pt-6">
                <Text className="text-text-secondary text-base">
                    {getGreeting()},
                </Text>
                <Text className="text-text-primary text-3xl font-bold mt-1">
                    {profile.firstName.charAt(0).toUpperCase() +
                        profile.firstName.slice(1)}
                </Text>

                {/* Subscription badge */}
                {profile.subscription?.status === "active" && (
                    <View className="bg-primary/20 border border-primary rounded-full px-3 py-1 mt-2 self-start">
                        <Text className="text-primary text-xs font-bold">
                            ✓{" "}
                            {profile.subscription.planName || "Premium Member"}
                        </Text>
                    </View>
                )}

                {profile.subscription?.status === "expired" && (
                    <View className="bg-danger/20 border border-danger rounded-full px-3 py-1 mt-2 self-start">
                        <Text className="text-danger text-xs font-bold">
                            Subscription Expired
                        </Text>
                    </View>
                )}

                {profile.subscription?.status === "cancelled" && (
                    <View className="bg-danger/20 border border-danger rounded-full px-3 py-1 mt-2 self-start">
                        <Text className="text-danger text-xs font-bold">
                            Subscription Cancelled
                        </Text>
                    </View>
                )}

                {profile.subscription?.status === "pending" && (
                    <View className="bg-yellow-100/20 border border-yellow-100 rounded-full px-3 py-1 mt-2 self-start">
                        <Text className="text-yellow-100 text-xs font-bold">
                            Subscription Pending
                        </Text>
                    </View>
                )}
            </View>

            {/* Streak Card */}
            <View className="px-4 mb-4">
                <View className="bg-gradient-to-r from-primary/20 to-primary/10 bg-surface rounded-2xl p-4 border border-primary/30">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-text-secondary text-sm">
                                Current Streak
                            </Text>
                            <View className="flex-row items-baseline gap-2 mt-1">
                                <Text className="text-primary text-4xl font-bold">
                                    {todayStats.streak}
                                </Text>
                                <Text className="text-text-secondary text-lg">
                                    days
                                </Text>
                            </View>
                            <Text className="text-text-secondary text-xs mt-1">
                                Keep it up! 🔥
                            </Text>
                        </View>
                        <Text className="text-6xl">🔥</Text>
                    </View>
                </View>
            </View>

            {/* Today's Stats */}
            <View className="px-4 mb-4">
                <Text className="text-text-primary text-lg font-bold mb-3">
                    Today&apos;s Activity
                </Text>
                <View className="flex-row gap-3">
                    <StatCard
                        icon="💪"
                        label="Workouts"
                        value={todayStats.workoutsCompleted.toString()}
                        bgColor="bg-surface"
                    />
                    <StatCard
                        icon="🔥"
                        label="Calories"
                        value={todayStats.caloriesBurned.toString()}
                        bgColor="bg-surface"
                    />
                    <StatCard
                        icon="⏱️"
                        label="Minutes"
                        value={todayStats.activeMinutes.toString()}
                        bgColor="bg-surface"
                    />
                </View>
            </View>

            {/* Weekly Progress */}
            <View className="px-4 mb-4">
                <View className="bg-surface rounded-2xl p-4">
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-text-primary text-base font-bold">
                            Weekly Progress
                        </Text>
                        <Text className="text-primary text-sm font-bold">
                            {weeklyProgress.workoutsThisWeek}/
                            {weeklyProgress.workoutsGoal} workouts
                        </Text>
                    </View>

                    {/* Progress Bar */}
                    <View className="bg-border rounded-full h-3 overflow-hidden">
                        <View
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${weeklyProgress.percentage}%` }}
                        />
                    </View>

                    <Text className="text-text-secondary text-xs mt-2">
                        {weeklyProgress.workoutsGoal -
                            weeklyProgress.workoutsThisWeek}{" "}
                        more workout
                        {weeklyProgress.workoutsGoal -
                            weeklyProgress.workoutsThisWeek !==
                        1
                            ? "s"
                            : ""}{" "}
                        to reach your weekly goal!
                    </Text>
                </View>
            </View>

            {/* Current Stats Overview */}
            {profile.currentStats && (
                <View className="px-4 mb-4">
                    <Text className="text-text-primary text-lg font-bold mb-3">
                        Your Stats
                    </Text>
                    <View className="bg-surface rounded-2xl p-4">
                        <View className="flex-row justify-between mb-3">
                            <MetricItem
                                label="Weight"
                                value={`${profile.currentStats.weightKg} kg`}
                            />
                            <MetricItem
                                label="Body Fat"
                                value={`${profile.currentStats.bodyFatPercent}%`}
                            />
                            <MetricItem
                                label="Muscle Mass"
                                value={`${profile.currentStats.muscleMassKg} kg`}
                            />
                        </View>
                        {/* <Text className="text-text-secondary text-xs text-center">
                            Last updated:{" "}
                            {new Date(
                                profile?.currentStats.lastRecorded,
                            ).toLocaleDateString()}
                        </Text> */}
                    </View>
                </View>
            )}

            {/* Upcoming Workout */}
            <View className="px-4 mb-4">
                <Text className="text-text-primary text-lg font-bold mb-3">
                    Next Workout
                </Text>
                <TouchableOpacity className="bg-surface rounded-2xl p-4 border-l-4 border-primary">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="text-text-primary text-base font-bold">
                                {upcomingWorkout.name}
                            </Text>
                            <View className="flex-row gap-4 mt-2">
                                <Text className="text-text-secondary text-sm">
                                    ⏰ {upcomingWorkout.time}
                                </Text>
                                <Text className="text-text-secondary text-sm">
                                    ⏱️ {upcomingWorkout.duration}
                                </Text>
                            </View>
                        </View>
                        <View className="bg-primary rounded-full p-3">
                            <PlayIcon
                                color={COLORS.border}
                                fill={COLORS.surface}
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Recent Achievements */}
            <View className="px-4 mb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-text-primary text-lg font-bold">
                        Achievements
                    </Text>
                    <TouchableOpacity>
                        <Text className="text-primary text-sm font-medium">
                            View All
                        </Text>
                    </TouchableOpacity>
                </View>
                <View className="flex-row gap-3">
                    {recentAchievements.slice(0, 4).map((achievement) => (
                        <View
                            key={achievement.id}
                            className={`flex-1 bg-surface rounded-xl p-3 items-center ${
                                !achievement.unlocked ? "opacity-40" : ""
                            }`}
                        >
                            <Text className="text-3xl mb-1">
                                {achievement.icon}
                            </Text>
                            <Text className="text-text-secondary text-xs text-center">
                                {achievement.title}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Quick Actions */}
            <View className="px-4 mb-6">
                <Text className="text-text-primary text-lg font-bold mb-3">
                    Quick Actions
                </Text>
                <View className="gap-3">
                    <TouchableOpacity
                        className="bg-primary rounded-xl p-4 flex-row items-center justify-between"
                        onPress={() => router.navigate("/chat")}
                    >
                        <View className="flex-row items-center gap-3">
                            <Text className="text-2xl">🤖</Text>
                            <View>
                                <Text className="text-background font-bold text-base">
                                    Chat with AI Trainer
                                </Text>
                                <Text className="text-background/70 text-xs">
                                    Get personalized guidance
                                </Text>
                            </View>
                        </View>
                        <Text className="text-background text-xl">→</Text>
                    </TouchableOpacity>

                    <View className="flex-row gap-3">
                        <TouchableOpacity className="flex-1 bg-surface rounded-xl p-4 items-center">
                            <Text className="text-2xl mb-1">📊</Text>
                            <Text className="text-text-primary text-sm font-medium">
                                Progress
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 bg-surface rounded-xl p-4 items-center">
                            <Text className="text-2xl mb-1">📅</Text>
                            <Text className="text-text-primary text-sm font-medium">
                                Schedule
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 bg-surface rounded-xl p-4 items-center">
                            <Text className="text-2xl mb-1">📈</Text>
                            <Text className="text-text-primary text-sm font-medium">
                                Analytics
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

// Stat Card Component
const StatCard = ({
    icon,
    label,
    value,
    bgColor,
}: {
    icon: string;
    label: string;
    value: string;
    bgColor: string;
}) => (
    <View className={`flex-1 ${bgColor} rounded-xl p-4 border border-border`}>
        <Text className="text-2xl mb-2">{icon}</Text>
        <Text className="text-text-primary text-2xl font-bold">{value}</Text>
        <Text className="text-text-secondary text-xs mt-1">{label}</Text>
    </View>
);

// Metric Item Component
const MetricItem = ({ label, value }: { label: string; value: string }) => (
    <View className="items-center">
        <Text className="text-text-secondary text-xs mb-1">{label}</Text>
        <Text className="text-text-primary text-lg font-bold">{value}</Text>
    </View>
);
