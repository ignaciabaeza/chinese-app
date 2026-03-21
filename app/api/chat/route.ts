import Anthropic from "@anthropic-ai/sdk";
import { vocabulary } from "@/data/vocabulary";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Build a compact vocabulary reference for the system prompt
const vocabSummary = vocabulary
  .map(w => `${w.chinese} (${w.pinyin}) = ${w.english} [HSK${w.level}]`)
  .join("\n");

const SYSTEM_PROMPT = `You are a helpful Mandarin Chinese language tutor for a beginner student.
The student is studying HSK 1 and HSK 2 vocabulary. You help them understand Chinese grammar,
pronunciation, vocabulary, and culture.

Here is the complete HSK 1 and HSK 2 vocabulary list the student is working with:

${vocabSummary}

Guidelines:
- Always use pinyin alongside Chinese characters for new words
- Keep explanations clear and beginner-friendly
- When showing example sentences, break them down character by character if helpful
- Explain tones when relevant (1st tone ¯, 2nd tone ´, 3rd tone ˇ, 4th tone \`)
- Encourage the student and be positive
- If asked about a word not in HSK 1-2, you can still answer but note it's beyond their current level
- Use practical, everyday examples that relate to HSK vocabulary`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Invalid messages" }, { status: 400 });
    }

    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
            );
          }
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}
