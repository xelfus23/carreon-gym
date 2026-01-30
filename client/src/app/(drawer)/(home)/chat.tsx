import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
    UIManager,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Send,
    ChevronDown,
    ChevronUp,
    ArrowDown,
    RotateCw,
    ThumbsUp,
    ThumbsDown,
    CopyIcon,
} from "lucide-react-native"; // Added icons
import { COLORS } from "@/src/consts/colors";
import { useHeaderHeight } from "@react-navigation/elements";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useChat } from "@/src/hooks/useChats";
import Loader from "../../components/Loader";
import Markdown from "react-native-markdown-display";

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type MessageTypes = {
    text: string;
    role: "assistant" | "user";
    timestamp: number;
};

const parseDeepSeekResponse = (rawContent: string) => {
    if (!rawContent.startsWith("[THINK]")) {
        return { thought: null, content: rawContent };
    }

    const endTag = "[/THINK]";
    const endIndex = rawContent.indexOf(endTag);

    if (endIndex === -1) {
        return {
            thought: rawContent.replace("[THINK]", "").trim(),
            content: "",
            isThinking: true,
        };
    }

    const thought = rawContent
        .substring(0, endIndex)
        .replace("[THINK]", "")
        .trim();
    const content = rawContent.substring(endIndex + endTag.length).trim();

    return { thought, content, isThinking: false };
};

const ThinkingBlock = ({
    thought,
    isThinking,
}: {
    thought: string;
    isThinking: boolean;
}) => {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!isThinking) {
            LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
            );
            setExpanded(false);
        }
    }, [isThinking]);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View className="mb-2 border-l-2 border-primary bg-surface rounded-lg overflow-hidden w-full">
            <TouchableOpacity
                onPress={toggle}
                className="flex-row items-center justify-between gap-2 pl-4 pr-2 py-2"
            >
                <View className="flex-row items-center gap-2">
                    <Text className="text-text-secondary text-xs font-bold">
                        {isThinking ? "Thinking..." : "Thoughts"}
                    </Text>
                    {isThinking && <Loader size={14} />}
                </View>
                {expanded ? (
                    <ChevronUp size={16} color={COLORS.textSecondary} />
                ) : (
                    <ChevronDown size={16} color={COLORS.textSecondary} />
                )}
            </TouchableOpacity>

            {expanded && (
                <View className="p-2">
                    <Text className="text-text-secondary text-xs italic leading-5">
                        {thought}
                    </Text>
                </View>
            )}
        </View>
    );
};

export default function Chats() {
    const { messages, sendMessage, loading } = useChat("1");
    const [text, setText] = useState("");
    const headerHeight = useHeaderHeight();
    const scrollRef = useRef<FlatList<MessageTypes>>(null);
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

    // --- 3. Custom Render Item ---
    const renderMessageItem = ({ item }: { item: any }) => {
        const isUser = item.role === "user";
        const { thought, content, isThinking } = isUser
            ? { thought: null, content: item.content, isThinking: false }
            : parseDeepSeekResponse(item.content);

        return (
            <View
                className={`mb-2 ${isUser ? "items-end" : "items-start"} gap-2`}
            >
                <View
                    className={`rounded-2xl ${
                        isUser ? "px-4 bg-surface max-w-[85%]" : ""
                    }`}
                >
                    {!isUser && thought && (
                        <ThinkingBlock
                            thought={thought}
                            isThinking={isThinking}
                        />
                    )}

                    {content ? (
                        <Markdown
                            style={{
                                body: {
                                    color: COLORS.textSecondary,
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
                            <ThumbsDown
                                color={COLORS.textSecondary}
                                size={18}
                            />
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
                                item.timestamp.toString() + index
                            }
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            onContentSizeChange={handleContentSizeChange}
                            onLayout={handleContentSizeChange}
                            contentContainerClassName="p-4 pb-20"
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
