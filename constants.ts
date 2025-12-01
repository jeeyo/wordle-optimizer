import { LetterState } from './types';

export const COLORS = {
  [LetterState.EMPTY]: 'border-[#3a3a3c] bg-transparent',
  [LetterState.ABSENT]: 'bg-[#3a3a3c] border-[#3a3a3c]',
  [LetterState.PRESENT]: 'bg-[#b59f3b] border-[#b59f3b]',
  [LetterState.CORRECT]: 'bg-[#538d4e] border-[#538d4e]',
};

export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];
