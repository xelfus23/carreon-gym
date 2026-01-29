import { View, Text } from "react-native";
import React from "react";

interface ChatBubbleProps {
    text: string;
    role: "user" | "assistant";
    index: number;
}

export default function ChatBubble({ text, role, index }: ChatBubbleProps) {
    const isUser = role === "user";

    return (
        <View
            className={
                isUser ? "bg-blue-500 self-end" : "bg-gray-700 self-start"
            }
        >
            <Text className={isUser ? "text-white" : "text-gray-100"}>
                {text}
            </Text>
        </View>
    );
}
