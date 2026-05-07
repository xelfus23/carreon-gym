import {
  useState,
  useCallback,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import { chatService } from "@/src/services/chatService";
import { ChatMessage } from "../types/chats";
import { UserProfile } from "../types/users";

let tempIdCounter = 0;
const newTempId = () => `__streaming_${tempIdCounter++}__`;
const GENERIC_ASSISTANT_ERROR =
  "I ran into an issue while processing your request. Please try again.";

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

  const sessionResolvedRef = useRef(!!params?.initialSessionId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      chatService.disconnect();
    };
  }, []);

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
      } catch (err) {
        if (mountedRef.current) setInitializing(false);
      }
    };

    findLatestSession();
  }, [params?.initialSessionId]);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;
    setInitializing(true);
    try {
      const data = await chatService.getSessionMessages(sessionId);
      if (!mountedRef.current) return;

      const formatted: ChatMessage[] = data
        .filter(
          (msg: any) => msg.role !== "tool" && msg.content !== null,
        )
        .map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          tool_calls: msg.tool_calls
            ? typeof msg.tool_calls === "string"
              ? JSON.parse(msg.tool_calls)
              : msg.tool_calls
            : undefined,
          tool_call_id: msg.tool_call_id,
          name: msg.name,
          aiStatus: msg.aiStatus,
        }));

      setMessages(formatted);
    } catch (err) {
      console.error("Failed to load messages:", err);
      if (mountedRef.current) setError("Could not load chat history");
    } finally {
      if (mountedRef.current) setInitializing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const startNewSession = useCallback(
    async (force = false) => {
      if (sessionId && !force) {
        console.log("⚠️ Session already exists:", sessionId);
        return;
      }

      setLoading(true);
      setMessages([]);
      try {
        const { id } = await chatService.createChat();
        if (!mountedRef.current) return;
        setSessionId(id);
        console.log("✅ New session created:", id);
      } catch (err) {
        console.error("Failed to create session:", err);
        if (mountedRef.current)
          setError("Could not start chat session");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [sessionId],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !sessionId) return;

      if (
        params?.setReminderOpen &&
        params.profile?.subscription?.status !== "active"
      ) {
        params.setReminderOpen(true);
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

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
                  ? { ...msg, content: msg.content + token }
                  : msg,
              ),
            );
          },
          (state) => {
            const targetAssistantId = activeAssistantIdRef.current;
            setMessages((prev) => {
              if (state === "Done") {
                return prev.map((msg) =>
                  msg.role === "assistant" &&
                  String(msg.id).startsWith("__streaming_")
                    ? { ...msg, aiStatus: "Done" }
                    : msg,
                );
              }

              return prev.map((msg) =>
                msg.id === targetAssistantId
                  ? { ...msg, aiStatus: state }
                  : msg,
              );
            });
          },
          () => {
            setMessages((prev) => {
              const activeId = activeAssistantIdRef.current;
              if (!activeId) return prev;

              const activeMessage = prev.find((msg) => msg.id === activeId);
              const shouldStartNewAssistantMessage =
                !!activeMessage &&
                (activeMessage.content.trim().length > 0 ||
                  (!!activeMessage.aiStatus &&
                    activeMessage.aiStatus !== "Preparing assistant"));

              if (!shouldStartNewAssistantMessage) {
                return prev;
              }

              const nextAssistantId = newTempId();
              activeAssistantIdRef.current = nextAssistantId;

              return [
                ...prev.map((msg) =>
                  msg.id === activeId ? { ...msg, aiStatus: "Done" } : msg,
                ),
                {
                  id: nextAssistantId,
                  role: "assistant",
                  content: "",
                  aiStatus: "Processing tool results",
                },
              ];
            });
          },
          abortRef.current.signal,
        );
      } catch (err) {
        if ((err as Error).message === "Aborted") return;

        const message =
          err instanceof Error ? err.message : "Connection failed";
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
              content: `⚠️ ${message || GENERIC_ASSISTANT_ERROR}`,
              timestamp: Date.now(),
              aiStatus: "Error",
            },
          ]);
        }
      } finally {
        activeAssistantIdRef.current = null;
        if (mountedRef.current) {
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    },
    [sessionId, params],
  );

  return {
    messages,
    sessionId,
    loading,
    initializing,
    error,
    sendMessage,
    startNewSession,
    refreshMessages: loadMessages,
  };
}
