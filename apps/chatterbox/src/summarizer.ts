export interface TurnText {
  q: string;
  a: string;
}

/**
 * Summarize a chunk of conversational turns into a detailed, context-rich memory.
 * If there is a previous memory, incorporate it.
 */
export async function createSummary(
  previousSummary: string | null,
  turns: TurnText[],
  model: string = 'claude-3-5-haiku-20241022'
): Promise<string> {
  let prompt = `You are a conversation summarization engine. Your goal is to compress a set of conversational turns into a dense, semantic memory.
This memory will be fed as context into future AI interactions.
It must capture all important facts, decisions, intent, and relationships discussed. Do NOT use fuzzy language like "the users discussed", instead write directly: "The hero animation relies on a spring model".

`;

  if (previousSummary) {
    prompt += `[PREVIOUS MEMORY]
${previousSummary}

`;
  }

  prompt += `[NEW CONVERSATION TURNS]
`;

  turns.forEach((t, i) => {
    prompt += `Turn ${i + 1}:\nUser: ${t.q}\nAssistant: ${t.a}\n\n`;
  });

  prompt += `Task: Generate a new, comprehensive memory that combines the PREVIOUS MEMORY (if any) and the NEW CONVERSATION TURNS. 
Return ONLY the new summarized memory text, without any introductory or concluding remarks.`;

  return await callClaude(model, prompt);
}

async function callClaude(model: string, prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: "You are a highly efficient text compression and context-preservation AI.",
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${err}`);
  }

  const json = await res.json() as any;
  return json.content[0].text.trim();
}
