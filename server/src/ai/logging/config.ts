import { env } from "../../config/env.ts";

export type AiLogConfig = {
  enabled: boolean;
  redactSensitive: boolean;
  logPartialTokens: boolean;
  logDirectory: string;
  redactFields: Set<string>;
};

const DEFAULT_REDACT_FIELDS = [
  "password",
  "email",
  "phone",
  "phone_number",
  "accessToken",
  "refreshToken",
  "token",
  "api_key",
  "apiKey",
  "authorization",
  "GOOGLE_API_KEY",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

function resolveEnabled(): boolean {
  const explicitlyEnabled = process.env.AI_INTERACTION_LOG_ENABLED;
  if (explicitlyEnabled !== undefined && explicitlyEnabled.trim() !== "") {
    return parseBoolean(explicitlyEnabled, false);
  }

  const disableInProduction = parseBoolean(
    process.env.AI_INTERACTION_LOG_DISABLE_IN_PROD,
    true,
  );

  if (disableInProduction && env.NODE_ENV === "production") {
    return false;
  }

  // Enabled by default in non-production for thesis/research use.
  return env.NODE_ENV !== "production";
}

export const aiLogConfig: AiLogConfig = {
  enabled: resolveEnabled(),
  redactSensitive: parseBoolean(process.env.AI_INTERACTION_LOG_REDACT, true),
  logPartialTokens: parseBoolean(process.env.AI_INTERACTION_LOG_TOKENS, false),
  logDirectory:
    process.env.AI_INTERACTION_LOG_DIR ?? "logs/ai-interactions",
  redactFields: new Set(
    (process.env.AI_INTERACTION_LOG_REDACT_FIELDS ?? "")
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean)
      .concat(DEFAULT_REDACT_FIELDS),
  ),
};

export function isAiInteractionLoggingEnabled(): boolean {
  return aiLogConfig.enabled;
}
