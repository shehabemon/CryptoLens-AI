import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  addWatchlistSchema,
} from "../controllers/watchlist.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getWatchlist);
router.post("/", validate(addWatchlistSchema), addToWatchlist);
router.delete("/:assetId", removeFromWatchlist);

export default router;
