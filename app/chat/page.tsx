"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "How do I say 'I am hungry' in Chinese?",
  "What's the difference between 是 and 有?",
  "Explain the four tones with examples",
  "How do I ask for the bill at a restaurant?",
  "What does 你好吗 mean?",
  "Explain how to use 的, 地, and 得",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const { text } = JSON.parse(data);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + text,
                };
                return updated;
              });
            } catch {}
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Sorry, there was an error. Please check your API key and try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "var(--sage-circle)",
            border: "2px solid var(--bg-primary)",
            boxShadow: "0 0 0 1px var(--sage-circle)",
          }}
        >
          <span style={{ color: "var(--bg-primary)", fontSize: "1.1rem", fontFamily: "'Noto Serif SC', serif", fontWeight: 500 }}>先</span>
        </div>
        <div>
          <h1 style={{ color: "var(--ink-dark)", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", fontWeight: 500 }}>
            AI Chinese Tutor
          </h1>
          <p className="text-xs" style={{ color: "var(--ink-faint)", fontFamily: "Lora, serif" }}>
            Powered by Claude · Knows HSK 1–6 vocabulary
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="space-y-5">
            <div className="text-center py-8">
              <div
                className="text-4xl mb-3"
                style={{ color: "var(--ink-dark)", fontFamily: "'Noto Serif SC', serif", fontWeight: 300 }}
              >
                学
              </div>
              <p style={{ color: "var(--ink-faint)", fontFamily: "Lora, serif", fontSize: "0.95rem", lineHeight: 1.85 }}>
                Ask me anything about Chinese!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm px-4 py-3 transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-ink)",
                    color: "var(--ink-faint)",
                    fontFamily: "Lora, serif",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(184,104,112,0.4)";
                    e.currentTarget.style.color = "var(--ink-dark)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-ink)";
                    e.currentTarget.style.color = "var(--ink-faint)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 mt-1 shrink-0"
                style={{
                  background: "var(--sage-circle)",
                  border: "none",
                  color: "var(--bg-primary)",
                  fontFamily: "'Noto Serif SC', serif",
                  fontWeight: 500,
                }}
              >
                先
              </div>
            )}
            <div
              className="max-w-[85%] px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? {
                      background: "rgba(184,104,112,0.07)",
                      border: "1px solid rgba(184,104,112,0.2)",
                      color: "var(--ink-dark)",
                      borderBottomRightRadius: "0.25rem",
                      borderRadius: "2px",
                      fontFamily: "Lora, serif",
                    }
                  : {
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-ink)",
                      color: "var(--ink-dark)",
                      borderBottomLeftRadius: "0.25rem",
                      borderRadius: "2px",
                      fontFamily: "Lora, serif",
                    }
              }
            >
              {msg.content ? (
                formatMessage(msg.content)
              ) : (
                <span style={{ color: "var(--ink-faint)", fontStyle: "italic" }}>Thinking…</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        className="p-3 flex gap-3 items-end"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-ink)",
          borderRadius: "2px",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Chinese grammar, vocabulary, tones…"
          rows={1}
          className="flex-1 resize-none focus:outline-none text-sm leading-6"
          style={{
            background: "transparent",
            color: "var(--ink-dark)",
            fontFamily: "Lora, serif",
            maxHeight: "8rem",
          }}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = t.scrollHeight + "px";
          }}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="shrink-0 flex items-center justify-center transition-all"
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: input.trim() && !loading ? "var(--blush-pink)" : "rgba(154,144,128,0.3)",
            color: input.trim() && !loading ? "var(--bg-primary)" : "var(--ink-faint)",
            border: "none",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18,
          }}
        >
          {loading ? (
            <span className="animate-spin inline-block" style={{ fontSize: "0.85rem" }}>◌</span>
          ) : "↑"}
        </button>
      </div>
      <p className="text-xs text-center mt-2" style={{ color: "rgba(44,36,22,0.3)", fontFamily: "'Cormorant SC', serif", letterSpacing: "0.08em" }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

function formatMessage(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} style={{ color: "var(--blush-deep)", fontWeight: 600 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="px-1 rounded text-xs"
              style={{ background: "rgba(184,104,112,0.08)", color: "var(--blush-deep)" }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part.split("\n").map((line, j, arr) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ));
      })}
    </span>
  );
}
