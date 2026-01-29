import { useState, useEffect, useCallback } from "react";
import { chatService } from "@/src/services/chatService";

export function useChat(userId: string) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await chatService.getHistory(userId);
            setMessages(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch chat history");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const sendMessage = useCallback(
        async (text: string) => {
            try {
                const userMessage = {
                    role: "user",
                    text: text,
                    timestamp: Date.now(),
                };
                
                setMessages((prev) => [...prev, userMessage]);

                const newMessage = await chatService.sendMessage(text, userId);

                setMessages((prev) => [...prev, newMessage.message]);
            } catch (err: any) {
                setError(err.message || "Failed to send message");
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

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return {
        messages,
        loading,
        error,
        sendMessage,
        deleteMessage,
        refresh: fetchHistory,
    };
}
