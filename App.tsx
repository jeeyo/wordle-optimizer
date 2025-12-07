import React, { useState, useEffect, useCallback } from 'react';
import { Turn, TileData, LetterState, GamePhase, Suggestion, WORD_LENGTH, MAX_CHANCES } from './types';
import Row from './components/Row';
import Keyboard from './components/Keyboard';
import { getSuggestions } from './services/geminiService';

// Pre-calculated optimal starting strategy
const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    word: "SALET",
    reasoning: "Maximizes entropy. Tests high-frequency letters (S, A, L, E, T) to statistically eliminate the most incorrect answers."
  },
  {
    word: "CRANE",
    reasoning: "Classic bot favorite. Offers an excellent balance of common vowels (A, E) and consonants (C, R, N) in optimal positions."
  },
  {
    word: "TRACE",
    reasoning: "Strong positional opener. Helps identify common consonant clusters early, often leaving manageable patterns."
  }
];

const App: React.FC = () => {
  // State
  const [history, setHistory] = useState<Turn[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [phase, setPhase] = useState<GamePhase>(GamePhase.TYPING);
  // Initialize with the optimal strategy so the user sees it immediately
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ref to track and cancel ongoing analysis
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Key Handler
  const handleChar = useCallback((char: string) => {
    if (phase !== GamePhase.TYPING || history.length >= MAX_CHANCES) return;
    if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => prev + char.toUpperCase());
    }
  }, [phase, history.length, currentGuess]);

  const handleDelete = useCallback(() => {
    if (phase !== GamePhase.TYPING) return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [phase]);

  // Submit Feedback & Get AI Suggestions
  const analyzeTurn = useCallback(async () => {
    // Create a new AbortController for this analysis
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setPhase(GamePhase.THINKING);
    setSuggestionsLoading(true);

    // Check for win condition (all green)
    const lastTurn = history[history.length - 1];
    const isWin = lastTurn.tiles.every(t => t.state === LetterState.CORRECT);

    if (isWin) {
      setSuggestions([{ word: "WINNER!", reasoning: "Great job! You solved the puzzle." }]);
      setSuggestionsLoading(false);
      setPhase(GamePhase.GAME_OVER);
      abortControllerRef.current = null;
      return;
    }

    if (history.length >= MAX_CHANCES) {
      setSuggestions([{ word: "GAME OVER", reasoning: "Better luck next time." }]);
      setSuggestionsLoading(false);
      setPhase(GamePhase.GAME_OVER);
      abortControllerRef.current = null;
      return;
    }

    try {
      const newSuggestions = await getSuggestions(history, abortController.signal);

      // Check if this request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      setSuggestions(newSuggestions);
    } catch (e: any) {
      // Don't show error if request was aborted
      if (e.name === 'AbortError') {
        console.log('Analysis cancelled by user');
        return;
      }

      console.error(e);
      setSuggestions([{ word: "ERROR", reasoning: "AI Error. Try again." }]);
    } finally {
      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        setSuggestionsLoading(false);
        setPhase(GamePhase.TYPING);
      }
      abortControllerRef.current = null;
    }
  }, [history]);

  // Cancel ongoing analysis
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSuggestionsLoading(false);
    setPhase(GamePhase.TYPING);
  }, []);

  const handleEnter = useCallback(() => {
    if (phase === GamePhase.TYPING) {
      if (currentGuess.length !== WORD_LENGTH) {
        setErrorMsg("Not enough letters");
        setTimeout(() => setErrorMsg(null), 1000);
        return;
      }

      // Move to coloring phase
      // Add the word to history with default ABSENT (Gray) state, allowing user to modify
      const newTurn: Turn = {
        word: currentGuess,
        tiles: currentGuess.split('').map(char => ({ char, state: LetterState.ABSENT }))
      };

      setHistory(prev => [...prev, newTurn]);
      setCurrentGuess('');
      setPhase(GamePhase.COLORING);
    } else if (phase === GamePhase.COLORING) {
      analyzeTurn();
    } else if (phase === GamePhase.THINKING) {
      cancelAnalysis();
    }
  }, [phase, currentGuess, analyzeTurn, cancelAnalysis]);

  // Handler for ESC key to cancel analysis
  const handleEscape = useCallback(() => {
    if (phase === GamePhase.THINKING) {
      cancelAnalysis();
    }
  }, [phase, cancelAnalysis]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleEnter();
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Escape') handleEscape();
      else if (/^[a-zA-Z]$/.test(e.key)) handleChar(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter, handleDelete, handleChar, handleEscape]);

  // Tile Click Handler (for toggling colors)
  const handleTileClick = (index: number) => {
    if (phase !== GamePhase.COLORING) return;

    // Modify the last entry in history
    setHistory(prev => {
      const newHistory = [...prev];
      const lastTurn = { ...newHistory[newHistory.length - 1] };
      const tiles = [...lastTurn.tiles];

      // Cycle: ABSENT (Gray) -> PRESENT (Yellow) -> CORRECT (Green) -> ABSENT
      const currentState = tiles[index].state;
      let nextState = LetterState.ABSENT;
      if (currentState === LetterState.ABSENT) nextState = LetterState.PRESENT;
      else if (currentState === LetterState.PRESENT) nextState = LetterState.CORRECT;
      else if (currentState === LetterState.CORRECT) nextState = LetterState.ABSENT;

      tiles[index] = { ...tiles[index], state: nextState };
      lastTurn.tiles = tiles;
      newHistory[newHistory.length - 1] = lastTurn;
      return newHistory;
    });
  };

  const applySuggestion = (word: string) => {
    if (phase !== GamePhase.TYPING) return;
    setCurrentGuess(word);
  };

  // Calculate used letters for keyboard coloring
  const getUsedLetters = () => {
    const map = new Map<string, LetterState>();
    history.forEach(turn => {
      turn.tiles.forEach(tile => {
        const currentBest = map.get(tile.char);
        // Green > Yellow > Gray
        if (tile.state === LetterState.CORRECT) {
          map.set(tile.char, LetterState.CORRECT);
        } else if (tile.state === LetterState.PRESENT && currentBest !== LetterState.CORRECT) {
          map.set(tile.char, LetterState.PRESENT);
        } else if (tile.state === LetterState.ABSENT && !currentBest) {
          map.set(tile.char, LetterState.ABSENT);
        }
      });
    });
    return map;
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-lg mx-auto relative pt-2 pb-2 overflow-hidden">

      {/* Header */}
      <header className="border-b border-[#3a3a3c] w-full flex items-center justify-between px-4 pb-2 mb-2 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold tracking-wider">WORDLE <span className="text-sm font-normal text-purple-400">OPTIMIZER</span></h1>
        <div className="flex gap-2">
          <button className="text-[#818384] hover:text-white" onClick={() => window.location.reload()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
          </button>
        </div>
      </header>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-start min-h-0 px-2 scrollbar-thin">
        {/* Render History Rows */}
        {history.map((turn, i) => (
          <Row
            key={i}
            tiles={turn.tiles}
            isColoring={phase === GamePhase.COLORING && i === history.length - 1}
            onTileClick={handleTileClick}
          />
        ))}

        {/* Render Current Typing Row (if game active) */}
        {history.length < MAX_CHANCES && phase !== GamePhase.GAME_OVER && (
          <Row
            tiles={
              phase === GamePhase.COLORING ? [] : // If coloring, the "current" row is actually the last history row, handled above
                [...currentGuess.split('').map(c => ({ char: c, state: LetterState.EMPTY }))]
            }
            isActive={phase === GamePhase.TYPING}
          />
        )}

        {/* Render Empty Rows */}
        {Array.from({ length: Math.max(0, MAX_CHANCES - 1 - history.length - (phase === GamePhase.COLORING ? -1 : 0)) }).map((_, i) => (
          <Row key={`empty-${i}`} tiles={[]} />
        ))}
      </div>

      {/* Messages / Errors */}
      {errorMsg && (
        <div className="absolute top-[12%] z-50 bg-white text-black px-3 py-2 rounded font-bold shadow-lg">
          {errorMsg}
        </div>
      )}

      {/* Action / Suggestions Area */}
      <div className="w-full px-2 mb-1 shrink-0">
        {phase === GamePhase.COLORING && (
          <div className="flex flex-col items-center animate-pop py-2">
            <p className="text-sm text-gray-300 font-medium text-center">Tap tiles to change colors, then press <span className="text-indigo-400 font-bold">SOLVE</span></p>
          </div>
        )}

        {phase === GamePhase.THINKING && (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
            <p className="text-sm text-gray-400">Consulting the oracle...</p>
          </div>
        )}

        {phase === GamePhase.TYPING && suggestions.length > 0 && (
          <div className="bg-[#1e1e1f] rounded-lg p-2 border border-[#3a3a3c] max-h-[140px] overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-400 uppercase">
                {history.length === 0 ? "Recommended Starters" : "AI Suggestions"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {suggestions.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#2c2c2e] p-2 rounded cursor-pointer hover:bg-[#3a3a3c]" onClick={() => applySuggestion(s.word)}>
                  <span className="font-bold text-green-400 w-16">{s.word}</span>
                  <span className="text-xs text-gray-300 flex-1 ml-2 leading-tight">{s.reasoning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === GamePhase.GAME_OVER && (
          <div className="text-center py-2">
            <h2 className="text-xl font-bold mb-1 text-white">
              {suggestions[0]?.word || "Complete"}
            </h2>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#538d4e] px-4 py-2 rounded font-bold uppercase text-sm"
            >
              New Game
            </button>
          </div>
        )}
      </div>

      {/* Keyboard */}
      <div className="w-full flex justify-center pb-[env(safe-area-inset-bottom)] shrink-0">
        <Keyboard
          onChar={handleChar}
          onDelete={handleDelete}
          onEnter={handleEnter}
          usedLetters={getUsedLetters()}
          enterLabel={
            phase === GamePhase.THINKING ? "CANCEL" :
              phase === GamePhase.COLORING ? "SOLVE" :
                "ENTER"
          }
          isSpecialAction={phase === GamePhase.COLORING || phase === GamePhase.THINKING}
        />
      </div>

    </div>
  );
};

export default App;