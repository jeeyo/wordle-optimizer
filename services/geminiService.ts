/// <reference types="vite/client" />
import { Turn, Suggestion } from '../types';

export const getSuggestions = async (history: Turn[], signal?: AbortSignal): Promise<Suggestion[]> => {
  try {
    const apiUrl = '/api/suggestions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history }),
      signal, // Pass the abort signal to fetch
    });

    if (!response.ok) {
      throw new Error(`Worker error: ${response.statusText}`);
    }

    const suggestions = await response.json();
    return suggestions as Suggestion[];
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    // Re-throw AbortError so it can be handled properly
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return [{ word: "ERROR", reasoning: "Failed to fetch suggestions from backend." }];
  }
};
