import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Send, ArrowDown, SlidersHorizontal } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useChat } from "@/src/hooks/useChats";
import { useScrollToBottom } from "@/src/hooks/useScrollToBottom";
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

type ModalState = "personalization" | "profile-prompt" | "edit-profile" | null;

export default function Chats() {
  const { profile } = useUserProfile();
  const navigation = useNavigation();
  const {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    handleScroll,
    handleContentSizeChange,
  } = useScrollToBottom<ChatMessage>();

  const [inputText, setInputText] = useState("");
  const [activeModal, setActiveModal] = useState<ModalState>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(
    !hasActiveSubscription(profile),
  );
  const loadOlderLock = useRef(false);

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

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          title="AI Trainer"
          headerRight={
            <TouchableOpacity
              onPress={() => setActiveModal("personalization")}
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
  }, [navigation]);

  const handleStartChat = useCallback(async () => {
    const created = await startNewSession();
    if (!created || !profile) return;

    const dismissed = await isProfilePromptDismissed();
    if (!dismissed && !hasBodyCompositionData(profile)) {
      setActiveModal("profile-prompt");
    }
  }, [startNewSession, profile]);

  const handleLoadOlderMessages = useCallback(async () => {
    if (loadOlderLock.current) return;

    loadOlderLock.current = true;
    try {
      await loadOlderMessages();
    } finally {
      loadOlderLock.current = false;
    }
  }, [loadOlderMessages]);

  const handleScroll_ = useCallback(
    (event: any) => {
      handleScroll(event);

      const { contentOffset } = event.nativeEvent;
      const isCloseToBottom = isAtBottom.current;

      setShowScrollButton(!isCloseToBottom);

      // Load older messages when scrolling to top
      if (contentOffset.y < 60 && hasMoreOlder && !loadingOlder) {
        handleLoadOlderMessages();
      }
    },
    [handleScroll, hasMoreOlder, loadingOlder, handleLoadOlderMessages],
  );

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    if (!hasActiveSubscription(profile)) {
      setReminderOpen(true);
      return;
    }

    const text = inputText;
    setInputText("");

    try {
      await sendMessage(text);
    } catch (err) {
      console.error(
        "Failed to send message:",
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  }, [inputText, profile, sendMessage]);

  if (!profile) return null;

  // Show welcome screen if no session started
  if (!sessionId) {
    return (
      <ScreenWrapper>
        <WelcomeScreen onStartChat={handleStartChat} loading={loading} />
        <ModalStack activeModal={activeModal} setActiveModal={setActiveModal} />
      </ScreenWrapper>
    );
  }

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
          scrollEnabled
          keyExtractor={(item, index) => `${item.id}-${index}`}
          onScroll={handleScroll_}
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
                onPress={handleLoadOlderMessages}
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
            <EmptyMessagePrompts onSelectPrompt={setInputText} />
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
          value={inputText}
          onChangeText={setInputText}
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
          className={`p-3 ${loading || !inputText.trim() ? "bg-surface opacity-50" : "bg-primary-dark"} rounded-full self-end justify-center`}
        >
          <Send color="white" size={24} />
        </TouchableOpacity>
      </View>

      <ModalStack activeModal={activeModal} setActiveModal={setActiveModal} />
    </KeyboardAvoidingView>
  );
}

/** Renders empty message prompt suggestions */
function EmptyMessagePrompts({
  onSelectPrompt,
}: {
  onSelectPrompt: (text: string) => void;
}) {
  return (
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
            onPress={() => onSelectPrompt(suggestion.prompt)}
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
  );
}

/** Modal stack component - manages all modal visibility */
function ModalStack({
  activeModal,
  setActiveModal,
}: {
  activeModal: ModalState;
  setActiveModal: (modal: ModalState) => void;
}) {
  const { profile } = useUserProfile();

  return (
    <>
      <AiPersonalizationModal
        visible={activeModal === "personalization"}
        onClose={() => setActiveModal(null)}
      />
      <ProfileAccuracyPromptModal
        visible={activeModal === "profile-prompt"}
        onContinue={() => setActiveModal("edit-profile")}
        onMaybeLater={async () => {
          await dismissProfilePrompt();
          setActiveModal(null);
        }}
      />
      <EditProfileModal
        visible={activeModal === "edit-profile"}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}
