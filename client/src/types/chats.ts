export type ChatMessage = {
    id?: number | string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    timestamp?: number | string;
    aiStatus?: string;
    // tool_calls?: ToolCall[];
    // tool_call_id?: string;
    // name?: string;
};

export type ToolCall = {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
};

export interface ThinkingProps {
    status: string;
}

export interface ChatBubbleProps {
    message: ChatMessage;
    isStreaming?: boolean;
}
