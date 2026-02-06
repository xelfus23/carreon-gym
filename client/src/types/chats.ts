export type ChatMessage = {
    id?: number; // Optional because optimistic messages won't have an ID yet
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    timestamp: number;
    aiStatus?: string;
    // Tool call support
    tool_calls?: {
        id: string;
        type: "function";
        function: {
            name: string;
            arguments: string;
        };
    }[];
    tool_call_id?: string; // Links tool result to the original call
    name?: string; // Tool name for tool role messages
};

export interface ThinkingProps {
    status: string;
}

export interface ChatBubbleProps {
    content: string;
    role: "user" | "assistant";
    index: number;
}
