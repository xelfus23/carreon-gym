import { View, ScrollView, Text, Image } from "react-native";
import React from "react";
import Markdown from "react-native-markdown-display";
import { ChatMessage } from "@/src/types/chats";
import { markdownStyle } from "@/src/consts/markdownStyle";
import { COLORS } from "@/src/consts/colors";
import { Check } from "lucide-react-native";

const isCompletedStatus = (status: string) =>
  status === "Complete" ||
  status === "Done" ||
  status.startsWith("Done ");

export default function renderMessageItem({ item }: { item: ChatMessage }) {
  const isUser = item.role === "user";
  const content = item.content || "";
  const status = item.aiStatus;
  const showStatus = !isUser && !!status;
  const isDone = isCompletedStatus(status ?? "");

  return (
    <View className={`mb-4 ${isUser ? "items-end" : "items-start"} px-4`}>
      <View
        className={
          isUser ? "bg-surface px-4 rounded-2xl max-w-[85%]" : "w-full"
        }
      >
        {showStatus && (
          <View className="flex-row items-center gap-2 opacity-80 mb-2">
            {isDone ? (
              <Check size={14} color={COLORS.primary} />
            ) : (
              <Image
                source={require("../../../assets/ui/star-icon.png")}
                resizeMode="contain"
                className="w-3.5 h-3.5 animate-spin"
                style={{ tintColor: COLORS.primary }}
              />
            )}
            <Text
              className={`text-text-secondary text-xs font-interMedium ${isDone ? "" : "animate-pulse"}`}
            >
              {status}
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
