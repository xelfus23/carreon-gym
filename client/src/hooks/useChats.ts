import { useState, useCallback } from "react";
import { chatService } from "@/src/services/chatService";

export function useChat(userId: string) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // const fetchHistory = useCallback(async () => {
    //     setLoading(true);
    //     setError(null);
    //     try {
    //         const data = await chatService.getHistory(userId);
    //         setMessages(data);
    //     } catch (err: any) {
    //         setError(err.message || "Failed to fetch chat history");
    //     } finally {
    //         setLoading(false);
    //     }
    // }, [userId]);

    // Inside your Component

    const sendMessage = useCallback(
        async (text: string) => {
            setLoading(true);
            const userMessage = {
                role: "user",
                content: text,
                timestamp: Date.now(),
            };

            // 1. Add User Message
            setMessages((prev) => [...prev, userMessage]);

            // 2. Add placeholder Assistant Message
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "...", timestamp: Date.now() },
            ]);

            try {
                // Buffer to hold tokens before React state update (Optimization)
                let responseBuffer = "";

                await chatService.sendMessage(text, userId, (token) => {
                    responseBuffer += token;

                    // Functional state update to always get latest messages
                    setMessages((prev) => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;

                        // Update the last message (the assistant's)
                        updated[lastIndex] = {
                            ...updated[lastIndex],
                            content: responseBuffer,
                        };
                        return updated;
                    });
                });
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        },
        [userId],
    );

    const deleteMessage = useCallback(async (messageId: string) => {
        try {
            await chatService.deleteMessage(messageId);
            setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        } catch (err: any) {
            setError(err.message || "Failed to delete message");
        }
    }, []);

    // useEffect(() => {
    //     fetchHistory();
    // }, [fetchHistory]);

    return {
        messages,
        loading,
        error,
        sendMessage,
        deleteMessage,
        // refresh: fetchHistory,
    };
}
