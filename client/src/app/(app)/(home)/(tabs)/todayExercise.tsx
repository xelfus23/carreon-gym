import { COLORS } from "@/src/consts/colors";
import ExerciseDetailModal from "@/src/app/components/Plans/ExerciseDetailModal";
import { useWorkout } from "@/src/hooks/useWorkout";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState, useMemo } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { formatDate } from "@/src/utils/formatDate";
import { getCustomLoader } from "@/src/app/components/CustomRefreshControl";
import { SessionExerciseProps } from "@/src/types/workout";

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

// ─── Exercise Card ────────────────────────────────────────────────────────────

type ExerciseCardProps = {
  ex: SessionExerciseProps;
  checked: boolean;
  onPress?: () => void;
};

export function ExerciseCard({ ex, checked, onPress }: ExerciseCardProps) {
  const isTimed = ex.duration_seconds != null && ex.rep_count == null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={checked}
      activeOpacity={0.7}
      className={`mb-3 rounded-2xl border p-4 flex-row items-center gap-4 ${
        checked
          ? "bg-surface/50 border-green-500/20"
          : "bg-surface border-border"
      }`}
    >
      <View
        className={`w-12 h-12 rounded-2xl items-center justify-center ${
          checked ? "bg-green-500/10" : "bg-primary/10"
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
          className={`text-base font-semibold ${
            checked ? "text-text-secondary line-through" : "text-text-primary"
          }`}
          numberOfLines={1}
        >
          {ex.exercise_name || "Unknown Exercise"}
        </Text>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-text-secondary text-xs font-medium">
            {isTimed
              ? `${ex.duration_seconds}s`
              : `${ex.set_count ?? 0} sets × ${ex.rep_count ?? 0} reps`}
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

// ─── Session Progress Bar ─────────────────────────────────────────────────────

type SessionProgressBarProps = {
  done: number;
  total: number;
  todayDate: string;
  selectedDate: string;
};

function SessionProgressBar({
  done,
  total,
  todayDate,
  selectedDate,
}: SessionProgressBarProps) {
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

  return (
    <View className="px-4 pb-3">
      {/* Label row */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {isComplete
            ? "Session complete 🎉"
            : `${
                todayDate === selectedDate
                  ? "Today's"
                  : formatDate(selectedDate, {
                      month: "short",
                      day: "2-digit",
                    })
              } Progress`}
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

function CalendarStrip({
  selectedDate,
  activeDates,
  onSelectDate,
}: CalendarStripProps) {
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
      contentContainerClassName="gap-2 px-4 pb-4"
      renderItem={({ item }) => {
        const isSelected = item.dateStr === selectedDate;
        const isToday = item.dateStr === todayStr;
        const hasExercises = activeDates.has(item.dateStr);

        return (
          <TouchableOpacity
            onPress={() => onSelectDate(item.dateStr)}
            activeOpacity={0.7}
            className={`items-center w-16 py-2 rounded-2xl ${
              isSelected
                ? "bg-primary-dark"
                : isToday
                  ? "bg-primary/10"
                  : "bg-surface"
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
              className="rounded-full mt-1 h-1.5 aspect-square"
              style={{
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
  const {
    workoutSessions,
    isExerciseChecked,
    refreshWorkoutSessions,
    isLoading,
  } = useWorkout();

  const todayStr = formatLocalDate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [refreshing, setRefreshing] = useState(false);

  // Sessions that have exercises on the selected date
  const activeDates = useMemo(() => {
    const set = new Set<string>();
    workoutSessions.forEach((session) => {
      if (session.exercises?.length > 0) {
        set.add(formatLocalDate(new Date(session.session_date)));
      }
    });
    return set;
  }, [workoutSessions]);

  const selectedExercises = useMemo(() => {
    return workoutSessions
      .filter((s) => formatLocalDate(new Date(s.session_date)) === selectedDate)
      .flatMap((s) =>
        s.exercises.map((ex) => ({
          ...ex,
          sessionId: s.id,
          sessionTitle: s.title,
        })),
      );
  }, [workoutSessions, selectedDate]);

  const incomplete = selectedExercises.filter(
    (ex) => !isExerciseChecked(ex.sessionId, ex.exercise_id),
  );

  const completed = selectedExercises.filter((ex) =>
    isExerciseChecked(ex.sessionId, ex.exercise_id),
  );

  const [detailModal, setDetailModal] = useState<{
    visible: boolean;
    exercise: SessionExerciseProps | null;
    sessionId: number | null;
  }>({ visible: false, exercise: null, sessionId: null });

  const openDetail = useCallback((ex: (typeof selectedExercises)[number]) => {
    setDetailModal({ visible: true, exercise: ex, sessionId: ex.sessionId });
  }, []);

  const closeDetail = useCallback(() => {
    setDetailModal({ visible: false, exercise: null, sessionId: null });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshWorkoutSessions();
    } finally {
      setRefreshing(false);
    }
  }, [refreshWorkoutSessions]);

  const isToday = selectedDate === todayStr;

  return (
    <>
      <View className="flex-1 bg-background">
        <View className="bg-background pt-4 border-b border-border/40">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-2xl font-bold text-text-primary">
              {isToday
                ? "Today's Session"
                : new Date(selectedDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
            </Text>
          </View>

          <SessionProgressBar
            done={completed.length}
            total={selectedExercises.length}
            selectedDate={selectedDate}
            todayDate={todayStr}
          />
          <CalendarStrip
            selectedDate={selectedDate}
            activeDates={activeDates}
            onSelectDate={setSelectedDate}
          />
        </View>

        {isLoading && !refreshing ? (
          <View className="items-center justify-center py-16">
            <Ionicons
              name="barbell-outline"
              size={48}
              color={COLORS.textSecondary}
            />
            <Text className="text-text-secondary text-base mt-3 font-medium">
              Loading workouts...
            </Text>
          </View>
        ) : selectedExercises.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons
              name="calendar-outline"
              size={48}
              color={COLORS.textSecondary}
            />
            <Text className="text-text-secondary text-base mt-3 font-medium">
              No exercises scheduled
            </Text>
            <Text className="text-text-secondary/60 text-sm mt-1">
              {isToday ? "Enjoy your rest day!" : "No session for this day."}
            </Text>
          </View>
        ) : (
          <>
            <SectionHeader
              title="To Do"
              count={incomplete.length}
              accent={COLORS.primary}
            />
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4"
              refreshControl={getCustomLoader(
                refreshing,
                refreshWorkoutSessions,
              )}
            >
              {incomplete.length === 0 ? (
                <View className="items-center py-6">
                  <Ionicons
                    name="checkmark-circle"
                    size={36}
                    color={COLORS.primary}
                  />
                  <Text className="text-text-secondary text-sm mt-2">
                    All done for today!
                  </Text>
                </View>
              ) : (
                incomplete.map((ex) => (
                  <ExerciseCard
                    key={ex.exercise_id}
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
                    <ExerciseCard key={ex.exercise_id} ex={ex} checked={true} />
                  ))}
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>

      <ExerciseDetailModal
        visible={detailModal.visible}
        sessionId={detailModal.sessionId}
        exercise={detailModal.exercise}
        onClose={closeDetail}
      />
    </>
  );
}
