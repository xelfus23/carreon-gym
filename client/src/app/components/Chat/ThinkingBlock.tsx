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
import Markdown from "react-native-markdown-display";
import { ThinkingProps } from "@/src/types/chats";

export default function ThinkingBlock({ thought, isThinking }: ThinkingProps) {
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
        <View className="mb-2 border-l-2 border-primary-dark rounded-lg overflow-hidden">
            <View className="">
                <TouchableOpacity
                    onPress={toggle}
                    className={`flex-row items-center max-w-48 justify-between ${expanded ? "rounded-t-xl" : "rounded-xl"} gap-2 pl-4 pr-2 py-2 bg-surface`}
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
                    <View className="p-2 w-full bg-surface rounded-b-xl rounded-tr-xl">
                        <View className="px-2 bg-background rounded-md">
                            <Markdown
                                style={{
                                    body: {
                                        color: COLORS.textSecondary,
                                        fontSize: 12,
                                        fontStyle: "italic",
                                    },
                                    strong: {
                                        color: COLORS.textPrimary,
                                    },
                                    code_block: {
                                        backgroundColor: COLORS.surface,
                                        padding: 10,
                                        borderRadius: 8,
                                    },

                                    //========TABLE==========
                                    table: {},
                                    thead: {},
                                    tbody: {},
                                    th: {},
                                    tr: {},
                                    td: {},

                                    //======HEADINGS==========
                                    heading1: {
                                        color: COLORS.textPrimary,
                                    },
                                    heading2: {
                                        color: COLORS.textPrimary,
                                    },
                                    heading3: {
                                        color: COLORS.textPrimary,
                                    },
                                    heading4: {
                                        color: COLORS.textPrimary,
                                    },
                                }}
                            >
                                {thought}
                            </Markdown>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}
