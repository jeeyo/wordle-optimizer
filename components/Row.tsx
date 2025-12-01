import React from 'react';
import Tile from './Tile';
import { TileData, LetterState, WORD_LENGTH } from '../types';

interface RowProps {
  tiles: TileData[];
  isActive?: boolean;
  isColoring?: boolean;
  onTileClick?: (index: number) => void;
  shake?: boolean;
}

const Row: React.FC<RowProps> = ({ tiles, isActive, isColoring, onTileClick, shake }) => {
  // Ensure we always render 5 tiles
  const displayTiles = [...tiles];
  while (displayTiles.length < WORD_LENGTH) {
    displayTiles.push({ char: '', state: LetterState.EMPTY });
  }

  return (
    <div className={`grid grid-cols-5 gap-[5px] mb-[5px] ${shake ? 'animate-pulse' : ''}`}>
      {displayTiles.map((tile, i) => (
        <Tile 
          key={i} 
          data={tile} 
          isActiveInput={isActive && !!tile.char}
          isInteractive={isColoring}
          onClick={() => isColoring && onTileClick && onTileClick(i)}
          animate={isColoring || (isActive === false && tile.state !== LetterState.EMPTY)}
        />
      ))}
    </div>
  );
};

export default Row;
