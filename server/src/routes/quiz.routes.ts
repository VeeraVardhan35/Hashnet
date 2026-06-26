import { Router } from "express";
import QuestionModel from "../models/Question.js";

const router = Router();

const SEED_QUESTIONS = [
    {
        text: "Which data structure follows FIFO (First In First Out) order?",
        options: ["Stack", "Queue", "Tree", "Graph"],
        correctIndex: 1,
        explanation:
            "A Queue follows FIFO order where the first element added is the first one to be removed. Example: a ticket counter line.",
        difficulty: "easy",
        points: 10,
        category: "Data Structures",
    },
    {
        text: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correctIndex: 1,
        explanation:
            "Binary search halves the search space each iteration, giving O(log n) time complexity.",
        difficulty: "medium",
        points: 15,
        category: "Algorithms",
    },
    {
        text: "Which HTTP method is idempotent AND safe?",
        options: ["POST", "PUT", "DELETE", "GET"],
        correctIndex: 3,
        explanation:
            "GET is both safe (no side effects) and idempotent (calling it multiple times returns the same result).",
        difficulty: "medium",
        points: 15,
        category: "Web",
    },
    {
        text: "In JavaScript, what does '===' check?",
        options: [
            "Value only",
            "Type only",
            "Value and type",
            "Reference equality",
        ],
        correctIndex: 2,
        explanation:
            "The strict equality operator '===' checks both value AND type without coercion, unlike '==' which performs type coercion.",
        difficulty: "easy",
        points: 10,
        category: "JavaScript",
    },
    {
        text: "What does DNS stand for?",
        options: [
            "Dynamic Network System",
            "Domain Name System",
            "Data Node Server",
            "Distributed Name Service",
        ],
        correctIndex: 1,
        explanation:
            "DNS (Domain Name System) translates human-readable domain names like example.com into IP addresses.",
        difficulty: "easy",
        points: 10,
        category: "Networking",
    },
    {
        text: "Which sorting algorithm has the best average-case time complexity?",
        options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Quick Sort"],
        correctIndex: 3,
        explanation:
            "Quick Sort has an average-case O(n log n) time complexity with excellent cache performance, making it fastest in practice for most inputs.",
        difficulty: "hard",
        points: 20,
        category: "Algorithms",
    },
    {
        text: "What is a closure in JavaScript?",
        options: [
            "A function that returns nothing",
            "A function with access to its outer scope variables",
            "A way to close a browser tab",
            "A sealed object that cannot be mutated",
        ],
        correctIndex: 1,
        explanation:
            "A closure is a function that retains access to variables from its lexical (outer) scope even after that scope has finished executing.",
        difficulty: "medium",
        points: 15,
        category: "JavaScript",
    },
    {
        text: "Which Git command creates a new branch and switches to it in one step?",
        options: [
            "git branch new-branch",
            "git new new-branch",
            "git checkout -b new-branch",
            "git switch new-branch",
        ],
        correctIndex: 2,
        explanation:
            "'git checkout -b <branch>' creates a new branch and immediately switches to it. The modern equivalent is 'git switch -c <branch>'.",
        difficulty: "easy",
        points: 10,
        category: "Git",
    },
    {
        text: "What does SQL's JOIN clause do without a qualifier (just JOIN)?",
        options: [
            "Returns all rows from both tables",
            "Returns only matching rows (INNER JOIN)",
            "Returns all rows from the left table",
            "Returns all rows from the right table",
        ],
        correctIndex: 1,
        explanation:
            "A plain JOIN is an INNER JOIN by default — it returns only the rows where the join condition matches in both tables.",
        difficulty: "medium",
        points: 15,
        category: "Databases",
    },
    {
        text: "In React, when does useEffect run by default (empty dependency array [])?",
        options: [
            "Every render",
            "Only once, after initial mount",
            "Before every render",
            "Only on unmount",
        ],
        correctIndex: 1,
        explanation:
            "useEffect with an empty [] dependency array runs exactly once — after the component mounts to the DOM, equivalent to componentDidMount.",
        difficulty: "medium",
        points: 15,
        category: "React",
    },
];

/**
 * POST /api/quiz/seed
 * Clears existing questions and inserts fresh seed data.
 * For development/testing only.
 */
router.post("/seed", async (_req, res) => {
    try {
        await QuestionModel.deleteMany({});
        const inserted = await QuestionModel.insertMany(SEED_QUESTIONS);
        console.log(`[quiz.routes] Seeded ${inserted.length} questions`);
        res.json({ ok: true, count: inserted.length });
    } catch (err) {
        console.error("[quiz.routes] Seed error:", err);
        res.status(500).json({ error: "Failed to seed questions" });
    }
});

/**
 * GET /api/quiz/questions
 * Returns all questions (useful for admin preview).
 */
router.get("/questions", async (_req, res) => {
    try {
        const questions = await QuestionModel.find({}).lean();
        res.json({ questions });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch questions" });
    }
});

export default router;
