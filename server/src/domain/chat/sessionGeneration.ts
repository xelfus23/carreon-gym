const activeGenerations = new Set<number>();

export const markSessionGenerating = (sessionId: number) => {
  activeGenerations.add(sessionId);
};

export const clearSessionGenerating = (sessionId: number) => {
  activeGenerations.delete(sessionId);
};

export const isSessionGenerating = (sessionId: number) =>
  activeGenerations.has(sessionId);
