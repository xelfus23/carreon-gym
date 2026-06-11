import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from "react-native";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Send, ArrowDown } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useChat } from "@/src/hooks/useChats";
import renderMessageItem from "../../../components/Chat/RenderMessage";
import { ChatMessage } from "@/src/types/chats";
import { useFocusEffect } from "expo-router";
import SubscriptionReminder from "@/src/app/components/SubscriptionReminder";
import { useUserProfile } from "@/src/context/profileProvider";
import CustomLoader from "@/src/app/components/Plans/PlansLoading";
import WelcomeScreen from "@/src/app/components/ChatWelcome";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const PROMPT_SUGGESTIONS = [
  {
    id: "1",
    emoji: "🏋️",
    label: "Build a gym program",
    prompt: "Create a gym workout program for me at Carreon Gym.",
  },
  {
    id: "2",
    emoji: "📈",
    label: "Track my progress",
    prompt: "How do I track my strength progress effectively at the gym?",
  },
  {
    id: "3",
    emoji: "🥩",
    label: "Gym diet advice",
    prompt: "What should I eat to fuel my gym sessions and build muscle?",
  },
  {
    id: "4",
    emoji: "🤝",
    label: "Personal training tips",
    prompt: "What should I focus on as a beginner starting at Carreon Gym?",
  },
];

export default function Chats() {
  const { profile } = useUserProfile();

  const [reminderOpen, setReminderOpen] = useState(
    profile?.subscription?.status !== "active",
  );

  const {
    messages,
    sessionId,
    sendMessage,
    loading,
    initializing,
    startNewSession,
    refreshMessages,
  } = useChat({ profile, setReminderOpen });

  const [text, setText] = useState("");
  const scrollRef = useRef<FlatList<ChatMessage>>(null);
  const isAtBottom = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshMessages();
    }, [refreshMessages]),
  );

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (!profile) return null;


  if (!sessionId) {
    return (
      <ScreenWrapper>
        <WelcomeScreen onStartChat={startNewSession} loading={loading} />
      </ScreenWrapper>
    );
  }

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

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    isAtBottom.current = isCloseToBottom;
    setShowScrollButton(!isCloseToBottom);
  };

  const handleContentSizeChange = () => {
    if (isAtBottom.current) {
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={100} // adjust based on your header height
      className="bg-background"
    >
      {reminderOpen && (
        <SubscriptionReminder
          text="Subscribe to continue"
          setReminderOpen={setReminderOpen}
        />
      )}
      {initializing ? <CustomLoader text="Loading your chat history..." /> : <FlatList
        ref={scrollRef}
        data={messages}
        scrollEnabled={true}
        keyExtractor={(item, index) => JSON.stringify(item.id) + index}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleContentSizeChange}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="p-4"
        className="flex-1"
        ListEmptyComponent={
          !isKeyboardVisible ? (
            <View className="flex-1 justify-center items-center mt-10 px-4">
              <Text className="text-text-secondary text-center text-lg">
                👋 Ready to train?
              </Text>
              <Text className="text-text-secondary text-center mt-2">
                Ask me anything about fitness or request a workout!
              </Text>
              <View className="mt-6 w-full gap-3">
                {PROMPT_SUGGESTIONS.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    onPress={() => setText(suggestion.prompt)}
                    className="bg-surface border border-border rounded-2xl px-4 py-3 flex-row items-center gap-3"
                  >
                    <Text className="text-xl">{suggestion.emoji}</Text>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-medium">
                        {suggestion.label}
                      </Text>
                      <Text
                        className="text-text-secondary text-xs mt-0.5"
                        numberOfLines={1}
                      >
                        {suggestion.prompt}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        renderItem={renderMessageItem}
      />}


      {showScrollButton && (
        <TouchableOpacity
          onPress={() => {
            isAtBottom.current = true;
            scrollToBottom();
          }}
          className="absolute bottom-24 right-4 bg-surface p-2 rounded-full border border-white/10 shadow-lg z-50"
        >
          <ArrowDown size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      )}


      <View className="flex-row gap-2 p-4 items-center bg-background border-t border-border">
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
          className={`p-3 ${loading || !text.trim() ? "bg-surface opacity-50" : "bg-primary"} rounded-full items-center justify-center`}
        >
          <Send color="white" size={24} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}