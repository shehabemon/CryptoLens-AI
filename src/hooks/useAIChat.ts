import { useCallback, useRef } from "react";
import { useAIStore, type AIChatMessage } from "@/store/aiStore";
import { usePortfolio } from "@/hooks/usePortfolio";
import { buildPortfolioContext } from "@/lib/ai/contextBuilder";
import { getAccessToken, apiFetch } from "@/lib/api/client";

export function useAIChat() {
  const {
    messages,
    isStreaming,
    setStreaming,
    addMessage,
    appendToLastMessage,
    clearMessages,
  } = useAIStore();

  const { holdings, summary } = usePortfolio();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) return;

      // Add user message
      const userMsg: AIChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      addMessage(userMsg);

      // Create empty assistant message placeholder for streaming
      const assistantMsg: AIChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      addMessage(assistantMsg);
      setStreaming(true);

      // Build fresh context from current portfolio data
      const portfolioContext = buildPortfolioContext(holdings, summary);

      // Prepare messages for API (all conversation history)
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: content.trim() },
      ];

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const token = getAccessToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await apiFetch("/api/ai", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: apiMessages,
            portfolioContext,
          }),
          signal: controller.signal,
          credentials: "include",
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response stream");

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                appendToLastMessage(parsed.text);
              }
              if (parsed.error) {
                appendToLastMessage(`\n\n⚠️ Error: ${parsed.error}`);
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        const msg =
          error instanceof Error ? error.message : "Failed to get response";
        appendToLastMessage(
          `⚠️ ${msg}. Please check that the API server is running and your GEMINI_API_KEY is set.`
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [
      messages,
      holdings,
      summary,
      isStreaming,
      addMessage,
      appendToLastMessage,
      setStreaming,
    ]
  );

  const clearChat = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    clearMessages();
    setStreaming(false);
  }, [clearMessages, setStreaming]);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearChat,
    hasPortfolio: holdings.length > 0,
  };
}
