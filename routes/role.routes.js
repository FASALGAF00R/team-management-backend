import { createRole, deleteRole, getRoles, updateRole } from "../controllers/role.controller.js";
import authMiddleware from "../src/middlewares/auth.middlewares.js";
import authorize from "../src/middlewares/autharize.middleware.js";
import express from "express";

const router = express.Router();


router.post(
  "/",
  authMiddleware,
  authorize("role.create"),
  createRole
);

router.get(
  "/",
  authMiddleware,
  authorize("role.read"),
  getRoles
);

router.patch(
  "/:roleId",
  authMiddleware,
  authorize("role.update"),
  updateRole
);

router.delete(
  "/:roleId",
  authMiddleware,
  authorize("role.delete"),
  deleteRole
);


export default router;
