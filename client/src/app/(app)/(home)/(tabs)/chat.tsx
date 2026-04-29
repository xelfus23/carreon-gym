import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useCallback, useRef, useState } from "react";
import { Send, ArrowDown } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import { useHeaderHeight } from "@react-navigation/elements";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useChat } from "@/src/hooks/useChats";
import renderMessageItem from "../../../components/Chat/RenderMessage";
import { ChatMessage } from "@/src/types/chats";
import { useFocusEffect } from "expo-router";
import SubscriptionReminder from "@/src/app/components/SubscriptionReminder";
import { useUserProfile } from "@/src/context/profileProvider";
import CustomLoader from "@/src/app/components/Plans/PlansLoading";
import WelcomeScreen from "@/src/app/components/ChatWelcome";

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
  const headerHeight = useHeaderHeight();

  useFocusEffect(
    useCallback(() => {
      refreshMessages();
    }, [refreshMessages]),
  );

  if (!profile) return

  if (initializing) {
    return <CustomLoader text="Loading your chat history..." />;
  }

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
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        className="bg-background"
        behavior="padding"
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 20 : (headerHeight - 6) / 2
        }
      >
        {reminderOpen && (
          <SubscriptionReminder
            text="Subscribe to continue"
            setReminderOpen={setReminderOpen}
          />
        )}
        <View className="flex-1 py-4">
          <View className="flex-1 bg-background relative">
            <FlatList
              ref={scrollRef}
              data={messages}
              keyExtractor={(item, index) => JSON.stringify(item.id) + index}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={handleContentSizeChange}
              onLayout={handleContentSizeChange}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center mt-20">
                  <Text className="text-text-secondary text-center text-lg">
                    👋 Ready to train?
                  </Text>
                  <Text className="text-text-secondary text-center mt-2">
                    Ask me anything about fitness or request a workout!
                  </Text>
                </View>
              }
              renderItem={renderMessageItem}
            />

            {showScrollButton && (
              <TouchableOpacity
                onPress={() => {
                  isAtBottom.current = true;
                  scrollToBottom();
                }}
                className="absolute bottom-40 right-4 bg-surface p-2 rounded-full border border-white/10 shadow-lg"
              >
                <ArrowDown size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}

            <View className="flex-row mb-16 gap-2 p-4 items-center bg-background border-t border-white/10">
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
                className={`p-3 ${loading || !text.trim()
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
