export const formatChatHistory = async (
    chats: any,
    instructions: string,
    mode: "chat" | "summary" = "chat",
) => {
    const messages: any[] = [];

    messages.push({
        role: "system",
        content: instructions,
    });

    chats.forEach((row: any) => {
        // ── SUMMARY MODE: clean text only, no tool noise ──
        if (mode === "summary") {
            if (row.role === "user" || row.role === "assistant") {
                const content =
                    typeof row.content === "string" ? row.content : "";
                if (!content.trim()) return; // skip empty messages
                messages.push({ role: row.role, content });
            }
            return; // skip tool roles entirely
        }

        if (row.role === "tool") {
            messages.push({
                role: "tool",
                name: row.name || "unknown_tool",
                content: row.content,
                tool_call_id: row.tool_call_id || `tool_${Date.now()}`,
            });
        } else if (row.role === "assistant" && row.tool_calls?.length > 0) {
            messages.push({
                role: "assistant",
                content: row.content ?? "",
                tool_calls: row.tool_calls,
            });
        } else {
            const content = typeof row.content === "string" ? row.content : "";
            if (!content.trim()) return;
            messages.push({ role: row.role, content });
        }
    });

    return messages;
};
