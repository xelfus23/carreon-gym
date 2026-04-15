import { View, ScrollView } from "react-native";
import React from "react";
import Markdown from "react-native-markdown-display";
import ThinkingBlock from "./ThinkingBlock";
import { parseResponse } from "@/src/utils/parseChatResponse";
import { ChatMessage } from "@/src/types/chats";
import { markdownStyle } from "@/src/consts/markdownStyle";

export default function renderMessageItem({ item }: { item: ChatMessage }) {
    const isUser = item.role === "user";
    let parsedContent = item.content || "";
    let thinkingProcess = "";

    if (!isUser && item.content) {
        const parseResult = parseResponse(item.content);
        const rawContent = parseResult.content;

        if (rawContent.includes("</think>")) {
            // Logic: If there's a closing tag, everything before it is a thought,
            // regardless of whether there was an opening <think> tag.
            const parts = rawContent.split("</think>");

            // Clean up the first part by removing the <think> tag if it exists
            thinkingProcess = parts[0].replace("<think>", "").trim();
            parsedContent = parts[1].trim();
        } else if (rawContent.includes("<think>")) {
            // Logic: Opening tag exists but no closing tag (AI is still generating)
            const parts = rawContent.split("<think>");
            parsedContent = parts[0].trim();
            thinkingProcess = parts[1].trim();
        } else {
            // Standard response
            parsedContent = rawContent;
        }
    }

    const content = parsedContent || "";

    return (
        <View className={`mb-4 ${isUser ? "items-end" : "items-start"} px-4`}>
            <View
                className={
                    isUser
                        ? "bg-surface px-4 py-2 rounded-2xl max-w-[85%]"
                        : "w-full"
                }
            >
                {/* 1. Reasoning Layer */}
                {!isUser && thinkingProcess.length > 0 && (
                    <ThinkingBlock
                        status={item.aiStatus || "Done"}
                        thought={thinkingProcess}
                    />
                )}

                {/* 2. Main Content Layer */}
                {content.length > 0 && (
                    <View
                        className={
                            !isUser && thinkingProcess.length > 0 ? "mt-2" : ""
                        }
                    >
                        <Markdown
                            style={markdownStyle as any}
                            rules={{
                                table: (node, children, parent, styles) => (
                                    <ScrollView
                                        key={node.key}
                                        horizontal
                                        showsHorizontalScrollIndicator
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
                    </View>
                )}
            </View>
        </View>
    );
}
