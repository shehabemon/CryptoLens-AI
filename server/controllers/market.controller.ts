import type { Request, Response, NextFunction } from "express";
import * as marketService from "../services/market.service.js";

export async function getTopCryptos(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await marketService.fetchTopCryptos();

    // Transform to the format the frontend expects (Asset[])
    const assets = data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      price: coin.current_price,
      change24h: coin.price_change_24h,
      changePercent24h: coin.price_change_percentage_24h,
      changePercent1h: coin.price_change_percentage_1h_in_currency,
      changePercent7d: coin.price_change_percentage_7d_in_currency,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      sparkline: coin.sparkline_in_7d?.price ?? [],
      circulatingSupply: coin.circulating_supply ?? undefined,
      ath: coin.ath ?? undefined,
      athDate: coin.ath_date ?? undefined,
      atl: coin.atl ?? undefined,
      atlDate: coin.atl_date ?? undefined,
      type: "crypto" as const,
    }));

    res.json(assets);
  } catch (err) {
    next(err);
  }
}

export async function getMarketChart(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { coinId } = req.params;
    const days = (req.query.days as string) || "7";

    const validDays = ["1", "7", "30", "90", "365"];
    if (!validDays.includes(days)) {
      res.status(400).json({ error: "Invalid days parameter" });
      return;
    }

    const data = await marketService.fetchMarketChart(
      coinId,
      days as marketService.TimeRange
    );

    // Transform to frontend format
    const points = data.prices.map(([timestamp, price]) => ({
      timestamp,
      price,
      date: new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(days === "1" ? { hour: "numeric", minute: "2-digit" } : {}),
        ...(days === "365" ? { year: "numeric" } : {}),
      }),
    }));

    res.json(points);
  } catch (err) {
    next(err);
  }
}
