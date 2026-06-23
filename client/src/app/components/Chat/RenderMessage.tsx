import { View, ScrollView, Text, Image, Animated, Easing } from "react-native";
import React, { memo, useEffect, useRef, useState } from "react";
import Markdown from "react-native-markdown-display";
import { ChatMessage } from "@/src/types/chats";
import { markdownStyle } from "@/src/consts/markdownStyle";
import { COLORS } from "@/src/consts/colors";
import { Check } from "lucide-react-native";

const isCompletedStatus = (status: string) =>
  status === "Complete" ||
  status === "Done" ||
  status.startsWith("Done ");

const TYPEWRITER_INTERVAL_MS = 20;
const CURSOR_BLINK_MS = 530;
const TAIL_FADE_MS = 160;

function useTypewriterReveal(
  messageId: string | number | undefined,
  content: string,
  isStreaming: boolean,
) {
  const [revealedLength, setRevealedLength] = useState(content.length);
  const [fadeFrom, setFadeFrom] = useState(content.length);
  const tailOpacity = useRef(new Animated.Value(1)).current;
  const contentRef = useRef(content);
  const isLiveMessageRef = useRef(false);

  contentRef.current = content;

  const isLiveMessage =
    isStreaming ||
    (isLiveMessageRef.current && revealedLength < content.length);

  useEffect(() => {
    if (isStreaming) {
      isLiveMessageRef.current = true;
    }
  }, [isStreaming]);

  useEffect(() => {
    isLiveMessageRef.current = false;
    const len = contentRef.current.length;
    setRevealedLength(len);
    setFadeFrom(len);
  }, [messageId]);

  useEffect(() => {
    if (isStreaming) {
      setRevealedLength(0);
      setFadeFrom(0);
    }
  }, [messageId, isStreaming]);

  useEffect(() => {
    if (!isLiveMessage) return;

    const revealNext = () => {
      setRevealedLength((prev) => {
        const target = contentRef.current.length;
        if (prev >= target) return prev;

        const behind = target - prev;
        const step = behind > 80 ? 12 : behind > 30 ? 6 : behind > 10 ? 3 : 1;
        const next = Math.min(target, prev + step);

        if (next > prev) {
          setFadeFrom(prev);
          tailOpacity.setValue(0.12);
          Animated.timing(tailOpacity, {
            toValue: 1,
            duration: TAIL_FADE_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }

        return next;
      });
    };

    const interval = setInterval(revealNext, TYPEWRITER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isLiveMessage, tailOpacity]);

  const showTypewriter = isLiveMessage;

  return {
    revealedLength,
    fadeFrom,
    tailOpacity,
    showTypewriter,
  };
}

function useCursorBlink(active: boolean) {
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      cursorOpacity.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0.15,
          duration: CURSOR_BLINK_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: CURSOR_BLINK_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [active, cursorOpacity]);

  return cursorOpacity;
}

const WritingText = memo(function WritingText({
  content,
  revealedLength,
  fadeFrom,
  tailOpacity,
  // showCursor,
  // cursorOpacity,
}: {
  content: string;
  revealedLength: number;
  fadeFrom: number;
  tailOpacity: Animated.Value;
  showCursor: boolean;
  cursorOpacity: Animated.Value;
}) {
  const stableText = content.slice(0, fadeFrom);
  const fadingText = content.slice(fadeFrom, revealedLength);

  return (
    <Text style={markdownStyle.body}>
      {stableText}
      {fadingText.length > 0 && (
        <Animated.Text style={{ opacity: tailOpacity }}>
          {fadingText}
        </Animated.Text>
      )}
      {/* {showCursor && (
        <Animated.Text
          style={[
            markdownStyle.body,
            { color: COLORS.primary, opacity: cursorOpacity },
          ]}
        >
          ▍
        </Animated.Text>
      )} */}
    </Text>
  );
});

const MessageMarkdown = memo(function MessageMarkdown({
  content,
}: {
  content: string;
}) {
  return (
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
            <View style={[styles.table, { width: "100%" }]}>{children}</View>
          </ScrollView>
        ),
      }}
    >
      {content}
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
  const showStatus = !isUser && !!status;
  const isDone = isCompletedStatus(status ?? "");
  const isError = status === "Error";

  const { revealedLength, fadeFrom, tailOpacity, showTypewriter } =
    useTypewriterReveal(item.id, content, !!item.isStreaming);

  const cursorOpacity = useCursorBlink(
    !!item.isStreaming && showTypewriter,
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

  const showWriting = !isUser && !isError && showTypewriter;

  return (
    <View className={`mb-4 ${isUser ? "items-end" : "items-start"} px-4`}>
      <Animated.View className={bubbleClassName} style={bubbleStyle}>
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
            {showWriting ? (
              <WritingText
                content={content}
                revealedLength={revealedLength}
                fadeFrom={fadeFrom}
                tailOpacity={tailOpacity}
                showCursor={!!item.isStreaming}
                cursorOpacity={cursorOpacity}
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
