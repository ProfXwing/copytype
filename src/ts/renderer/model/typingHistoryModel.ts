// [ [ms, letter, typo], ... ]
export type KeyPress = [number, string, (number | boolean)?];
export type TypingHistory = KeyPress[];