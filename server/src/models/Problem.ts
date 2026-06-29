import mongoose from "mongoose";

const ExampleSchema = new mongoose.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: "" },
});

const TestCaseSchema = new mongoose.Schema({
    input: { type: String, default: "" },
    expectedOutput: { type: String, default: "" },
});

const ProblemSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },
        points: { type: Number, default: 100 },
        timeLimit: { type: Number, default: 5000 }, // ms for Piston
        /** Visible test cases shown in the problem statement */
        examples: { type: [ExampleSchema], default: [] },
        /** Hidden test cases — NEVER sent to clients */
        hiddenTestCases: { type: [TestCaseSchema], default: [] },
        /** Starter code templates keyed by language */
        templates: {
            python: { type: String, default: "" },
            javascript: { type: String, default: "" },
            cpp: { type: String, default: "" },
        },
        tags: { type: [String], default: [] },
        constraints: { type: String, default: "" },
        companies: { type: [String], default: [] },
        expectedComplexity: { type: String, default: "" },
        hints: { type: [String], default: [] },
        order: { type: Number, default: 0 }, // display / round order
    },
    { timestamps: true }
);

export default mongoose.model("Problem", ProblemSchema);
