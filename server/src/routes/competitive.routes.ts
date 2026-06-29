import { Router } from "express";
import {
  getProfile,
  updateProfile,
  startRun,
  getActiveRun,
  submitSolution,
  nextProblem,
  skipProblem,
  quitRun,
  getProblemHtml,
  executeCustomCode
} from "../controllers/competitive.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/profile", getProfile);
router.post("/profile", updateProfile);

router.post("/run", startRun);
router.get("/run/active", getActiveRun);
router.post("/run/submit", submitSolution);
router.post("/run/next", nextProblem);
router.post("/run/skip", skipProblem);
router.post("/run/quit", quitRun);
router.get("/run/problem/:code", getProblemHtml);
router.post("/run/execute", executeCustomCode);

export default router;
