import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";
import marketRoutes from "./routes/market.routes.js";
import aiRoutes from "./routes/ai.routes.js";

export function createApp() {
  const app = express();

  // ── Security ──
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'", "data:", "https:"],
        }
      } : false,
    })
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true, // Required for httpOnly cookies
    })
  );

  // ── Parsing ──
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // ── Logging ──
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === "/api/health",
      },
    })
  );

  // ── Rate limiting ──
  app.use("/api", apiLimiter);

  // ── Health check ──
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── Routes ──
  app.use("/api/auth", authRoutes);
  app.use("/api/portfolio", portfolioRoutes);
  app.use("/api/watchlist", watchlistRoutes);
  app.use("/api/market", marketRoutes);
  app.use("/api/ai", aiRoutes);

  // ── SPA Serving (Production) ──
  if (env.NODE_ENV === "production") {
    const __dirname = new URL(".", import.meta.url).pathname;
    const distPath = path.resolve(__dirname, "../dist");
    
    app.use(express.static(distPath));
    
    // Express 5 requires valid parameter names for wildcards, and path-to-regexp v8 syntax changed.
    // the safest catch-all for a SPA is a generic `app.use` middleware for unmatched GET requests.
    app.use((req, res, next) => {
      // Only intercept GET requests
      if (req.method !== "GET") return next();
      
      // Don't intercept /api requests that fell through (let them 404 or hit error handler)
      if (req.originalUrl.startsWith("/api")) {
        res.status(404).json({ error: "API route not found" });
        return;
      }
      
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ── Error handler (must be last) ──
  app.use(errorHandler);

  return app;
}
