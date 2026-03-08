import { View, Text, TouchableOpacity } from "react-native";

type Props = {
    value: string;
    onChange: (value: string) => void;
};

export default function DifficultySelector({ value, onChange }: Props) {
    return (
        <View>
            <Text className="text-text-secondary text-xs mb-2">
                Difficulty (1 = easy · 10 = max effort)
            </Text>
            <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <TouchableOpacity
                        key={n}
                        onPress={() => onChange(String(n))}
                        className={`w-9 h-9 rounded-lg items-center justify-center border ${
                            value === String(n)
                                ? "bg-primary border-primary"
                                : "border-border bg-background"
                        }`}
                    >
                        <Text
                            className={`text-sm font-bold ${
                                value === String(n)
                                    ? "text-white"
                                    : "text-text-secondary"
                            }`}
                        >
                            {n}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}
