import type { Request, Response, NextFunction } from "express";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

const SYSTEM_PROMPT = `You are CryptoLens-AI, a concise financial market analyst assistant. You have access to the user's live portfolio data provided in the context. Answer questions about their portfolio, explain market movements, and give data-driven insights. Be specific, reference actual numbers from their portfolio data. Keep responses concise — 3-5 sentences unless a detailed breakdown is specifically requested. Never give financial advice or tell users to buy or sell. Always clarify you are an AI assistant.`;

export async function chat(req: Request, res: Response, next: NextFunction) {
  try {
    const { messages, portfolioContext } = req.body;

    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    const systemPrompt = portfolioContext
      ? `${SYSTEM_PROMPT}\n\nCurrent Portfolio Data:\n${portfolioContext}`
      : `${SYSTEM_PROMPT}\n\nNote: The user has no portfolio holdings yet.`;

    // Convert chat messages to Gemini format
    const contents = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: unknown) {
    logger.error({ err: error }, "Gemini API error");
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
}
