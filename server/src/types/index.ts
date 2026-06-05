import type { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: "member" | "trainer" | "admin";
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content?: string;
  name?: string;
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

export interface ProductProps {
  product_name: string;
  category: string;
  price: number;
  stocks: number;
  icon_url?: string;
  is_active?: boolean;
  last_restock?: string;
}

export type SubscriptionTypes = {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  savings_label?: string;
  is_popular?: boolean;
  icon_url: string;
  category: "membership" | "class" | "personal_training" | "add_on",
  description: string;
};