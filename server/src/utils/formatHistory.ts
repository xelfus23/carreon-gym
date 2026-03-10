export const formatChatHistory = async (
    chats: any, // Array of chat rows
    instructions: string, // Summarization instructions
    existingSummary?: string,
) => {
    const messages: any[] = [];

    if (existingSummary) {
        messages.push({
            role: "system",
            content: `Current conversation summary:\n${existingSummary}`,
        });
    }

    // Add instructions as another system message
    messages.push({
        role: "system",
        content: instructions,
    });

    console.log("CHATS: ", chats)

    chats.forEach((row: any) => {
        if (row.role === "tool") {
            messages.push({
                role: "tool",
                name: row.name || "unknown_tool",
                content: row.content,
                tool_call_id: row.tool_call_id || `tool_${Date.now()}`,
            });
        } else if (row.role === "assistant" && row.tool_calls) {
            messages.push({
                role: "assistant",
                content: row.content,
                tool_calls: row.tool_calls,
            });
        } else {
            messages.push({
                role: row.role,
                content: row.content,
            });
        }
    });

    return messages;
};
