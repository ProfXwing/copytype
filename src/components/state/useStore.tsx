import { create } from "zustand";
import { TypedCharsSlice, createTypedCharsSlice } from "./typedChars";
import { TypingStatsSlice, createTypingStatsSlice } from "./typingStats";

export const useStore = create<TypedCharsSlice & TypingStatsSlice>()((...a) => ({
  ...createTypedCharsSlice(...a),
  ...createTypingStatsSlice(...a),
}));
