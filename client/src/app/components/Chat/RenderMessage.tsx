import { View, ScrollView, Text, Image } from "react-native";
import React from "react";
import Markdown from "react-native-markdown-display";
import { ChatMessage } from "@/src/types/chats";
import { markdownStyle } from "@/src/consts/markdownStyle";
import { COLORS } from "@/src/consts/colors";

export default function renderMessageItem({ item }: { item: ChatMessage }) {
  const isUser = item.role === "user";
  const content = item.content || "";
  const status = item.aiStatus;
  const showStatus = !isUser && !!status && status !== "Done";

  return (
    <View className={`mb-4 ${isUser ? "items-end" : "items-start"} px-4`}>
      <View
        className={
          isUser ? "bg-surface px-4 py-2 rounded-2xl max-w-[85%]" : "w-full"
        }
      >
        {showStatus && (
          <View className="flex-row items-center gap-2 opacity-70 mb-1">
            <Image
              source={require("../../../assets/ui/star-icon.png")}
              resizeMode="contain"
              className="w-3.5 h-3.5 animate-spin"
              style={{ tintColor: COLORS.primary }}
            />
            <Text className="text-text-secondary text-[10px] font-bold uppercase tracking-wider animate-pulse">
              {status.replace(/_/g, " ")}
            </Text>
          </View>
        )}

        {content.length > 0 && (
          <View>
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
