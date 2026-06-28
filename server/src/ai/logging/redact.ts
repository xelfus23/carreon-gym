import { aiLogConfig } from "./config.ts";

const REDACTED = "[REDACTED]";

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();
  for (const field of aiLogConfig.redactFields) {
    if (normalized === field.toLowerCase()) return true;
  }
  return false;
}

/** Deep-clones and redacts sensitive fields for log persistence. */
export function redactForLog<T>(value: T): T {
  if (!aiLogConfig.redactSensitive) {
    return structuredClone(value);
  }

  return redactValue(value) as T;
}

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = shouldRedactKey(key) ? REDACTED : redactValue(nested);
    }
    return result;
  }

  if (typeof value === "string") {
    return redactStringPatterns(value);
  }

  return value;
}

function redactStringPatterns(input: string): string {
  let result = input;

  // Email addresses
  result = result.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    REDACTED,
  );

  // Bearer tokens
  result = result.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, `Bearer ${REDACTED}`);

  return result;
}
