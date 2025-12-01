import React from 'react';
import { KEYBOARD_ROWS } from '../constants';
import { LetterState } from '../types';

interface KeyboardProps {
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  usedLetters: Map<string, LetterState>;
  enterLabel?: string;
  isSpecialAction?: boolean;
}

const Keyboard: React.FC<KeyboardProps> = ({ 
  onChar, 
  onDelete, 
  onEnter, 
  usedLetters,
  enterLabel = "ENTER",
  isSpecialAction = false
}) => {
  
  const getKeyStyle = (key: string) => {
    const state = usedLetters.get(key);
    let base = "h-[58px] rounded font-bold text-sm flex items-center justify-center cursor-pointer transition-colors uppercase select-none ";
    
    if (state === LetterState.CORRECT) return base + "bg-[#538d4e] text-white";
    if (state === LetterState.PRESENT) return base + "bg-[#b59f3b] text-white";
    if (state === LetterState.ABSENT) return base + "bg-[#3a3a3c] text-white";
    return base + "bg-[#818384] text-white hover:bg-[#9e9e9e]";
  };

  return (
    <div className="w-full max-w-[500px] px-2">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex justify-center mb-2 w-full gap-1.5">
          {i === 2 && (
             <div 
              onClick={onEnter} 
              className={`h-[58px] flex-[1.5] rounded font-bold text-xs flex items-center justify-center cursor-pointer uppercase select-none transition-all duration-200 ${
                isSpecialAction 
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg" 
                : "bg-[#818384] text-white hover:bg-[#9e9e9e]"
              }`}
             >
               {enterLabel}
             </div>
          )}

          {row.map((key) => (
            <div
              key={key}
              onClick={() => onChar(key)}
              className={`${getKeyStyle(key)} flex-1`}
            >
              {key}
            </div>
          ))}

          {i === 2 && (
            <div
              onClick={onDelete}
              className="h-[58px] flex-[1.5] rounded font-bold text-sm flex items-center justify-center cursor-pointer bg-[#818384] text-white uppercase select-none hover:bg-[#9e9e9e]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
                <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"></path>
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;