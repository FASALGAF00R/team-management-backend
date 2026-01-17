import { createUser, getUsers, updateUser, deleteUser } from "../controllers/user.controller.js";
import authMiddleware from "../src/middlewares/auth.middlewares.js";
import authorize from "../src/middlewares/autharize.middleware.js";
import express from "express";

const router = express.Router();

router.post(
  "/users",
  authMiddleware,
  authorize("user.create"),
  createUser
);

router.get("/", authMiddleware, authorize("user.read"), getUsers);
router.patch("/:userId", authMiddleware, authorize("user.update"), updateUser);
router.delete("/:userId", authMiddleware, authorize("user.delete"), deleteUser);

export default router;
