// src/hooks/useChats.ts
import { useState, useCallback, useEffect } from "react";
import { chatService } from "@/src/services/chatService";
import { ChatMessage } from "../types/chats";

export function useChat(initialSessionId?: number) {
    const [sessionId, setSessionId] = useState<number | null>(
        initialSessionId || null,
    );
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ============================================================
    // 1. AUTO-RESUME: Check for existing sessions on mount
    // ============================================================
    useEffect(() => {
        if (initialSessionId) {
            setSessionId(initialSessionId);
            return;
        }

        const findLatestSession = async () => {
            try {
                const result = await chatService.getHistory();

                console.log("RESULT:", result);

                if (!result.success) {
                    throw new Error(result.message);
                }

                const sessions = result.data;

                if (sessions && sessions.length > 0) {
                    const latestSession = sessions[0];
                    console.log("📂 Resuming session:", latestSession.id);
                    setSessionId(latestSession.id);
                } else {
                    // ✅ No sessions found - user will see welcome screen
                    console.log("👋 New user - no sessions found");
                    setInitializing(false);
                }
            } catch (err) {
                console.error("Failed to fetch sessions", err);
                setInitializing(false);
            }
        };

        findLatestSession();
    }, [initialSessionId]);

    // ============================================================
    // 2. LOAD MESSAGES when sessionId is set
    // ============================================================
    useEffect(() => {
        const loadMessages = async () => {
            if (!sessionId) return;

            try {
                setInitializing(true);
                const result = await chatService.getSessionMessages(sessionId);

                if (!result.success) {
                    throw new Error(result.message);
                }

                const history = result.data;

                const formattedMessages: ChatMessage[] = history.map(
                    (msg: any) => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        timestamp: new Date(msg.created_at).getTime(),
                        // Preserve tool call data
                        tool_calls: msg.tool_calls
                            ? typeof msg.tool_calls === "string"
                                ? JSON.parse(msg.tool_calls)
                                : msg.tool_calls
                            : undefined,
                        tool_call_id: msg.tool_call_id,
                        name: msg.name,
                        aiStatus: msg.aiStatus,
                    }),
                );

                setMessages(formattedMessages);
                console.log(`✅ Loaded ${formattedMessages.length} messages`);
                // Log tool calls found
                const toolMessages = formattedMessages.filter(
                    (m) => m.tool_calls || m.role === "tool",
                );
                if (toolMessages.length > 0) {
                    console.log(
                        `📞 Found ${toolMessages.length} messages with tool calls/results`,
                    );
                }
            } catch (err) {
                console.error("Failed to load history", err);
                setError("Could not load chat history");
            } finally {
                setInitializing(false);
            }
        };

        loadMessages();
    }, [sessionId]);

    // ============================================================
    // 3. START NEW SESSION (Called by welcome screen)
    // ============================================================
    const startNewSession = useCallback(async () => {
        if (sessionId) {
            console.log("⚠️ Session already exists:", sessionId);
            return;
        }

        setLoading(true);
        try {
            console.log("🆕 Creating new session...");
            const result = await chatService.createChat();

            if (!result.success) {
                throw new Error(result.message);
            }

            const newSession = result.data;

            setSessionId(newSession.id);
            console.log("✅ Session created:", newSession.id);
        } catch (err) {
            console.error("Failed to create session", err);
            setError("Could not start chat session");
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    // ============================================================
    // 4. SEND MESSAGE (No session creation here!)
    // ============================================================
    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim()) return;
            if (!sessionId) {
                console.error("❌ Cannot send message without sessionId");
                return;
            }

            setLoading(true);
            setError(null);

            const userTimestamp = Date.now();

            setMessages((prev) => [
                ...prev,
                { role: "user", content: text, timestamp: userTimestamp },
            ]);

            try {
                const assistantTimestamp = Date.now() + 1;
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "",
                        timestamp: assistantTimestamp,
                        aiStatus: "Thinking",
                    },
                ]);

                await chatService.sendMessage(
                    sessionId,
                    text,
                    (token) => {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.timestamp === assistantTimestamp
                                    ? { ...msg, content: msg.content + token }
                                    : msg,
                            ),
                        );
                    },
                    (state) => {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.timestamp === assistantTimestamp
                                    ? { ...msg, aiStatus: state }
                                    : msg,
                            ),
                        );
                    },
                );
            } catch (err) {
                console.error("Chat Error:", err);
                const errorMessage =
                    err instanceof Error ? err.message : "Connection failed";
                setError(errorMessage);
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.role === "assistant" && msg.content === ""
                            ? { ...msg, content: `⚠️ Error: ${errorMessage}` }
                            : msg,
                    ),
                );
            } finally {
                setLoading(false);
            }
        },
        [sessionId],
    );

    return {
        messages,
        sessionId,
        loading,
        initializing,
        error,
        sendMessage,
        startNewSession,
    };
}
