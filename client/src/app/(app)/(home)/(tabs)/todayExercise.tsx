import { COLORS } from "@/src/consts/colors";
import ExerciseDetailModal, {
  type ExerciseDetail,
} from "@/src/app/components/Plans/ExerciseDetailModal";
import { useWorkout } from "@/src/hooks/useWorkout";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState, useMemo } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";

// ─── Section Header ───────────────────────────────────────────────────────────

type SectionHeaderProps = {
  title: string;
  count: number;
  accent: string;
};

export function SectionHeader({ title, count, accent }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-4 mt-2 px-4">
      <View className="flex-row items-center gap-2">
        <View className="w-1.5 h-6 rounded-full" style={{ backgroundColor: accent }} />
        <Text className="text-lg font-bold text-text-primary tracking-tight">{title}</Text>
      </View>
      <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${accent}20` }}>
        <Text className="text-xs font-bold" style={{ color: accent }}>{count}</Text>
      </View>
    </View>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

type ExerciseCardProps = {
  ex: any;
  checked: boolean;
  onPress?: () => void;
};

export function ExerciseCard({ ex, checked, onPress }: ExerciseCardProps) {
  const isTimed = ex.duration_seconds != null && ex.reps == null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={checked}
      activeOpacity={0.7}
      className={`mb-3 rounded-2xl border p-4 flex-row items-center gap-4 ${checked ? "bg-surface/50 border-green-500/20" : "bg-surface border-border"
        }`}
    >
      <View
        className={`w-12 h-12 rounded-2xl items-center justify-center ${checked ? "bg-green-500/10" : "bg-primary/10"
          }`}
      >
        {checked ? (
          <Ionicons name="checkmark-done" size={24} color={COLORS.primary} />
        ) : (
          <Ionicons
            name={isTimed ? "timer-outline" : "barbell-outline"}
            size={22}
            color={COLORS.primary}
          />
        )}
      </View>

      <View className="flex-1">
        <Text
          className={`text-base font-semibold ${checked ? "text-text-secondary line-through" : "text-text-primary"
            }`}
          numberOfLines={1}
        >
          {ex.name || "Unknown Exercise"}
        </Text>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-text-secondary text-xs font-medium">
            {isTimed
              ? `${ex.duration_seconds}s`
              : `${ex.sets ?? 0} sets × ${ex.reps ?? 0} reps`}
          </Text>
          <View className="w-1 h-1 rounded-full bg-text-secondary/30" />
          <Text className="text-text-secondary text-xs" numberOfLines={1}>
            {Array.isArray(ex.equipment_name)
              ? ex.equipment_name[0]
              : ex.equipment_name || "Bodyweight"}
          </Text>
        </View>
      </View>

      {!checked && (
        <View className="bg-border/30 rounded-full p-1">
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Session Progress Bar ─────────────────────────────────────────────────────

type SessionProgressBarProps = {
  done: number;
  total: number;
};

function SessionProgressBar({ done, total }: SessionProgressBarProps) {
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const percent = total > 0 ? done / total : 0;
  const isComplete = total > 0 && done === total;

  React.useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: percent,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  }, [percent, progressAnim]);

  const barColor = isComplete ? COLORS.success : COLORS.primary;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (total === 0) return null;

  return (
    <View className="px-4 pb-3">
      {/* Label row */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {isComplete ? "Session complete 🎉" : "Session progress"}
        </Text>
        <Text className="text-xs font-bold" style={{ color: barColor }}>
          {done}/{total}
        </Text>
      </View>

      {/* Track */}
      <View className="h-2 rounded-full bg-surface overflow-hidden">
        <Animated.View
          style={{
            height: "100%",
            width: progressWidth,
            backgroundColor: barColor,
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}

// ─── Calendar Strip ───────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

type CalendarStripProps = {
  selectedDate: string;
  activeDates: Set<string>;
  onSelectDate: (date: string) => void;
};

function CalendarStrip({ selectedDate, activeDates, onSelectDate }: CalendarStripProps) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 15 + i);
      return {
        dateStr: formatLocalDate(d),
        dayLabel: DAY_LABELS[d.getDay()],
        dayNum: d.getDate(),
      };
    });
  }, []);

  const todayStr = formatLocalDate(new Date());
  const todayIndex = days.findIndex((d) => d.dateStr === todayStr);

  return (
    <FlatList
      data={days}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.dateStr}
      initialScrollIndex={todayIndex > 2 ? todayIndex - 2 : 0}
      getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
      renderItem={({ item }) => {
        const isSelected = item.dateStr === selectedDate;
        const isToday = item.dateStr === todayStr;
        const hasExercises = activeDates.has(item.dateStr);

        return (
          <TouchableOpacity
            onPress={() => onSelectDate(item.dateStr)}
            activeOpacity={0.7}
            style={{ width: 52, marginRight: 8 }}
            className={`items-center py-2 rounded-2xl ${isSelected ? "bg-primary" : isToday ? "bg-primary/10" : "bg-surface"
              }`}
          >
            <Text
              className="text-xs font-semibold mb-1"
              style={{ color: isSelected ? "#fff" : COLORS.textSecondary }}
            >
              {item.dayLabel}
            </Text>
            <Text
              className="text-base font-bold"
              style={{ color: isSelected ? "#fff" : COLORS.textPrimary }}
            >
              {item.dayNum}
            </Text>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                marginTop: 4,
                backgroundColor: hasExercises
                  ? isSelected
                    ? "rgba(255,255,255,0.8)"
                    : COLORS.primary
                  : "transparent",
              }}
            />
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TodayWorkoutScreen() {
  const { workoutPlans, isExerciseChecked, refreshWorkoutPlan, isLoading } = useWorkout();

  const todayStr = formatLocalDate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [refreshing, setRefreshing] = useState(false);

  const activePlan = workoutPlans.find((p) => p.is_active);

  const activeDates = useMemo(() => {
    const set = new Set<string>();
    activePlan?.days?.forEach((day) => {
      if (day.exercises?.length > 0) {
        set.add(formatLocalDate(new Date(day.day_date)));
      }
    });
    return set;
  }, [activePlan]);

  const selectedExercises = useMemo(() => {
    return (
      activePlan?.days
        ?.filter((day) => formatLocalDate(new Date(day.day_date)) === selectedDate)
        .flatMap((day) =>
          day.exercises.map((ex) => ({ ...ex, dayId: day.id, dayTitle: day.title })),
        ) || []
    );
  }, [activePlan, selectedDate]);

  const incomplete = selectedExercises.filter((ex) => !isExerciseChecked(ex.dayId, ex.id));
  const completed = selectedExercises.filter((ex) => isExerciseChecked(ex.dayId, ex.id));

  const [detailModal, setDetailModal] = useState<{
    visible: boolean;
    exercise: ExerciseDetail | null;
    dayId: number | null;
  }>({ visible: false, exercise: null, dayId: null });

  const openDetail = useCallback((ex: (typeof selectedExercises)[number]) => {
    setDetailModal({ visible: true, exercise: ex, dayId: ex.dayId });
  }, []);

  const closeDetail = useCallback(() => {
    setDetailModal({ visible: false, exercise: null, dayId: null });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshWorkoutPlan();
    } finally {
      setRefreshing(false);
    }
  }, [refreshWorkoutPlan]);

  const isToday = selectedDate === todayStr;

  return (
    <>
      <View className="flex-1 bg-background">
        {/* Sticky Header: title + progress bar + calendar */}
        <View className="bg-background pt-4 border-b border-border/40">
          {/* Title row */}
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-2xl font-bold text-text-primary">
              {isToday ? "Today's Session" : selectedDate}
            </Text>

          </View>

          {/* Progress bar — hidden when the selected day has no exercises */}
          <SessionProgressBar
            done={completed.length}
            total={selectedExercises.length}
          />

          {/* Calendar strip */}
          <CalendarStrip
            selectedDate={selectedDate}
            activeDates={activeDates}
            onSelectDate={setSelectedDate}
          />
        </View>

        {/* Exercise List */}
        {isLoading && !refreshing ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="barbell-outline" size={48} color={COLORS.textSecondary} />
            <Text className="text-text-secondary text-base mt-3 font-medium">
              Loading workouts...
            </Text>
          </View>
        ) : selectedExercises.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
            <Text className="text-text-secondary text-base mt-3 font-medium">
              No exercises scheduled
            </Text>
            <Text className="text-text-secondary/60 text-sm mt-1">
              {isToday ? "Enjoy your rest day!" : "No plan for this day."}
            </Text>
          </View>
        ) : (
          <>
            <SectionHeader title="To Do" count={incomplete.length} accent={COLORS.primary} />
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                  colors={[COLORS.primary]}
                />
              }
            >
              {incomplete.length === 0 ? (
                <View className="items-center py-6">
                  <Ionicons name="checkmark-circle" size={36} color={COLORS.primary} />
                  <Text className="text-text-secondary text-sm mt-2">All done for today!</Text>
                </View>
              ) : (
                incomplete.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    ex={ex}
                    checked={false}
                    onPress={() => openDetail(ex)}
                  />
                ))
              )}

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
          </>
        )}
      </View>

      <ExerciseDetailModal
        visible={detailModal.visible}
        dayId={detailModal.dayId}
        exercise={detailModal.exercise}
        onClose={closeDetail}
      />
    </>
  );
}