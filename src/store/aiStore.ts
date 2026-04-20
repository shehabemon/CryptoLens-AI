import { create } from "zustand";

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIState {
  messages: AIChatMessage[];
  isStreaming: boolean;
  setStreaming: (streaming: boolean) => void;
  addMessage: (msg: AIChatMessage) => void;
  appendToLastMessage: (text: string) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  isStreaming: false,
  setStreaming: (isStreaming) => set({ isStreaming }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  appendToLastMessage: (text) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: last.content + text };
      }
      return { messages: msgs };
    }),
  clearMessages: () => set({ messages: [] }),
}));
