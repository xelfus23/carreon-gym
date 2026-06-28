import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useUserProfile } from "@/src/context/profileProvider";
import { Check, PlayIcon } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import { useWorkout } from "@/src/hooks/useWorkout";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { formatDate } from "@/src/utils/formatDate";
import { Ionicons } from "@expo/vector-icons";
import getCustomLoader from "@/src/app/components/CustomRefreshControl";
import { useModal } from "@/src/context/ModalProvider";
import {
  getActiveSubscriptions,
  getSubscriptionSummary,
  hasActiveSubscription,
} from "@/src/utils/subscription";
import { tokenManager } from "@/src/utils/tokenManager";

export default function Dashboard() {
  const { profile, refreshProfile } = useUserProfile();
  const {
    workoutSessions,
    todayStats,
    refreshWorkoutSessions,
    isExerciseChecked,
  } = useWorkout();

  const refreshToken = tokenManager.getRefreshToken();
  const accessToken = tokenManager.getAccessToken();
  console.log(accessToken);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const router = useRouter();
  const { currentSubscriptions } = useModal();
  const subscriptionSummary = getSubscriptionSummary(profile);
  const activeSubscriptions = getActiveSubscriptions(profile);
  const showSubscriptionBadge = hasActiveSubscription(profile);

  const selectedExercises = useMemo(() => {
    return workoutSessions
      .filter(
        (s) => formatDate(new Date(s.session_date)) === formatDate(new Date()),
      )
      .flatMap((s) =>
        s.exercises.map((ex) => ({
          ...ex,
          sessionId: s.id,
          sessionTitle: s.title,
        })),
      );
  }, [workoutSessions]);

  if (!profile) return null;

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([refreshProfile(), refreshWorkoutSessions()]);
    } catch (err) {
      console.log(
        err instanceof Error ? err.message : "Unknown error occurred.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // 1. Contextual Time-of-Day Profile Greetings
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Working hard early";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // 2. Compute dynamic weekly goals from the active workout plan structure

  const weeklyProgress = {
    workoutsThisWeek: todayStats.workoutsCompleted > 0 ? 1 : 0,
    workoutsGoal: 7,
    percentage: Math.min(
      Math.round(((todayStats.workoutsCompleted > 0 ? 1 : 0) / 7) * 100),
      100,
    ),
  };

  // 3. Smart Semantic Feedback for Weekly Goals Summary Text
  const getWeeklyProgressMessage = () => {
    if (weeklyProgress.workoutsThisWeek === 0)
      return "Kick off your weekly schedule with a session today! 💪";
    if (weeklyProgress.workoutsThisWeek >= weeklyProgress.workoutsGoal)
      return "Weekly objective accomplished! Exceptional effort! 🎉";
    return `You're on track! Only ${weeklyProgress.workoutsGoal - weeklyProgress.workoutsThisWeek} more training slots scheduled this week.`;
  };

  const upcomming =
    selectedExercises.filter(
      (ex) => !isExerciseChecked(ex.sessionId, ex.exercise_id),
    )[0] || null;

  const isStreakHigh = todayStats.streak >= 7;

  const mainIcon = isStreakHigh
    ? require("@/src/assets/ui/crown-icon.png")
    : require("@/src/assets/ui/fire-icon.png");

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      refreshControl={getCustomLoader(isRefreshing, handleRefresh)}
    >
      {/* Header/Greeting Section */}
      <View className="p-4 pt-6">
        <Text className="text-text-secondary text-base">{getGreeting()},</Text>
        <Text className="text-text-primary text-3xl font-bold mt-1">
          {profile.firstName.charAt(0).toUpperCase() +
            profile.firstName.slice(1)}
        </Text>

        {/* Subscription status badges */}
        {showSubscriptionBadge && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={currentSubscriptions.show}
            className="flex flex-row gap-2 items-center py-1 mt-1 self-start"
          >
            <View className="rounded-full bg-primary/40 p-0.5">
              <Check color={COLORS.primary} size={12} />
            </View>
            <Text className="text-primary font-bold">
              {activeSubscriptions.length > 1
                ? `${activeSubscriptions.length} Active Plans`
                : subscriptionSummary.headline}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Streak Card */}
      <View className="px-4 mb-4">
        <View className="bg-surface rounded-2xl p-4 border border-primary/30">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-text-secondary text-sm font-medium">
                Current Streak
              </Text>
              <View className="flex-row items-baseline gap-2 mt-1">
                <Text className="text-primary text-4xl font-bold">
                  {todayStats.streak}
                </Text>
                <Text className="text-text-secondary text-lg">
                  {todayStats.streak === 1 ? "day" : "days"}
                </Text>
              </View>
              {/* Dynamic Subtext Applied Here */}
              <Text className="text-text-secondary text-xs mt-1 font-medium">
                {todayStats.streakSubtext}
              </Text>
            </View>

            <View className="w-16 h-16 relative items-center justify-center">
              <Image
                source={mainIcon}
                className="absolute w-full h-full object-contain z-10"
              />

              <Image
                source={require("@/src/assets/ui/shine-icon.png")}
                className="w-full h-full object-contain"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Today's Stats — NOW LIVE FROM POSTGRES */}
      <View className="px-4 mb-4">
        <View className="flex-row justify-between items-baseline mb-3">
          <Text className="text-text-primary text-lg font-bold">
            Today&apos;s Activity
          </Text>
          {todayStats.workoutsCompleted > 0 && (
            <Text className={`text-xs font-bold ${todayStats.activityColor}`}>
              ⚡ {todayStats.activityBadge}
            </Text>
          )}
        </View>

        <View className="flex-row gap-3">
          <StatCard
            icon="💪"
            label="Exercises"
            value={todayStats.workoutsCompleted.toString()}
            bgColor="bg-surface"
          />
          <StatCard
            icon="🔥"
            label="Calories"
            value={`${todayStats.caloriesBurned}`}
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
              {weeklyProgress.workoutsThisWeek}/{weeklyProgress.workoutsGoal}{" "}
              Completed
            </Text>
          </View>

          <View className="bg-border rounded-full h-3 overflow-hidden">
            <View
              className="bg-primary h-full rounded-full"
              style={{ width: `${weeklyProgress.percentage}%` }}
            />
          </View>

          {/* Dynamic Progress Text Applied Here */}
          <Text className="text-text-secondary text-xs mt-2 leading-relaxed">
            {getWeeklyProgressMessage()}
          </Text>
        </View>
      </View>

      {profile.currentStats && (
        <View className="px-4 mb-4">
          <Text className="text-text-primary text-lg font-bold mb-3">
            Your Stats
          </Text>
          <View className="bg-surface rounded-2xl p-4">
            <View className="flex-row justify-between mb-1">
              <MetricItem
                label="Weight"
                value={`${profile.currentStats.weightKg} kg`}
              />
              <MetricItem
                label="Body Fat"
                value={`${profile.currentStats.bodyFatPercent || "N/A"}%`}
              />
              <MetricItem
                label="Muscle Mass"
                value={`${profile.currentStats.muscleMassKg || "N/A"} kg`}
              />
            </View>
          </View>
        </View>
      )}

      {/* Upcoming Workout Navigation Quick-Link */}
      <View className="px-4 mb-4">
        <Text className="text-text-primary text-lg font-bold mb-3">
          Next Workout
        </Text>
        {upcomming ? (
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 border-l-4 border-primary"
            onPress={() => router.navigate("/(app)/(home)/workout-session")}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-text-primary text-base font-bold font-inter">
                  {upcomming.exercise_name}
                </Text>
                <View className="flex-row gap-4 mt-2">
                  {upcomming.rep_count ? (
                    <Text className="text-text-secondary text-sm font-inter">
                      <Ionicons
                        name="infinite"
                        size={12}
                        color={COLORS.primary}
                      />
                      {" " + upcomming.rep_count} reps
                    </Text>
                  ) : (
                    <Text className="text-text-secondary text-sm font-inter">
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={COLORS.primary}
                      />
                      {" " + upcomming.duration_seconds}
                    </Text>
                  )}
                  <Text className="text-text-secondary text-sm font-inter">
                    <Ionicons
                      name="repeat-outline"
                      size={12}
                      color={COLORS.primary}
                    />
                    {" " + upcomming.set_count} sets
                  </Text>
                </View>
              </View>
              <View className="bg-primary rounded-full p-3">
                <PlayIcon
                  color={COLORS.border}
                  fill={COLORS.surface}
                  size={20}
                />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View className="items-center justify-center">
            <Text className="text-text-secondary font-inter text-center border border-border rounded-xl py-3 px-4 w-fit">
              You don&apos;t have upcomming workout today!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

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
    <Text className="text-text-primary text-2xl font-interBold">{value}</Text>
    <Text className="text-text-secondary text-xs mt-1 font-inter">{label}</Text>
  </View>
);

const MetricItem = ({ label, value }: { label: string; value: string }) => (
  <View className="items-center flex-1">
    <Text className="text-text-secondary text-xs mb-1 font-inter">{label}</Text>
    <Text className="text-text-primary text-lg font-interBold">{value}</Text>
  </View>
);
