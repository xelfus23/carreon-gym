/**
 * Streaming Controller
 *
 * Owns the canonical streaming message state. Receives events from chat.service
 * (pure transport layer) and notifies subscribers (UI components).
 *
 * This maintains the separation of concerns:
 * - chat.service: WebSocket transport only
 * - streaming.controller: Application state management
 * - useChat: React integration and UI logic
 */

export type StreamingMessage = {
  id: string;
  sessionId: number;
  content: string;
  aiStatus: string;
};

let currentStreamingMessage: StreamingMessage | null = null;
const subscribers = new Set<(msg: StreamingMessage | null) => void>();

/**
 * Start a new streaming session.
 * Called when sendMessage initiates the connection.
 */
export const startStreaming = (
  sessionId: number,
  tempId: string,
): void => {
  currentStreamingMessage = {
    id: tempId,
    sessionId,
    content: "",
    aiStatus: "Thinking...",
  };
  notifySubscribers();
};

/**
 * Process an incoming token from the WebSocket.
 * Called by chat.service when data.type === "token".
 */
export const onToken = (token: string): void => {
  if (currentStreamingMessage) {
    currentStreamingMessage.content += token;
    notifySubscribers();
  }
};

/**
 * Process a state update from the WebSocket.
 * Called by chat.service when data.type === "state".
 */
export const onState = (state: string): void => {
  if (currentStreamingMessage) {
    currentStreamingMessage.aiStatus = state;
    notifySubscribers();
  }
};

/**
 * Mark streaming as complete.
 * Called by chat.service when data.type === "done" or on error.
 */
export const onDone = (): void => {
  currentStreamingMessage = null;
  notifySubscribers();
};

/**
 * Subscribe to streaming updates.
 * Returns unsubscribe function for cleanup.
 *
 * Key behavior: If streaming is active when subscribed,
 * immediately notifies with current state. This handles
 * component remount during active stream.
 */
export const subscribeToStreaming = (
  callback: (msg: StreamingMessage | null) => void,
): (() => void) => {
  subscribers.add(callback);

  // Immediate notification if streaming active
  // This is critical: when a component remounts during streaming,
  // it gets the current state immediately instead of missing tokens.
  if (currentStreamingMessage) {
    callback(currentStreamingMessage);
  }

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
  };
};

/**
 * Internal: Notify all subscribers of state change.
 */
const notifySubscribers = (): void => {
  subscribers.forEach((cb) => cb(currentStreamingMessage));
};

/**
 * Get current streaming state (for debugging or external checks).
 */
export const getCurrentStreamingMessage = (): StreamingMessage | null => {
  return currentStreamingMessage;
};

/**
 * Clear streaming state and subscribers (for cleanup/logout).
 */
export const reset = (): void => {
  currentStreamingMessage = null;
  subscribers.clear();
};
