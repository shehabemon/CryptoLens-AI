import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { chat } from "../controllers/ai.controller.js";

const router = Router();

// AI chat requires authentication
router.post("/", authenticate, chat);

export default router;
