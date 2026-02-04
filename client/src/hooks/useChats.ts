import { useState, useCallback, useEffect, useRef } from "react";
import { chatService } from "@/src/services/chatService";
import { ChatMessage } from "../types/chats";

export function useChat(initialSessionId?: number) {
    const [sessionId, setSessionId] = useState<number | null>(
        initialSessionId || null,
    );

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);

    // We start 'initializing' as true. It finishes only after we
    // attempt to find a session AND load its messages.
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const creationLock = useRef(false);

    // ============================================================
    // 0. AUTO-RESUME LOGIC (The Fix)
    // ============================================================
    useEffect(() => {
        // If the parent component passed an ID, rely on that.
        if (initialSessionId) {
            setSessionId(initialSessionId);
            return;
        }

        const findLatestSession = async () => {
            try {
                // 1. Fetch all sessions for this user
                const sessions = await chatService.getHistory();

                // 2. If sessions exist, pick the first one (Assuming Backend sorts DESC)
                if (sessions && sessions.length > 0) {
                    const latestSession = sessions[0];
                    console.log("Resuming session:", latestSession.id);
                    setSessionId(latestSession.id);
                } else {
                    // 3. No sessions found? Stop loading.
                    // The user is new, so we wait for them to send the first message.
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
    // 1. LOAD MESSAGES (Triggers when sessionId is set)
    // ============================================================
    useEffect(() => {
        const loadMessages = async () => {
            if (!sessionId) return; // Wait until we have an ID

            try {
                setInitializing(true); // Ensure loading state is on
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
    // 2. SEND MESSAGE LOGIC (Unchanged)
    // ============================================================
    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim()) return;

            setLoading(true);
            setError(null);

            const userTimestamp = Date.now();
            setMessages((prev) => [
                ...prev,
                { role: "user", content: text, timestamp: userTimestamp },
            ]);

            try {
                let currentSessionId = sessionId;

                // Create new session if none exists
                if (!currentSessionId) {
                    if (creationLock.current) return;
                    creationLock.current = true;

                    const newSession = await chatService.createChat();
                    currentSessionId = newSession.id;
                    setSessionId(currentSessionId);
                    creationLock.current = false;
                }

                if (currentSessionId) {
                    await chatService.saveMessage(
                        currentSessionId,
                        "user",
                        text,
                    );
                }

                const assistantTimestamp = Date.now() + 1;
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "Thinking...",
                        timestamp: assistantTimestamp,
                    },
                ]);

                let responseBuffer = "";
                let isFirstToken = true;

                await chatService.sendMessage(
                    currentSessionId!,
                    text,
                    (token) => {
                        responseBuffer += token;

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
                        msg.role === "assistant" &&
                        msg.content === "Thinking..."
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
    };
}
