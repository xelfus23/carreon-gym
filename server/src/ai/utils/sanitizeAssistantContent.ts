const THINK_BLOCK_REGEX = /<think>[\s\S]*?<\/think>/gi;
const UNCLOSED_THINK_BLOCK_REGEX = /<think>[\s\S]*$/gi;

// catch broken or partial tags
const THINK_OPEN_REGEX = /<think>/gi;
const THINK_CLOSE_REGEX = /<\/think>/gi;

// safer JSON-style ID cleanup (only inside AI leakage contexts)
const INTERNAL_ID_REGEX =
  /"(equipment_id|exercise_id|day_id|plan_id|workout_id|member_id|user_id|session_id)"\s*:\s*"?[a-z0-9_-]+"?/gi;

// key=value style leakage
const INTERNAL_ID_INLINE_REGEX =
  /\b(equipment_id|exercise_id|day_id|plan_id|workout_id|member_id|user_id|session_id)\b\s*[:=]\s*[a-z0-9_-]+/gi;

// optional: remove leftover dangling commas after cleanup
const TRAILING_COMMA_REGEX = /,\s*}/g;

export const sanitizeAssistantContent = (content?: string | null): string => {
  if (!content) return "";

  return content
    // full reasoning blocks
    .replace(THINK_BLOCK_REGEX, "")
    // dangling <think> without closing tag: drop everything after it
    .replace(UNCLOSED_THINK_BLOCK_REGEX, "")

    // broken tags
    .replace(THINK_OPEN_REGEX, "")
    .replace(THINK_CLOSE_REGEX, "")

    // structured JSON leakage
    .replace(INTERNAL_ID_REGEX, "")

    // inline key-value leakage
    .replace(INTERNAL_ID_INLINE_REGEX, "")

    // cleanup formatting artifacts
    .replace(/\n{3,}/g, "\n\n")
    .replace(TRAILING_COMMA_REGEX, "}")
    .trim();
};