export interface ToolCall {
    id: string;
    name: string;
    arguments: string;
}

export interface ChatMessage {
    role: "user" | "assistant" | "system" | "tool";
    content?: string;
    tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
            name: string;
            arguments: string;
        };
    }>;
    tool_call_id?: string;
}
