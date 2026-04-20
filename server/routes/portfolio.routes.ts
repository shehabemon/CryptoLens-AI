import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getHoldings,
  addHolding,
  updateHolding,
  deleteHolding,
  createHoldingSchema,
  updateHoldingSchema,
} from "../controllers/portfolio.controller.js";

const router = Router();

// All portfolio routes require authentication
router.use(authenticate);

router.get("/", getHoldings);
router.post("/", validate(createHoldingSchema), addHolding);
router.put("/:id", validate(updateHoldingSchema), updateHolding);
router.delete("/:id", deleteHolding);

export default router;
