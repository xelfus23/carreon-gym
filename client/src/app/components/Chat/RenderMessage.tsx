import { View, TouchableOpacity } from "react-native";
import React from "react";
import { RotateCw, ThumbsUp, ThumbsDown, CopyIcon } from "lucide-react-native"; // Added icons
import { COLORS } from "@/src/consts/colors";
import Markdown from "react-native-markdown-display";
import ThinkingBlock from "./ThinkingBlock";
import { parseResponse } from "@/src/utils/parseChatResponse";

export default function renderMessageItem({ item }: { item: any }) {
    const isUser = item.role === "user";
    const { thought, content, isThinking } = isUser
        ? { thought: null, content: item.content, isThinking: false }
        : parseResponse(item.content);

    return (
        <View
            className={`mb-2 ${isUser ? "items-end mb-4" : "items-start"} gap-2`}
        >
            <View
                className={`rounded-2xl ${
                    isUser ? "px-4 bg-surface max-w-[85%]" : ""
                }`}
            >
                {!isUser && (content === "" || thought) && (
                    <ThinkingBlock
                        thought={thought || ""}
                        isThinking={isThinking || false}
                    />
                )}

                {content ? (
                    <Markdown
                        style={{
                            body: {
                                color: COLORS.textSecondary,
                                paddingVertical: 2
                            },
                            heading1: { color: COLORS.textPrimary },
                            code_block: {
                                backgroundColor: "#1a1a1a",
                                padding: 10,
                                borderRadius: 8,
                            },
                        }}
                    >
                        {content}
                    </Markdown>
                ) : null}
            </View>
            {!isUser && !isThinking && (
                <View className="flex flex-row gap-4 pl-4">
                    <TouchableOpacity>
                        <ThumbsUp color={COLORS.textSecondary} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <ThumbsDown color={COLORS.textSecondary} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <RotateCw color={COLORS.textSecondary} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <CopyIcon color={COLORS.textSecondary} size={18} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
