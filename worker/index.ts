/// <reference types="@cloudflare/workers-types" />
import OpenAI from "openai";
import { Turn, LetterState } from '../types';

interface Env {
  OPENAI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/suggestions") {
      try {
        const { history } = await request.json() as { history: Turn[] };

        if (!env.OPENAI_API_KEY) {
          return new Response(JSON.stringify({ error: "API Key not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }

        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

        // Format history for the prompt
        const historyDescription = history.map((turn, i) => {
          const word = turn.word;
          const feedback = turn.tiles.map(t => {
            if (t.state === LetterState.CORRECT) return `${t.char}: Green (Correct Position)`;
            if (t.state === LetterState.PRESENT) return `${t.char}: Yellow (Wrong Position)`;
            return `${t.char}: Gray (Not in word)`;
          }).join(', ');
          return `Guess ${i + 1}: ${word} [${feedback}]`;
        }).join('\n');

        const systemInstruction = `You are a world-class Wordle solver and optimizer. 
        Your goal is to help the user solve the puzzle by suggesting the best possible next words based on the information gathered so far.
        
        Rules:
        1. Suggestions MUST be valid 5-letter English words.
        2. Suggestions MUST respect the "Green" (Correct) constraints: The letter must be in that exact position.
        3. Suggestions MUST respect the "Yellow" (Present) constraints: The letter must be in the word but NOT in that specific position.
        4. Suggestions MUST respect the "Gray" (Absent) constraints: The letter should not appear in the word (unless it appears elsewhere as Green/Yellow and this is just a duplicate check).
        5. Prioritize words that eliminate the most possibilities (information theory).
        6. Provide a brief, punchy reasoning for the top choice.
        `;

        const prompt = `
        Current Game History:
        ${historyDescription}

        Please analyze the game state and provide the top 5 recommended words to guess next.
        Return the response in JSON format.
        `;

        const completion = await openai.chat.completions.create({
          model: 'gpt-6-luna',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'wordle_suggestions',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        word: { type: 'string' },
                        reasoning: { type: 'string' }
                      },
                      required: ['word', 'reasoning'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['suggestions'],
                additionalProperties: false
              }
            }
          }
        });

        const text = completion.choices[0]?.message?.content;
        const data = text ? JSON.parse(text) : { suggestions: [] };

        return new Response(JSON.stringify(data.suggestions || []), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (error) {
        console.error("Error in worker:", error);
        return new Response(JSON.stringify({ error: "Failed to process request" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
