import { useEffect, useState } from "react";
import {
    Image,
    LayoutAnimation,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "@/src/consts/colors";
import { ChevronDown, ChevronUp } from "lucide-react-native";

export default function ThinkingBlock({
    thought,
    isThinking,
}: {
    thought: string;
    isThinking: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!isThinking) {
            LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
            );
            setExpanded(false);
        }
    }, [isThinking]);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View className="mb-2 border-l-2 border-primary-dark bg-surface rounded-lg overflow-hidden w-full">
            <TouchableOpacity
                onPress={toggle}
                className="flex-row items-center justify-between gap-2 pl-4 pr-2 py-2 w-full"
            >
                <View className="flex-row items-center gap-2">
                    <Image
                        source={require("../../../assets/ui/star-icon.png")}
                        resizeMode="contain"
                        resizeMethod="auto"
                        className={`w-4 aspect-square ${isThinking ? "animate-spin" : "animate-none"}`}
                    />
                    <Text
                        className={`text-text-secondary text-xs font-bold ${isThinking ? "animate-pulse" : "animate-none"}`}
                    >
                        {isThinking ? "Thinking..." : "Assistant thoughts"}
                    </Text>
                </View>
                {expanded ? (
                    <ChevronUp size={16} color={COLORS.textSecondary} />
                ) : (
                    <ChevronDown size={16} color={COLORS.textSecondary} />
                )}
            </TouchableOpacity>

            {expanded && (
                <View className="p-2">
                    <Text className="text-text-secondary text-xs bg-background p-2 rounded-md italic leading-5">
                        {thought}
                    </Text>
                </View>
            )}
        </View>
    );
}
