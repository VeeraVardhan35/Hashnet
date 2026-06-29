import { Request, Response } from "express";
import Topic from "../models/Topic.js";
import Question from "../models/Question.js";
import Problem from "../models/Problem.js";

export const getTopics = async (req: Request, res: Response) => {
    try {
        const topics = await Topic.find().sort({ name: 1 });
        res.json(topics);
    } catch (error) {
        console.error("Error fetching topics:", error);
        res.status(500).json({ message: "Failed to fetch topics" });
    }
};

export const createTopic = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ message: "Topic name is required" });

        const existing = await Topic.findOne({ name });
        if (existing) return res.status(400).json({ message: "Topic already exists" });

        const newTopic = await Topic.create({ name, description });
        res.json(newTopic);
    } catch (error) {
        console.error("Error creating topic:", error);
        res.status(500).json({ message: "Failed to create topic" });
    }
};

export const addQuizQuestion = async (req: Request, res: Response) => {
    try {
        const { text, options, correctIndex, explanation, difficulty, points, category } = req.body;
        
        if (!text || !options || options.length !== 4 || correctIndex === undefined) {
            return res.status(400).json({ message: "Invalid question data" });
        }

        const newQuestion = await Question.create({
            text,
            options,
            correctIndex,
            explanation,
            difficulty,
            points,
            category, // This is the topic name
        });

        res.json(newQuestion);
    } catch (error) {
        console.error("Error adding quiz question:", error);
        res.status(500).json({ message: "Failed to add question" });
    }
};

export const addCodeProblem = async (req: Request, res: Response) => {
    try {
        const { title, description, difficulty, points, timeLimit, examples, hiddenTestCases, templates, tags } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        const newProblem = await Problem.create({
            title,
            description,
            difficulty,
            points,
            timeLimit,
            examples,
            hiddenTestCases,
            templates,
            tags, // This includes the topic name
        });

        res.json(newProblem);
    } catch (error) {
        console.error("Error adding code problem:", error);
        res.status(500).json({ message: "Failed to add problem" });
    }
};
