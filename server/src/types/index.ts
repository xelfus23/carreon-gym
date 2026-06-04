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

export type SubscriptionPlanProps = {
  name: string;
  icon_url: string;
  description: string | null;
  price: number;
  duration_days: number;
  category: "personal_training" | "class" | "membership" | "add_on";
  is_active: boolean;
}