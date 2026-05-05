import { View, ScrollView } from "react-native";
import React from "react";
import Markdown from "react-native-markdown-display";
import ThinkingBlock from "./ThinkingBlock";
import { parseResponse } from "@/src/utils/parseChatResponse";
import { ChatMessage } from "@/src/types/chats";
import { markdownStyle } from "@/src/consts/markdownStyle";

export default function renderMessageItem({ item }: { item: ChatMessage }) {
  console.log(item.content);

  const isUser = item.role === "user";
  let parsedContent = item.content || "";
  let thinkingProcess = "";

  if (!isUser && item.content) {
    const parseResult = parseResponse(item.content);
    const rawContent = parseResult.content;

    const hasOpen = rawContent.includes("<think>");
    const hasClose = rawContent.includes("</think>");

    if (hasOpen && hasClose) {
      // Normal complete case
      const [beforeClose, afterClose] = rawContent.split("</think>");
      thinkingProcess = beforeClose.replace("<think>", "").trim();
      parsedContent = afterClose.trim();
    } else if (hasOpen && !hasClose) {
      // AI is still generating thinking
      const parts = rawContent.split("<think>");
      thinkingProcess = parts[1].trim();
      parsedContent = parts[0].trim();
    } else if (!hasOpen && !hasClose) {
      // 🔥 IMPORTANT: Assume everything is thinking initially
      thinkingProcess = rawContent.trim();
      parsedContent = "";
    } else if (!hasOpen && hasClose) {
      // Edge case: closing tag appears without opening
      const parts = rawContent.split("</think>");
      thinkingProcess = parts[0].trim();
      parsedContent = parts[1].trim();
    }
  }

  const content = parsedContent || "";

  return (
    <View className={`mb-4 ${isUser ? "items-end" : "items-start"} px-4`}>
      <View
        className={
          isUser ? "bg-surface px-4 py-2 rounded-2xl max-w-[85%]" : "w-full"
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
          <View className={!isUser && thinkingProcess.length > 0 ? "mt-2" : ""}>
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
        )}
      </View>
    </View>
  );
}
