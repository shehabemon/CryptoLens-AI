import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as portfolioService from "../services/portfolio.service.js";

export const createHoldingSchema = z.object({
  assetId: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  image: z.string().url().optional(),
  amount: z.number().positive("Amount must be positive"),
  buyPrice: z.number().positive("Buy price must be positive"),
  buyDate: z.string().datetime({ offset: true }).or(z.string().date()),
});

export const updateHoldingSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  buyPrice: z.number().positive("Buy price must be positive").optional(),
  buyDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().date())
    .optional(),
});

export async function getHoldings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const holdings = await portfolioService.getHoldings(req.userId!);
    res.json({ holdings });
  } catch (err) {
    next(err);
  }
}

export async function addHolding(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const holding = await portfolioService.addHolding(req.userId!, req.body);
    res.status(201).json({ holding });
  } catch (err) {
    next(err);
  }
}

export async function updateHolding(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const holding = await portfolioService.updateHolding(
      req.userId!,
      req.params.id,
      req.body
    );
    res.json({ holding });
  } catch (err) {
    next(err);
  }
}

export async function deleteHolding(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await portfolioService.deleteHolding(req.userId!, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
