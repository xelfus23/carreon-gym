import { Text, View } from "react-native";

export default function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <View className="bg-background rounded-xl p-4 flex-1 min-w-[30%] border border-border">
      <Text className="text-text-secondary text-xs mb-1">{label}</Text>
      <Text className="text-text-primary text-xl font-bold">
        {value !== null && value !== undefined
          ? `${value}${unit}`
          : "N/A"}
      </Text>
    </View>
  );
}
