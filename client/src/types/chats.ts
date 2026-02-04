export type ChatMessage = {
    id?: number; // Optional because optimistic messages won't have an ID yet
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
};

export interface ThinkingProps {
    thought: string;
    isThinking: boolean;
}

export interface ChatBubbleProps {
    content: string;
    role: "user" | "assistant";
    index: number;
}
