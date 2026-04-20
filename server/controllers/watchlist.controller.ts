import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as watchlistService from "../services/watchlist.service.js";

export const addWatchlistSchema = z.object({
  assetId: z.string().min(1, "assetId is required"),
});

export async function getWatchlist(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const watchedIds = await watchlistService.getWatchlist(req.userId!);
    res.json({ watchedIds });
  } catch (err) {
    next(err);
  }
}

export async function addToWatchlist(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await watchlistService.addToWatchlist(req.userId!, req.body.assetId);
    res.status(201).json({ message: "Added to watchlist" });
  } catch (err) {
    next(err);
  }
}

export async function removeFromWatchlist(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await watchlistService.removeFromWatchlist(req.userId!, req.params.assetId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
