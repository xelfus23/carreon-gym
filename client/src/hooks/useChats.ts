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
    const [aiStatus, setAiStatus] = useState<null | string>(null);

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
                const sessions = await chatService.getHistory();

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
                const history = await chatService.getSessionMessages(sessionId);

                const formattedMessages: ChatMessage[] = history.map(
                    (msg: any) => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        timestamp: new Date(msg.created_at).getTime(),
                    }),
                );
                setMessages(formattedMessages);
                console.log(`✅ Loaded ${formattedMessages.length} messages`);
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
            const newSession = await chatService.createChat();
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
                        aiStatus: "thinking",
                    },
                ]);

                let isFirstToken = true;

                await chatService.sendMessage(
                    sessionId,
                    text,
                    (token, status) => {
                        setAiStatus(status); // <- receive status from WS

                        setMessages((prev) =>
                            prev.map((msg) => {
                                if (msg.timestamp === assistantTimestamp) {
                                    const newContent = isFirstToken
                                        ? token
                                        : msg.content + token;
                                    isFirstToken = false;
                                    return { ...msg, content: newContent };
                                }
                                return msg;
                            }),
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
        [sessionId, aiStatus],
    );

    return {
        messages,
        sessionId,
        loading,
        initializing,
        error,
        sendMessage,
        startNewSession, // ✅ New function exposed
    };
}
