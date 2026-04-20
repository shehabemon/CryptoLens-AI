import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIChat } from "@/hooks/useAIChat";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWatchlistStore } from "@/store/watchlistStore";
import { useMarketData } from "@/hooks/useMarketData";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { AIChatMessage } from "@/store/aiStore";

const COMMANDS = [
  { label: "Portfolio Summary", prompt: "Summarise my portfolio performance" },
  { label: "Best Performer", prompt: "Which of my holdings has the best return?" },
  { label: "BTC Trend", prompt: "What's Bitcoin's trend this week?" },
  { label: "Diversification", prompt: "How diversified is my portfolio?" },
];

export default function AIAnalyst() {
  useDocumentTitle("AI Analyst | CryptoLens-AI");
  const { messages, isStreaming, sendMessage, clearChat, hasPortfolio } =
    useAIChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-7rem)] md:h-[calc(100vh-5rem)] gap-0">
      {/* LEFT — CHAT PANEL (65%) */}
      <div className="flex-[65] min-w-0 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-4 flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-[#0f172a]">AI Analyst</h1>
            <p className="text-sm text-[#64748b] mt-0.5">
              Portfolio intelligence · Structured market reasoning
            </p>
          </div>
          {!isEmpty && (
            <button
              onClick={clearChat}
              className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
              aria-label="Clear chat history"
            >
              Clear
            </button>
          )}
        </div>

        {/* Chat Area */}
        <ErrorBoundary context="AI chat">
          <div className="flex-1 min-h-0 border border-[#e2e5ea] bg-white rounded-xl overflow-hidden flex flex-col shadow-card">
            <ScrollArea className="flex-1 h-full">
              <div
                className="p-0"
                role="log"
                aria-live="polite"
                aria-label="Chat messages"
              >
                {isEmpty ? (
                  <BootSequence hasPortfolio={hasPortfolio} />
                ) : (
                  messages.map((msg, i) => (
                    <MessageRow
                      key={msg.id}
                      message={msg}
                      isStreaming={
                        isStreaming &&
                        i === messages.length - 1 &&
                        msg.role === "assistant"
                      }
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Suggestion Commands — shown when chat is empty */}
            {isEmpty && (
              <div className="flex-shrink-0 border-t border-[#e2e5ea] px-4 py-3 flex flex-wrap gap-2" role="group" aria-label="Suggested prompts">
                {COMMANDS.map((cmd) => (
                  <button
                    key={cmd.label}
                    onClick={() => sendMessage(cmd.prompt)}
                    className="px-3 py-1.5 border border-[#e2e5ea] rounded-lg text-xs font-medium text-[#64748b] hover:border-[#2563eb] hover:text-[#2563eb] hover:bg-[#eff6ff] transition-all"
                    aria-label={`Ask: ${cmd.prompt}`}
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="flex-shrink-0 border-t border-[#e2e5ea] px-4 py-3 bg-[#f8f9fb]">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-white border border-[#e2e5ea] rounded-lg focus-within:border-[#2563eb] focus-within:ring-1 focus-within:ring-[#2563eb] transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      hasPortfolio
                        ? "Ask about your portfolio, markets, trends..."
                        : "Ask about crypto markets and trends..."
                    }
                    disabled={isStreaming}
                    className="flex-1 px-4 py-2.5 bg-transparent text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none disabled:opacity-50 border-0"
                    aria-label="Type your message"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8] disabled:opacity-30 px-4 py-2.5 transition-colors"
                    aria-label="Send message"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ErrorBoundary>
      </div>

      {/* VERTICAL DIVIDER */}
      <div className="w-px bg-[#e2e5ea] self-stretch flex-shrink-0 ml-6 hidden md:block" aria-hidden="true" />

      {/* RIGHT — MARKET CONTEXT PANEL (35%) */}
      <div className="hidden md:flex flex-[35] min-w-0 flex-col pl-6">
        <MarketContextPanel />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Boot Sequence (Empty State)
   ────────────────────────────────────────────── */

function BootSequence({ hasPortfolio }: { hasPortfolio: boolean }) {
  const [visibleLines, setVisibleLines] = useState(0);

  const lines = [
    "CryptoLens-AI Intelligence Terminal v2.1",
    "Connecting to market data feed... OK",
    hasPortfolio
      ? "Loading portfolio context... OK"
      : "Portfolio context... empty (add holdings for insights)",
    "Ready. Analyze your portfolio or market trends.",
  ];

  useEffect(() => {
    if (visibleLines >= lines.length) return;
    const timer = setTimeout(
      () => setVisibleLines((v) => v + 1),
      visibleLines === 0 ? 300 : 500
    );
    return () => clearTimeout(timer);
  }, [visibleLines, lines.length]);

  return (
    <div className="p-5 md:px-6 pt-6 space-y-2" role="status" aria-label="Initializing AI terminal">
      {lines.slice(0, visibleLines).map((line, i) => (
        <p
          key={i}
          className={`text-sm leading-relaxed ${i === lines.length - 1
              ? "text-[#2563eb] font-medium mt-3"
              : "text-[#94a3b8]"
            }`}
          style={{
            animation: "fadeSlideIn 0.3s ease-out forwards",
          }}
        >
          {line}
        </p>
      ))}
      {visibleLines < lines.length && (
        <span className="inline-block w-1.5 h-4 bg-[#2563eb] animate-pulse rounded-sm" aria-hidden="true" />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Message Row
   ────────────────────────────────────────────── */

function MessageRow({
  message,
  isStreaming,
}: {
  message: AIChatMessage;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";
  const isWaiting = isStreaming && message.content === "";

  return (
    <div
      className={`
        w-full px-5 py-4 text-sm leading-relaxed border-b border-[#f1f3f6]
        ${isUser
          ? "bg-[#f8f9fb]"
          : "bg-white"
        }
      `}
      role="article"
      aria-label={`${isUser ? "You" : "CryptoLens-AI"} message`}
    >
      {/* Prefix */}
      <span
        className={`text-xs font-semibold mr-2 ${isUser ? "text-[#2563eb]" : "text-[#94a3b8]"
          }`}
        aria-hidden="true"
      >
        {isUser ? "You" : "CryptoLens"}
      </span>

      {/* Content */}
      {isWaiting ? (
        <span className="text-[#94a3b8]">
          Analyzing
          <span className="inline-block w-1.5 h-3.5 bg-[#2563eb] ml-1 align-middle animate-pulse rounded-sm" aria-hidden="true" />
        </span>
      ) : (
        <span className="text-[#0f172a] whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3.5 bg-[#2563eb] ml-0.5 align-middle animate-pulse rounded-sm" aria-hidden="true" />
          )}
        </span>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Market Context Panel (Right Side)
   ────────────────────────────────────────────── */

function MarketContextPanel() {
  const { holdings, summary } = usePortfolio();
  const { watchedIds } = useWatchlistStore();
  const { data: assets } = useMarketData();

  const watchedAssets = assets?.filter((a) => watchedIds.includes(a.id)) ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-4 flex-shrink-0">
        <h2 className="text-sm font-semibold text-[#0f172a]">Live Context</h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">Data injected into AI requests</p>
      </div>

      {/* Context Content */}
      <div className="flex-1 min-h-0 border border-[#e2e5ea] bg-white rounded-xl overflow-hidden flex flex-col shadow-card">
        <ScrollArea className="flex-1 h-full">
          <div className="p-4 space-y-5">
            {/* Portfolio Holdings */}
            <div>
              <h3 className="text-xs font-semibold text-[#64748b] mb-2">
                Portfolio ({holdings.length})
              </h3>
              {holdings.length === 0 ? (
                <p className="text-xs text-[#94a3b8]">
                  No holdings — add via Portfolio page
                </p>
              ) : (
                <div className="space-y-0">
                  {/* Column Headers */}
                  <div className="flex items-center gap-1 py-1.5 border-b border-[#f1f3f6]">
                    <span className="text-[10px] font-medium text-[#94a3b8] uppercase flex-1">Symbol</span>
                    <span className="text-[10px] font-medium text-[#94a3b8] uppercase w-12 text-right">Qty</span>
                    <span className="text-[10px] font-medium text-[#94a3b8] uppercase w-16 text-right">P&L</span>
                  </div>
                  {holdings.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center gap-1 py-2 border-b border-[#f1f3f6]/60"
                    >
                      <span className="text-sm font-medium text-[#0f172a] flex-1">
                        {h.symbol}
                      </span>
                      <span
                        className="text-xs font-mono text-[#64748b] w-12 text-right"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {h.amount}
                      </span>
                      <span
                        className={`text-xs font-mono w-16 text-right font-medium ${h.pnl >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"
                          }`}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {h.pnl >= 0 ? "+" : ""}
                        {formatPercent(h.pnlPercent).replace("+", "")}
                      </span>
                    </div>
                  ))}
                  {/* Summary Row */}
                  <div className="flex items-center gap-1 pt-2.5">
                    <span className="text-xs font-medium text-[#64748b] flex-1">
                      Total
                    </span>
                    <span
                      className={`text-xs font-mono font-semibold ${summary.totalPnl >= 0
                          ? "text-[#16a34a]"
                          : "text-[#dc2626]"
                        }`}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatCurrency(summary.totalValue)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e2e5ea]" aria-hidden="true" />

            {/* Watchlist */}
            <div>
              <h3 className="text-xs font-semibold text-[#64748b] mb-2">
                Watchlist ({watchedAssets.length})
              </h3>
              {watchedAssets.length === 0 ? (
                <p className="text-xs text-[#94a3b8]">
                  No watched assets
                </p>
              ) : (
                <div className="space-y-0">
                  {watchedAssets.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-1 py-2 border-b border-[#f1f3f6]/60"
                    >
                      <span className="text-sm font-medium text-[#0f172a] flex-1">
                        {a.symbol}
                      </span>
                      <span
                        className="text-xs font-mono text-[#64748b]"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatCurrency(a.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer disclaimer */}
        <div className="flex-shrink-0 border-t border-[#e2e5ea] px-4 py-2.5 bg-[#f8f9fb]">
          <p className="text-[10px] text-[#94a3b8] leading-relaxed">
            This data is injected into every AI request
          </p>
        </div>
      </div>
    </div>
  );
}
