import Anthropic from "@anthropic-ai/sdk";
import { getAllWords } from "@/lib/content";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Compact vocabulary reference built from authored lessons.
function buildVocabSummary(): string {
  const lines: string[] = [];
  for (const level of [1, 2, 3, 4] as const) {
    const words = getAllWords(level);
    for (const w of words) {
      lines.push(`${w.hanzi} (${w.pinyin}) = ${w.english} [HSK${level} L${w.lessonNumber}]`);
    }
  }
  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are a helpful Mandarin Chinese language tutor following the HSK Standard Course curriculum (Beijing Language and Culture University Press). The student is studying HSK 1 through HSK 4. You help with vocabulary, grammar, pronunciation, characters, and culture.

Here are the words the student has covered so far (in lesson order):

${buildVocabSummary()}

Guidelines:
- Always show pinyin with tone marks alongside Chinese characters for new words.
- Keep explanations clear and beginner-friendly.
- When showing example sentences, break them down character by character if helpful.
- Reference HSK lessons by number when relevant (e.g., "this is from HSK 1 Lesson 3").
- If asked about a word beyond the student's current coverage, you can still answer but note the level.
- Use practical, everyday examples that connect to HSK content.`;

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
