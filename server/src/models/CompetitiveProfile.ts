import mongoose from "mongoose";

const CompetitiveProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    codeforcesHandle: {
      type: String,
      default: "",
    },
    codeforcesPassword: {
      type: String,
      default: "",
    },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    problemsSolved: { type: Number, default: 0 },
    wrongAttempts: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CompetitiveProfile", CompetitiveProfileSchema);
