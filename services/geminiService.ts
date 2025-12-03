/// <reference types="vite/client" />
import { Turn, Suggestion } from '../types';

export const getSuggestions = async (history: Turn[]): Promise<Suggestion[]> => {
  try {
    // In development, point to the default Wrangler port (8787)
    // In production, the worker serves the assets, so relative path works
    const apiUrl = import.meta.env.DEV ? 'http://localhost:8787/api/suggestions' : '/api/suggestions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history }),
    });

    if (!response.ok) {
      throw new Error(`Worker error: ${response.statusText}`);
    }

    const suggestions = await response.json();
    return suggestions as Suggestion[];
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [{ word: "ERROR", reasoning: "Failed to fetch suggestions from backend." }];
  }
};
