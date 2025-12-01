export enum LetterState {
  EMPTY = 'empty',
  ABSENT = 'absent',   // Gray
  PRESENT = 'present', // Yellow
  CORRECT = 'correct', // Green
}

export interface TileData {
  char: string;
  state: LetterState;
}

export interface Turn {
  word: string;
  tiles: TileData[];
}

export interface Suggestion {
  word: string;
  reasoning: string;
}

export enum GamePhase {
  TYPING = 'typing',
  COLORING = 'coloring',
  THINKING = 'thinking',
  GAME_OVER = 'game_over',
}

export const WORD_LENGTH = 5;
export const MAX_CHANCES = 6;
