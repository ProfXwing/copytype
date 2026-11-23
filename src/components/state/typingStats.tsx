import { StateCreator } from "zustand";
import { TypingStats } from "../../routes/library/book";

export interface TypingStatsSlice {
  typingStats: TypingStats,
  setTypingStats: (newTypingStats: TypingStats) => void
}

export const createTypingStatsSlice: StateCreator<TypingStatsSlice> = (set) => ({
  typingStats: {
    bookCharIndex: 0,
    sessions: 0,
    typedChars: 0,
    correctChars: 0,
    timeTyping: 0,
  },
  setTypingStats: (newTypingStats) => set(() => ({ typingStats: newTypingStats }))
});

