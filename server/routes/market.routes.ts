import { Router } from "express";
import {
  getTopCryptos,
  getMarketChart,
} from "../controllers/market.controller.js";

const router = Router();

// Market data endpoints are public (no auth required)
// This allows the login page to show market data
router.get("/top", getTopCryptos);
router.get("/chart/:coinId", getMarketChart);

export default router;
