import { View, ScrollView } from "react-native";
import React from "react";
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
            className={`mb-2 ${isUser ? "items-end" : "items-start"} gap-2 px-4 pt-2`}
        >
            <View
                className={`rounded-2xl ${
                    isUser ? "px-4 bg-surface max-w-[80%]" : "bg-transparent px-0 w-full max-w-[100%]"
                }`}
            >
                {!isUser && <ThinkingBlock status={item.aiStatus! || "Done"} />}

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
                                <View style={[styles.table, { width: "100%" }]}>
                                    {children}
                                </View>
                            </ScrollView>
                        ),
                    }}
                >
                    {content}
                </Markdown>
            </View>
        </View>
    );
}
