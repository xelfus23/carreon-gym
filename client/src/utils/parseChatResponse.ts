export const parseResponse = (rawContent: string | null | undefined) => {
    // Handle null/undefined gracefully
    if (!rawContent || typeof rawContent !== "string") {
        return { thought: null, content: "", isThinking: false };
    }

    if (!rawContent.startsWith("[THINK]")) {
        return { thought: null, content: rawContent };
    }

    const endTag = "[/THINK]";
    const endIndex = rawContent.indexOf(endTag);

    if (endIndex === -1) {
        return {
            thought: rawContent.replace("[THINK]", "").trim(),
            content: "",
            isThinking: true,
        };
    }

    const thought = rawContent
        .substring(0, endIndex)
        .replace("[THINK]", "")
        .trim();
    const content = rawContent.substring(endIndex + endTag.length).trim();

    return { thought, content, isThinking: false };
};
