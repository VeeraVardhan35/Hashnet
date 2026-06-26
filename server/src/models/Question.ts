import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
        },
        options: {
            type: [String],
            required: true,
            validate: (v: string[]) => v.length === 4,
        },
        correctIndex: {
            type: Number,
            required: true,
            min: 0,
            max: 3,
        },
        explanation: {
            type: String,
            default: "",
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },
        points: {
            type: Number,
            default: 10,
        },
        category: {
            type: String,
            default: "General",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Question", QuestionSchema);
