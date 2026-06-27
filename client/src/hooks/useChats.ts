import {
  useState,
  useCallback,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { useFocusEffect } from "expo-router";
import { chatService } from "@/src/services/chat.service";
import { ChatMessage } from "../types/chats";
import { UserProfile } from "../types/users";
import { hasActiveSubscription } from "../utils/subscription";
import { getAiPreferences } from "../utils/aiPreferences";

const MESSAGE_PAGE_SIZE = 30;
const POLL_INTERVAL_MS = 2000;
const PENDING_ASSISTANT_ID = "__pending_assistant__";

let tempIdCounter = 0;
const newTempId = () => `__streaming_${tempIdCounter++}__`;
const GENERIC_ASSISTANT_ERROR =
  "I ran into an issue while processing your request. Please try again.";

function formatMessage(msg: {
  id: number;
  role: string;
  content: string | null;
  created_at: string;
  aiStatus?: string;
}): ChatMessage {
  return {
    id: msg.id,
    role: msg.role as ChatMessage["role"],
    content: msg.content ?? "",
    timestamp: new Date(msg.created_at).getTime(),
    aiStatus:
      msg.aiStatus ??
      (msg.role === "assistant" && String(msg.content ?? "").trim().length > 0
        ? "Done"
        : undefined),
  };
}

type ServerMessage = {
  id: number;
  role: string;
  content: string | null;
  created_at: string;
  aiStatus?: string;
};

function isServerMessage(msg: unknown): msg is ServerMessage {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "id" in msg &&
    "role" in msg &&
    "content" in msg &&
    "created_at" in msg
  );
}

function formatServerMessages(data: unknown[]): ChatMessage[] {
  return data
    .filter(isServerMessage)
    .filter((msg) => msg.role !== "tool" && msg.content !== null)
    .map((msg, index) =>
      formatMessage({
        id: msg.id ?? index,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at ?? new Date().toISOString(),
        aiStatus: msg.aiStatus,
      }),
    );
}

function isDisconnectError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("connection closed") ||
    normalized.includes("connection failed") ||
    normalized.includes("connection ended") ||
    normalized.includes("aborted")
  );
}

export function useChat(params?: {
  initialSessionId?: number;
  profile?: UserProfile | null;
  setReminderOpen?: Dispatch<SetStateAction<boolean>> | null;
}) {
  const [sessionId, setSessionId] = useState<number | null>(
    params?.initialSessionId ?? null,
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error?.includes("SUBSCRIPTION_EXPIRED")) {
      setError(
        "Your subscription has expired. Subscribe again to continue using chat.",
      );
    }

    if (error?.includes("SUBSCRIPTION_REQUIRED")) {
      setError(
        "You currently have no subscriptions. Subscribe to use our chat feature.",
      );
    }
  }, [error]);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const activeAssistantIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSendingRef = useRef(false);

  const sessionResolvedRef = useRef(!!params?.initialSessionId);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const applyServerMessages = useCallback(
    (formatted: ChatMessage[], options?: { pendingAssistant?: boolean }) => {
      if (options?.pendingAssistant) {
        const last = formatted[formatted.length - 1];
        if (last?.role === "user") {
          setMessages([
            ...formatted,
            {
              id: PENDING_ASSISTANT_ID,
              role: "assistant",
              content: "",
              aiStatus: "AI is responding...",
              isStreaming: true,
              streamVersion: 0,
            },
          ]);
          return;
        }
      }

      setMessages(formatted);
    },
    [],
  );

  const syncMessagesFromServer = useCallback(
    async (options?: { pendingAssistant?: boolean }) => {
      if (!sessionId) return null;

      try {
        const data = await chatService.getSessionMessages(sessionId, {
          limit: MESSAGE_PAGE_SIZE,
        });
        if (!mountedRef.current) return null;

        const formatted = formatServerMessages(data);
        applyServerMessages(formatted, options);
        setHasMoreOlder(data.length >= MESSAGE_PAGE_SIZE);
        return formatted;
      } catch (err) {
        console.error(
          "Failed to sync messages:",
          err instanceof Error ? err.message : "Unknown Error",
        );
        return null;
      }
    },
    [sessionId, applyServerMessages],
  );

  const checkAndPollGeneration = useCallback(async () => {
    if (!sessionId || isSendingRef.current) return;

    try {
      const status = await chatService.getGenerationStatus(sessionId);
      if (!mountedRef.current) return;

      if (status.isGenerating || status.awaitingAssistant) {
        const showPending = AppState.currentState !== "active";
        await syncMessagesFromServer({ pendingAssistant: showPending });
        if (!pollTimerRef.current) {
          setIsPolling(true);
          pollTimerRef.current = setInterval(() => {
            checkAndPollGeneration();
          }, POLL_INTERVAL_MS);
        }
        return;
      }

      stopPolling();
      await syncMessagesFromServer();
    } catch {
      // Status endpoint may be unavailable until server restarts — fall back to message sync.
      await syncMessagesFromServer();
    }
  }, [sessionId, stopPolling, syncMessagesFromServer]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      stopPolling();
      chatService.disconnect();
    };
  }, [stopPolling]);

  useEffect(() => {
    if (sessionResolvedRef.current) {
      if (params?.initialSessionId) setInitializing(false);
      return;
    }

    sessionResolvedRef.current = true;

    const findLatestSession = async () => {
      try {
        const sessions = await chatService.getHistory();

        if (!mountedRef.current) return;

        if (sessions?.length > 0) {
          setSessionId(sessions[0].id);
        } else {
          setInitializing(false);
        }
      } catch {
        if (mountedRef.current) setInitializing(false);
      }
    };

    findLatestSession();
  }, [params?.initialSessionId]);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;
    setLoading(false);
    setInitializing(true);
    try {
      const data = await chatService.getSessionMessages(sessionId, {
        limit: MESSAGE_PAGE_SIZE,
      });
      if (!mountedRef.current) return;

      const formatted = formatServerMessages(data);
      applyServerMessages(formatted);
      setHasMoreOlder(data.length >= MESSAGE_PAGE_SIZE);

      await checkAndPollGeneration();
    } catch (err) {
      console.error(
        "Failed to load messages:",
        err instanceof Error ? err.message : "Unknown Error Occurred",
      );
      if (mountedRef.current) setError("Could not load chat history");
    } finally {
      if (mountedRef.current) setInitializing(false);
    }
  }, [sessionId, applyServerMessages, checkAndPollGeneration]);

  const loadOlderMessages = useCallback(async () => {
    if (!sessionId || !hasMoreOlder || loadingOlder) return;

    const oldestId = messages[0]?.id;
    if (typeof oldestId !== "number") return;

    setLoadingOlder(true);
    try {
      const data = await chatService.getSessionMessages(sessionId, {
        limit: MESSAGE_PAGE_SIZE,
        beforeId: oldestId,
      });
      if (!mountedRef.current) return;

      const older = formatServerMessages(data);

      if (older.length === 0) {
        setHasMoreOlder(false);
        return;
      }

      setMessages((prev) => [...older, ...prev]);
      setHasMoreOlder(data.length >= MESSAGE_PAGE_SIZE);
    } catch (err) {
      console.error(
        "Failed to load older messages:",
        err instanceof Error ? err.message : "Unknown Error",
      );
    } finally {
      if (mountedRef.current) setLoadingOlder(false);
    }
  }, [sessionId, hasMoreOlder, loadingOlder, messages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useFocusEffect(
    useCallback(() => {
      if (!sessionId) return;
      syncMessagesFromServer();
      checkAndPollGeneration();
    }, [sessionId, syncMessagesFromServer, checkAndPollGeneration]),
  );

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active" && sessionId) {
        syncMessagesFromServer();
        checkAndPollGeneration();
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [sessionId, syncMessagesFromServer, checkAndPollGeneration]);

  const startNewSession = useCallback(
    async (force = false) => {
      if (sessionId && !force) {
        console.log("⚠️ Session already exists:", sessionId);
        return false;
      }

      stopPolling();
      setLoading(true);
      setMessages([]);
      setHasMoreOlder(false);
      try {
        const { id } = await chatService.createChat();
        if (!mountedRef.current) return false;
        setSessionId(id);
        console.log("✅ New session created:", id);
        return true;
      } catch (err) {
        console.error("Failed to create session:", err);
        if (mountedRef.current) setError("Could not start chat session");
        return false;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [sessionId, stopPolling],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !sessionId) return;

      if (params?.setReminderOpen && !hasActiveSubscription(params.profile)) {
        params.setReminderOpen(true);
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      isSendingRef.current = true;
      stopPolling();
      setLoading(true);
      setError(null);

      const preferences = await getAiPreferences();

      const userTempId = `__user_${Date.now()}__`;
      const initialAssistantId = newTempId();
      activeAssistantIdRef.current = initialAssistantId;

      setMessages((prev) => [
        ...prev,
        {
          id: userTempId,
          role: "user",
          content: text,
          timestamp: Date.now(),
        },
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: initialAssistantId,
          role: "assistant",
          content: "",
          aiStatus: "Preparing assistant",
          isStreaming: true,
          streamVersion: 0,
        },
      ]);

      try {
        await chatService.sendMessage(
          sessionId,
          text,
          (token) => {
            const targetAssistantId = activeAssistantIdRef.current;
            if (!targetAssistantId) return;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === targetAssistantId
                  ? {
                      ...msg,
                      content: msg.content + token,
                      aiStatus: undefined,
                      isStreaming: true,
                      streamVersion: (msg.streamVersion ?? 0) + 1,
                    }
                  : msg,
              ),
            );
          },
          (state) => {
            const targetAssistantId = activeAssistantIdRef.current;
            if (!targetAssistantId) return;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === targetAssistantId
                  ? {
                      ...msg,
                      aiStatus: state,
                      isStreaming: state !== "Complete",
                    }
                  : msg,
              ),
            );
          },
          () => {
            setMessages((prev) => {
              const activeId = activeAssistantIdRef.current;
              if (!activeId) return prev;

              const activeMessage = prev.find((msg) => msg.id === activeId);
              const shouldStartNewAssistantMessage =
                !!activeMessage && activeMessage.content.trim().length > 0;

              if (!shouldStartNewAssistantMessage) {
                return prev;
              }

              const nextAssistantId = newTempId();
              activeAssistantIdRef.current = nextAssistantId;

              return [
                ...prev.map((msg) =>
                  msg.id === activeId
                    ? { ...msg, aiStatus: undefined, isStreaming: false }
                    : msg,
                ),
                {
                  id: nextAssistantId,
                  role: "assistant",
                  content: "",
                  aiStatus: "Writing response",
                  isStreaming: true,
                  streamVersion: 0,
                },
              ];
            });
          },
          abortRef.current.signal,
          false,
          preferences,
        );

        await syncMessagesFromServer();
      } catch (err) {
        if ((err as Error).message === "Aborted") return;

        const message =
          err instanceof Error ? err.message : "Connection failed";

        if (isDisconnectError(message)) {
          setError(null);
          const showPending = AppState.currentState !== "active";
          await syncMessagesFromServer({ pendingAssistant: showPending });
          checkAndPollGeneration();
          return;
        }

        setError(message);

        if (mountedRef.current) {
          setMessages((prev) =>
            prev.filter(
              (msg) =>
                msg.id !== userTempId &&
                !String(msg.id).startsWith("__streaming_"),
            ),
          );

          setMessages((prev) => [
            ...prev,
            {
              id: `__error_${Date.now()}__`,
              role: "assistant",
              content: `${message || GENERIC_ASSISTANT_ERROR}`,
              timestamp: Date.now(),
              aiStatus: "Error",
              isStreaming: true,
              streamVersion: 1,
            },
          ]);
        }
      } finally {
        activeAssistantIdRef.current = null;
        isSendingRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    },
    [
      sessionId,
      params,
      stopPolling,
      syncMessagesFromServer,
      checkAndPollGeneration,
    ],
  );

  return {
    messages,
    sessionId,
    loading,
    initializing,
    loadingOlder,
    hasMoreOlder,
    isPolling,
    error,
    sendMessage,
    startNewSession,
    refreshMessages: loadMessages,
    loadOlderMessages,
  };
}
