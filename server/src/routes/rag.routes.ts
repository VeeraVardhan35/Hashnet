import { Router } from "express";
import multer from "multer";
import Question from "../models/Question.js";
import Problem from "../models/Problem.js";

const router = Router();
const upload = multer();

router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        const formData = new FormData();
        const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype });
        formData.append("file", blob, req.file.originalname);

        const ragUrl = process.env.RAG_SERVER_URL || "http://localhost:8000";
        const response = await fetch(`${ragUrl}/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`RAG API error: ${err}`);
        }

        const data = await response.json();
        const documentId = data.document_id;
        const categoryTag = documentId || `AI_Gen_${Date.now()}`;

        // Save questions
        if (data.quiz_coding?.quiz_questions && data.quiz_coding.quiz_questions.length > 0) {
            const questions = data.quiz_coding.quiz_questions.map((q: any) => ({
                ...q,
                category: categoryTag
            }));
            await Question.insertMany(questions);
        }

        // Save challenges
        if (data.quiz_coding?.coding_challenges && data.quiz_coding.coding_challenges.length > 0) {
            const challenges = data.quiz_coding.coding_challenges.map((c: any) => ({
                ...c,
                tags: [...(c.tags || []), categoryTag]
            }));
            await Problem.insertMany(challenges);
        }

        res.json({
            success: true,
            category: categoryTag,
            document_id: documentId,
            data
        });
    } catch (error: any) {
        console.error("[rag.routes] /upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/chat/:documentId", async (req, res) => {
    try {
        const { documentId } = req.params;
        const { message } = req.body;
        
        const ragUrl = process.env.RAG_SERVER_URL || "http://localhost:8000";
        const response = await fetch(`${ragUrl}/${documentId}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`RAG API error: ${err}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error: any) {
        console.error("[rag.routes] /chat error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
