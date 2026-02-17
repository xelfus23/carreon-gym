import { Text, View } from "react-native";

export default function InfoRow({
    label,
    value,
    valueColor = "text-text-secondary",
    isLast = false,
}: {
    label: string;
    value: string;
    valueColor?: string;
    isLast?: boolean;
}) {
    return (
        <View
            className={`flex-row justify-between items-center py-3 ${!isLast ? "border-b border-border" : ""}`}
        >
            <Text className="text-text-primary text-sm">{label}</Text>
            <Text className={`${valueColor} text-sm font-medium`}>{value}</Text>
        </View>
    );
}
