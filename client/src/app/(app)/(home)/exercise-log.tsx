import { useWorkout } from "@/src/hooks/useWorkout";
import { ScrollView, Text, View } from "react-native";

export default function ExerciseLogsScreen() {
    const { allLogs } = useWorkout();

    return (
        <ScrollView className="flex-1 bg-background p-4">
            <Text className="text-2xl font-bold mb-4">Activity History</Text>
            {allLogs.map((log) => (
                <View
                    key={log.id}
                    className="bg-surface p-4 rounded-xl mb-2 border border-border"
                >
                    <Text className="font-bold text-text-primary">
                        {log.session_exercise_id}
                    </Text>
                    <View className="flex-row justify-between mt-1">
                        <Text className="text-xs text-text-secondary">
                            {new Date(log.logged_at).toLocaleDateString()}
                        </Text>
                        <Text className="text-xs font-medium text-primary">
                            {log.weight_used_kg}kg | {log.completed_reps} reps
                        </Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}
