import { View, TouchableOpacity, ScrollView, Text } from "react-native";
import React from "react";
import { RotateCw, ThumbsUp, ThumbsDown, CopyIcon } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import Markdown from "react-native-markdown-display";
import ThinkingBlock from "./ThinkingBlock";
import { parseResponse } from "@/src/utils/parseChatResponse";
import { ChatMessage } from "@/src/types/chats";

export default function renderMessageItem({ item }: { item: ChatMessage }) {
    const isUser = item.role === "user";
    const isTool = item.role === "tool";


    let parsedContent = item.content;

    if (!isUser && item.content) {
        const parseResult = parseResponse(item.content);
        parsedContent = parseResult.content;
    }

    const content = parsedContent || "";

    return (
        <View
            className={`mb-2 ${isUser ? "items-end" : "items-start w-full"} gap-2 p-4`}
        >
            <View
                className={`rounded-2xl ${
                    isUser
                        ? "px-4 bg-surface max-w-[85%]"
                        : "mr-0 bg-transparent"
                }`}
            >
                {!isUser && <ThinkingBlock status={item.aiStatus! || "Done"} />}

                {content ? (
                    <Markdown
                        style={{
                            // Body text
                            body: {
                                color:
                                    content === " An error has occured."
                                        ? COLORS.danger
                                        : COLORS.textSecondary,
                                fontSize: 15,
                                lineHeight: 22,
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
                                    showsHorizontalScrollIndicator={true}
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
                        {content}
                    </Markdown>
                ) : null}
            </View>
            {!isUser && (
                <View className="flex flex-row gap-4 pl-4">
                    <TouchableOpacity>
                        <ThumbsUp color={COLORS.textSecondary} size={14} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <ThumbsDown color={COLORS.textSecondary} size={14} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <RotateCw color={COLORS.textSecondary} size={14} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <CopyIcon color={COLORS.textSecondary} size={14} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
