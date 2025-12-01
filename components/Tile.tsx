import React from 'react';
import { LetterState, TileData } from '../types';
import { COLORS } from '../constants';

interface TileProps {
  data: TileData;
  isActiveInput?: boolean;
  isInteractive?: boolean;
  onClick?: () => void;
  animate?: boolean;
}

const Tile: React.FC<TileProps> = ({ data, isActiveInput, isInteractive, onClick, animate }) => {
  const { char, state } = data;
  
  // Style calculation
  let className = "w-[58px] h-[58px] border-2 flex items-center justify-center text-3xl font-bold uppercase select-none transition-all duration-250 ";
  
  if (state === LetterState.EMPTY) {
     // Active input border is lighter
     className += isActiveInput ? "border-[#565758] text-white animate-pop" : "border-[#3a3a3c] text-white";
  } else {
     // Colored states (border matches background usually)
     className += `text-white border-transparent ${COLORS[state]} `;
     if (animate) className += "animate-flip ";
  }

  if (isInteractive) {
    className += " cursor-pointer hover:opacity-90 ring-2 ring-offset-2 ring-offset-[#121213] ring-gray-500";
  }

  return (
    <div className={className} onClick={isInteractive ? onClick : undefined}>
      {char}
    </div>
  );
};

export default Tile;
