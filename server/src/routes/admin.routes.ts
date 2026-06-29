import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import { getTopics, createTopic, addQuizQuestion, addCodeProblem } from "../controllers/admin.controller.js";

const router = Router();

// Middleware to check if user is admin
const isAdmin = async (req: any, res: any, next: any) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: "Admin access required" });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: "Error verifying admin status" });
    }
};

router.use(authMiddleware, isAdmin);

router.get("/topics", getTopics);
router.post("/topics", createTopic);
router.post("/questions", addQuizQuestion);
router.post("/problems", addCodeProblem);

export default router;
