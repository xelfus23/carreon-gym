/**
 * Safely normalizes an HTTP base url into a valid WebSocket string format
 */
export function getWsUrl(baseUrl: string, path: string): string {
  try {
    const parsed = new URL(baseUrl);
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${parsed.host}${path}`;
  } catch {
    // Fallback if VITE_SERVER_URL is just a raw domain like "localhost:5000"
    const cleanedUrl = baseUrl.replace(/^https?:\/\//, "");
    return `ws://${cleanedUrl}${path}`;
  }
}