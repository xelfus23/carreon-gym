import { View, TouchableOpacity, ScrollView } from "react-native";
import React from "react";
import { RotateCw, ThumbsUp, ThumbsDown, CopyIcon } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import Markdown from "react-native-markdown-display";
import ThinkingBlock from "./ThinkingBlock";
import { parseResponse } from "@/src/utils/parseChatResponse";
import { ChatMessage } from "@/src/types/chats";
import { markdownStyle } from "@/src/consts/markdownStyle";

export default function renderMessageItem({ item }: { item: ChatMessage }) {
    const isUser = item.role === "user";

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
                        style={markdownStyle as any}
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
