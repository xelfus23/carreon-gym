import { View, ScrollView, Text, Image, Animated, Easing } from "react-native";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-native-markdown-display";
import { ChatMessage } from "@/src/types/chats";
import { markdownStyle } from "@/src/consts/markdownStyle";
import { COLORS } from "@/src/consts/colors";

const TYPEWRITER_BASE_MS = 18;

function getRevealDelay(behind: number): number {
  if (behind > 200) return 2;
  if (behind > 100) return 4;
  if (behind > 40) return 8;
  if (behind > 15) return 12;
  return TYPEWRITER_BASE_MS;
}

function useTypewriterReveal(
  messageId: string | number | undefined,
  content: string,
  isStreaming: boolean,
) {
  const [revealedLength, setRevealedLength] = useState(
    isStreaming ? 0 : content.length
  );

  const revealedRef = useRef(revealedLength);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMessageIdRef = useRef(messageId);

  revealedRef.current = revealedLength;

  useEffect(() => {
    if (prevMessageIdRef.current !== messageId) {
      const initialLength = isStreaming ? 0 : content.length;
      setRevealedLength(initialLength);
      revealedRef.current = initialLength;
    } else if (revealedRef.current > content.length) {
      const clampedLength = Math.min(revealedRef.current, content.length);
      setRevealedLength(clampedLength);
      revealedRef.current = clampedLength;
    }

    prevMessageIdRef.current = messageId;
  }, [content.length, isStreaming, messageId]);

  useEffect(() => {
    const tick = () => {
      const target = content.length;
      const prev = revealedRef.current;

      if (prev >= target) {
        timerRef.current = null;
        return;
      }

      const next = Math.min(prev + 1, target);
      revealedRef.current = next;
      setRevealedLength(next);

      const behind = target - next;
      timerRef.current = setTimeout(tick, getRevealDelay(behind));
    };

    if (revealedRef.current < content.length && !timerRef.current) {
      timerRef.current = setTimeout(tick, TYPEWRITER_BASE_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [content, revealedLength]);

  return {
    revealedLength,
    isAnimating: revealedLength < content.length,
  };
}

const tableRule = (
  node: { key: string },
  children: React.ReactNode,
  _parent: unknown,
  styles: Record<string, object>,
) => (
  <ScrollView
    key={node.key}
    horizontal
    showsHorizontalScrollIndicator
    style={{ flexGrow: 0 }}
  >
    <View style={[styles.table, { width: "100%" }]}>{children}</View>
  </ScrollView>
);

const MessageMarkdown = memo(function MessageMarkdown({
  content,
  revealedLength,
}: {
  content: string;
  revealedLength?: number;
}) {
  const visibleContent = useMemo(
    () =>
      revealedLength !== undefined
        ? content.slice(0, revealedLength)
        : content,
    [content, revealedLength],
  );

  const rules = useMemo(() => ({ table: tableRule }), []);

  return (
    <Markdown style={markdownStyle as any} rules={rules as any}>
      {visibleContent}
    </Markdown>
  );
});

const StreamedAssistantMessage = memo(function StreamedAssistantMessage({
  item,
}: {
  item: ChatMessage;
}) {
  const isUser = item.role === "user";
  const content = item.content || "";
  const status = item.aiStatus;
  const showStatus = !isUser && !!status && !!item.isStreaming;
  const isError = status === "Error";

  const { revealedLength } = useTypewriterReveal(
    item.id,
    content,
    !!item.isStreaming
  );

  const errorFade = useRef(new Animated.Value(0)).current;
  const hasAnimatedErrorRef = useRef(false);
  useEffect(() => {
    if (!isError || !content || hasAnimatedErrorRef.current) return;

    hasAnimatedErrorRef.current = true;
    errorFade.setValue(0);
    Animated.timing(errorFade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [content, errorFade, isError]);

  const bubbleClassName = isUser
    ? "bg-surface rounded-2xl px-4 max-w-[85%] border border-border"
    : "w-full";

  const bubbleStyle =
    isError && content ? { opacity: errorFade } : undefined;


  const showAnimatedMarkdown =
    !isUser && !isError && revealedLength < content.length;


  return (
    <View className={`mb-4 ${isUser ? "items-end" : "items-start"} px-4`}>
      <Animated.View className={bubbleClassName} style={bubbleStyle}>
        {showStatus && (
          <View className="flex-row items-center gap-2 opacity-80 mb-2">
            <Image
              source={require("../../../assets/ui/star-icon.png")}
              resizeMode="contain"
              className="w-3.5 h-3.5 animate-spin"
              style={{ tintColor: COLORS.primary }}
            />
            <Text className="text-text-secondary text-xs font-interMedium animate-pulse">
              {status}
            </Text>
          </View>
        )}

        {content.length > 0 && (
          <View>
            {showAnimatedMarkdown ? (
              <MessageMarkdown
                content={content}
                revealedLength={revealedLength}
              />
            ) : (
              <MessageMarkdown content={content} />
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
});

export default function renderMessageItem({ item }: { item: ChatMessage }) {
  return <StreamedAssistantMessage item={item} />;
}
