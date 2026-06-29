import mongoose from "mongoose";

const CompetitiveRunSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    settings: {
      minRating: Number,
      maxRating: Number,
      tags: [String],
      numberOfProblems: Number,
      timerPerProblem: Number, // in minutes
      infiniteMode: Boolean,
      excludeSolved: Boolean,
    },
    // List of problems fetched for this run
    problems: [{
      id: String,
      name: String,
      rating: Number,
      tags: [String]
    }],
    currentProblemIndex: { type: Number, default: 0 },
    runStats: {
      solved: { type: Number, default: 0 },
      wrong: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      xpEarned: { type: Number, default: 0 },
      coinsEarned: { type: Number, default: 0 },
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CompetitiveRun", CompetitiveRunSchema);
