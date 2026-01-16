import express from "express";
import AuditLog from "../models/audit.model.js";
import authMiddleware from "../src/middlewares/auth.middlewares.js";
import authorize from "../src/middlewares/autharize.middleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  authorize("audit.read"),
  async (req, res) => {
    const logs = await AuditLog.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      logs,
    });
  }
);

export default router;
