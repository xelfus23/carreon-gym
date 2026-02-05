import { useEffect, useState } from "react";
import {
    Image,
    LayoutAnimation,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "@/src/consts/colors";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import { ThinkingProps } from "@/src/types/chats";

export default function ThinkingBlock({
    thought,
    isThinking,
    status,
}: ThinkingProps) {
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
                            {status
                                ? status.replace(/_/g, " ") // e.g. generating_workout → "generating workout"
                                : "Thinking..."}
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
                                    // Body text
                                    body: {
                                        color: COLORS.textSecondary,
                                        fontSize: 12,
                                        lineHeight: 22,
                                        fontStyle: "italic",
                                    },

                                    // Headings
                                    heading1: {
                                        color: COLORS.textPrimary,
                                        fontSize: 28,
                                        fontWeight: "bold",
                                        marginTop: 20,
                                        marginBottom: 12,
                                    },
                                    heading2: {
                                        color: COLORS.textPrimary,
                                        fontSize: 24,
                                        fontWeight: "bold",
                                        marginTop: 16,
                                        marginBottom: 10,
                                    },
                                    heading3: {
                                        color: COLORS.textPrimary,
                                        fontSize: 20,
                                        fontWeight: "600",
                                        marginTop: 14,
                                        marginBottom: 8,
                                    },
                                    heading4: {
                                        color: COLORS.textPrimary,
                                        fontSize: 18,
                                        fontWeight: "600",
                                        marginTop: 12,
                                        marginBottom: 6,
                                    },
                                    heading5: {
                                        color: COLORS.textPrimary,
                                        fontSize: 16,
                                        fontWeight: "600",
                                    },
                                    heading6: {
                                        color: COLORS.textPrimary,
                                        fontSize: 15,
                                        fontWeight: "600",
                                    },

                                    // Paragraph
                                    paragraph: {
                                        flexWrap: "wrap",
                                        flexDirection: "row",
                                        alignItems: "flex-start",
                                        justifyContent: "flex-start",
                                    },

                                    // Text styles
                                    strong: {
                                        color: COLORS.textPrimary,
                                        fontWeight: "bold",
                                    },
                                    em: {
                                        fontStyle: "italic",
                                    },
                                    s: {
                                        textDecorationLine: "line-through",
                                    },

                                    // Links
                                    link: {
                                        color: COLORS.primary || "#007AFF",
                                        textDecorationLine: "underline",
                                    },

                                    // Code
                                    code_inline: {
                                        backgroundColor: COLORS.surface,
                                        color: COLORS.textPrimary,
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                        fontSize: 14,
                                        fontFamily: "monospace",
                                    },
                                    code_block: {
                                        backgroundColor: COLORS.surface,
                                        padding: 12,
                                        borderRadius: 8,
                                        fontSize: 14,
                                        fontFamily: "monospace",
                                        color: COLORS.textPrimary,
                                        marginVertical: 8,
                                    },
                                    fence: {
                                        backgroundColor: COLORS.surface,
                                        padding: 12,
                                        borderRadius: 8,
                                        fontSize: 14,
                                        fontFamily: "monospace",
                                        color: COLORS.textPrimary,
                                        marginVertical: 8,
                                    },

                                    // Lists
                                    bullet_list: {
                                        marginVertical: 8,
                                    },
                                    ordered_list: {
                                        marginVertical: 8,
                                    },
                                    list_item: {
                                        flexDirection: "row",
                                        marginBottom: 6,
                                    },
                                    bullet_list_icon: {
                                        color: COLORS.textSecondary,
                                        fontSize: 14,
                                        marginRight: 8,
                                        marginTop: 4,
                                    },
                                    ordered_list_icon: {
                                        color: COLORS.textSecondary,
                                        fontSize: 14,
                                        marginRight: 8,
                                    },

                                    // Blockquote
                                    blockquote: {
                                        backgroundColor: COLORS.surface,
                                        borderLeftWidth: 4,
                                        borderLeftColor: COLORS.primary,
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        marginVertical: 8,
                                        borderRadius: 4,
                                    },

                                    // Horizontal Rule
                                    hr: {
                                        backgroundColor: COLORS.border,
                                        height: 1,
                                        marginVertical: 16,
                                    },

                                    // Table styles
                                    table: {
                                        borderWidth: 1,
                                        borderColor: COLORS.surface,
                                        borderRadius: 12,
                                        overflow: "hidden",
                                    },
                                    thead: {
                                        backgroundColor: COLORS.surface,
                                        borderTopLeftRadius: 12,
                                        borderTopRightRadius: 12,
                                    },
                                    tbody: {
                                        backgroundColor: "transparent",
                                        borderBottomLeftRadius: 12,
                                        borderBottomRightRadius: 12,
                                    },
                                    th: {
                                        width: 120,
                                        borderRightWidth: 1,
                                        borderBottomWidth: 1,
                                        borderColor: COLORS.border,
                                        paddingVertical: 10,
                                        paddingHorizontal: 12,
                                    },
                                    tr: {
                                        flexDirection: "row",
                                        borderBottomWidth: 1,
                                        borderColor: COLORS.border,
                                    },
                                    td: {
                                        width: 120,
                                        borderRightWidth: 1,
                                        borderColor: COLORS.border,
                                        paddingVertical: 10,
                                        paddingHorizontal: 12,
                                    },
                                }}
                                rules={{
                                    table: (node, children, parent, styles) => (
                                        <ScrollView
                                            key={node.key}
                                            horizontal
                                            showsHorizontalScrollIndicator={
                                                true
                                            }
                                            style={{ flexGrow: 0 }}
                                        >
                                            <View
                                                style={[
                                                    styles.table,
                                                    { width: "100%" },
                                                ]}
                                            >
                                                {children}
                                            </View>
                                        </ScrollView>
                                    ),
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
