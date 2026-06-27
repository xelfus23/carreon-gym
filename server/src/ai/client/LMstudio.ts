import { env } from "../../config/env.ts";
import { model } from "../../config/models.ts";
import type { ChatMessage } from "../../types/index.ts";
import { tools } from "../tools/toolRegistry.ts";

const LMSTUDIO_REQUEST_TIMEOUT_MS = 30000;

export const LMstudio = async (messages: ChatMessage[], options?: {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    LMSTUDIO_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(env.LMSTUDIO_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model.gema_12b,
        stream: true,
        messages: messages,
        tools: tools,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ LM Studio error:", text);
      throw new Error(
        text || `LM Studio request failed with status ${response.status}`,
      );
    }

    if (!response.body) {
      throw new Error("LM Studio returned an empty response body");
    }

    return response.body;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("LM Studio request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};
