import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Send, ArrowDown, SlidersHorizontal, Wand, Sliders } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useChat } from "@/src/hooks/useChats";
import renderMessageItem from "../../../components/Chat/RenderMessage";
import { ChatMessage } from "@/src/types/chats";
import SubscriptionReminder from "@/src/app/components/SubscriptionReminder";
import { useUserProfile } from "@/src/context/profileProvider";
import CustomLoader from "@/src/app/components/Plans/PlansLoading";
import WelcomeScreen from "@/src/app/components/ChatWelcome";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import getCustomLoader from "@/src/app/components/CustomRefreshControl";
import { hasActiveSubscription } from "@/src/utils/subscription";
import AiPersonalizationModal from "@/src/app/components/Modals/AiPersonalizationModal";
import ProfileAccuracyPromptModal from "@/src/app/components/Modals/ProfileAccuracyPromptModal";
import EditProfileModal from "@/src/app/components/Modals/EditProfileModal";
import CustomHeader from "@/src/app/components/CustomHeader";
import { useNavigation } from "expo-router";
import {
  dismissProfilePrompt,
  hasBodyCompositionData,
  isProfilePromptDismissed,
} from "@/src/utils/aiPreferences";

const PROMPT_SUGGESTIONS = [
  {
    id: "1",
    emoji: "🏋️",
    label: "Create exercise for me",
    prompt: "Create a gym workout for me today at Carreon Gym.",
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
  const navigation = useNavigation();

  const [reminderOpen, setReminderOpen] = useState(
    !hasActiveSubscription(profile),
  );

  const {
    messages,
    sessionId,
    sendMessage,
    loading,
    initializing,
    loadingOlder,
    hasMoreOlder,
    startNewSession,
    refreshMessages,
    loadOlderMessages,
  } = useChat({ profile, setReminderOpen });

  const [text, setText] = useState("");
  const scrollRef = useRef<FlatList<ChatMessage>>(null);
  const isAtBottom = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profilePromptOpen, setProfilePromptOpen] = useState(false);
  const loadOlderLock = useRef(false);

  const openPersonalization = useCallback(() => {
    setPersonalizationOpen(true);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          title="AI Trainer"
          headerRight={
            <TouchableOpacity
              onPress={openPersonalization}
              className="flex-row items-center gap-1.5 bg-background px-3 py-2 rounded-lg border border-border"
              accessibilityLabel="AI Settings"
            >
              <SlidersHorizontal size={12} color={COLORS.primary} />
              <Text className="text-text-secondary text-xs font-interMedium">
                AI Settings
              </Text>
            </TouchableOpacity>
          }
        />
      ),
    });
  }, [navigation, openPersonalization]);

  const handleStartChat = useCallback(async () => {
    const created = await startNewSession();
    if (!created || !profile) return;

    const dismissed = await isProfilePromptDismissed();
    if (!dismissed && !hasBodyCompositionData(profile)) {
      setProfilePromptOpen(true);
    }
  }, [startNewSession, profile]);

  const handleProfilePromptContinue = useCallback(async () => {
    setProfilePromptOpen(false);
    setEditProfileOpen(true);
  }, []);

  const handleProfilePromptLater = useCallback(async () => {
    await dismissProfilePrompt();
    setProfilePromptOpen(false);
  }, []);

  if (!profile) return null;

  const modals = (
    <>
      <AiPersonalizationModal
        visible={personalizationOpen}
        onClose={() => setPersonalizationOpen(false)}
      />
      <ProfileAccuracyPromptModal
        visible={profilePromptOpen}
        onContinue={handleProfilePromptContinue}
        onMaybeLater={handleProfilePromptLater}
      />
      <EditProfileModal
        visible={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
    </>
  );

  if (!sessionId) {
    return (
      <>
        <ScreenWrapper>
          <WelcomeScreen onStartChat={handleStartChat} loading={loading} />
        </ScreenWrapper>
        {modals}
      </>
    );
  }

  const handleSend = async () => {
    if (!text.trim()) return;
    const prompt = text;
    setText("");
    try {
      if (!hasActiveSubscription(profile)) {
        setReminderOpen(true);
        return;
      }
      await sendMessage(prompt);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Unable to send message:", err.message);
      }
    }
  };

  const handleScroll = (event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    isAtBottom.current = isCloseToBottom;
    setShowScrollButton(!isCloseToBottom);

    if (
      contentOffset.y < 60 &&
      hasMoreOlder &&
      !loadingOlder &&
      !loadOlderLock.current
    ) {
      loadOlderLock.current = true;
      loadOlderMessages().finally(() => {
        loadOlderLock.current = false;
      });
    }
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
      keyboardVerticalOffset={100}
      className="bg-background relative"
    >
      {reminderOpen && (
        <SubscriptionReminder
          title="Subscription Required"
          text="You need membership to continue"
          setReminderOpen={setReminderOpen}
        />
      )}

      {initializing ? (
        <CustomLoader text="Loading your chat history..." />
      ) : (
        <FlatList
          ref={scrollRef}
          data={messages}
          scrollEnabled={true}
          keyExtractor={(item, index) => JSON.stringify(item.id) + index}
          onScroll={handleScroll}
          refreshControl={getCustomLoader(initializing, refreshMessages)}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleContentSizeChange}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-4"
          className="flex-1"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          ListHeaderComponent={
            loadingOlder ? (
              <View className="py-3 items-center">
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text className="text-text-secondary text-xs mt-1">
                  Loading older messages...
                </Text>
              </View>
            ) : hasMoreOlder ? (
              <TouchableOpacity
                onPress={loadOlderMessages}
                className="py-3 items-center"
              >
                <Text className="text-primary text-xs font-interMedium">
                  Pull down or tap to load older messages
                </Text>
              </TouchableOpacity>
            ) : messages.length > 0 ? (
              <View className="py-2 items-center">
                <Text className="text-text-secondary text-xs">
                  Beginning of conversation
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-10 px-4">
              <Text className="text-text-secondary text-center text-lg font-inter">
                👋 Ready to train?
              </Text>
              <Text className="text-text-secondary font-inter text-center mt-2">
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
                      <Text className="text-white text-sm font-interMedium">
                        {suggestion.label}
                      </Text>
                      <Text
                        className="text-text-secondary text-xs mt-0.5 font-inter"
                        numberOfLines={1}
                      >
                        {suggestion.prompt}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={renderMessageItem}
        />
      )}

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

      <View className="flex-row gap-2 p-4">
        <TextInput
          value={text}
          onChangeText={setText}
          className="flex-1 text-lg bg-background border border-border rounded-xl text-white px-4 py-3 min-h-[50px] max-h-[100px] font-inter"
          placeholder="Message..."
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="send"
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={loading}
          className={`p-3 ${loading || !text.trim() ? "bg-surface opacity-50" : "bg-primary-dark"} rounded-full self-end justify-center`}
        >
          <Send color="white" size={24} />
        </TouchableOpacity>
      </View>

      {modals}
    </KeyboardAvoidingView>
  );
}
