import express from "express";
import {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
} from "../controllers/team.controller.js";

import authMiddleware from "../src/middlewares/auth.middlewares.js";
import authorize from "../src/middlewares/autharize.middleware.js";


const router = express.Router();

router.post(
  "/", 
  authMiddleware,
  authorize("team.create"),
  createTeam
);

router.get(
  "/",
  authMiddleware,
  authorize("team.read"),
  getTeams
);

router.patch(
  "/:teamId",
  authMiddleware,
  authorize("team.update"),
  updateTeam
);

router.delete(
  "/:teamId",
  authMiddleware,
  authorize("team.delete"),
  deleteTeam
);

export default router;
