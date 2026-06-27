import { useCallback, useRef } from "react";
import { FlatList } from "react-native";

/**
 * Hook that manages auto-scroll behavior for chat messages.
 * Automatically scrolls to bottom when new messages arrive,
 * and shows/hides scroll-to-bottom button based on scroll position.
 */
export function useScrollToBottom<T>() {
  const scrollRef = useRef<FlatList<T>>(null);
  const isAtBottom = useRef(true);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (isAtBottom.current) {
      scrollToBottom();
    }
  }, [scrollToBottom]);

  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        layoutMeasurement: { height: number };
        contentOffset: { y: number };
        contentSize: { height: number };
      };
    }) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const paddingToBottom = 20;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;

      isAtBottom.current = isCloseToBottom;
    },
    [],
  );

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    handleScroll,
    handleContentSizeChange,
  };
}
