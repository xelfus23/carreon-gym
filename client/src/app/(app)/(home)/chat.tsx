import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    UIManager,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from "react-native";
import React, { useRef, useState } from "react";
import { Send, ArrowDown } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import { useHeaderHeight } from "@react-navigation/elements";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useChat } from "@/src/hooks/useChats";
import renderMessageItem from "../../components/Chat/RenderMessage";
import { ChatMessage } from "@/src/types/chats";

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Chats() {
    const { messages, sendMessage, loading } = useChat();
    const [text, setText] = useState("");
    const headerHeight = useHeaderHeight();
    const scrollRef = useRef<FlatList<ChatMessage>>(null);
    const isAtBottom = useRef(true);

    const handleSend = async () => {
        if (!text.trim()) return;
        const prompt = text;
        setText("");
        try {
            await sendMessage(prompt);
        } catch (err) {
            if (err instanceof Error) {
                console.error("Unable to send message:", err.message);
            }
        }
    };

    const [showScrollButton, setShowScrollButton] = useState(false);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;

        const paddingToBottom = 20;
        const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;

        isAtBottom.current = isCloseToBottom;
        setShowScrollButton(!isCloseToBottom);
    };

    const handleContentSizeChange = () => {
        // Only auto-scroll if the user was already at the bottom
        if (isAtBottom.current) {
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        scrollRef.current?.scrollToEnd({ animated: true });
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                className="bg-background"
                behavior="padding"
                keyboardVerticalOffset={
                    Platform.OS === "ios" ? 90 : headerHeight
                }
            >
                <View className="flex-1">
                    <View className="flex-1 bg-background relative">
                        <FlatList
                            ref={scrollRef}
                            data={messages}
                            keyExtractor={(item, index) =>
                                item.timestamp.toString() + item.id
                            }
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            onContentSizeChange={handleContentSizeChange}
                            onLayout={handleContentSizeChange}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <Text className="text-text-secondary text-center mt-10">
                                    Start a conversation...
                                </Text>
                            }
                            renderItem={renderMessageItem}
                        />

                        {showScrollButton && (
                            <TouchableOpacity
                                onPress={() => {
                                    isAtBottom.current = true;
                                    scrollToBottom();
                                }}
                                className="absolute bottom-4 right-4 bg-surface p-2 rounded-full border border-white/10 shadow-lg"
                            >
                                <ArrowDown
                                    size={20}
                                    color={COLORS.textPrimary}
                                />
                            </TouchableOpacity>
                        )}

                        <View className="flex-row gap-2 p-4 items-center bg-background border-t border-white/10">
                            <TextInput
                                value={text}
                                onChangeText={setText}
                                className="flex-1 text-lg bg-surface rounded-xl text-white px-4 py-3 min-h-[50px] max-h-[100px]"
                                placeholder="Message..."
                                placeholderTextColor={COLORS.textSecondary}
                                returnKeyType="send"
                                multiline
                                onSubmitEditing={handleSend}
                            />

                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={loading}
                                className={`p-3 ${
                                    loading || !text.trim()
                                        ? "bg-surface opacity-50"
                                        : "bg-primary-dark"
                                } rounded-full items-center justify-center`}
                            >
                                <Send color="white" size={24} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}
