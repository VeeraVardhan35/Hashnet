import { Request, Response } from "express";
import CompetitiveProfile from "../models/CompetitiveProfile.js";
import CompetitiveRun from "../models/CompetitiveRun.js";
import { CodeforcesService } from "../services/codeforces.service.js";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    let profile = await CompetitiveProfile.findOne({ userId });
    
    if (!profile) {
      profile = await CompetitiveProfile.create({ userId });
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { codeforcesHandle, codeforcesPassword } = req.body;
    
    let profile = await CompetitiveProfile.findOne({ userId });
    if (!profile) {
      profile = await CompetitiveProfile.create({ userId, codeforcesHandle, codeforcesPassword });
    } else {
      profile.codeforcesHandle = codeforcesHandle || profile.codeforcesHandle;
      if (codeforcesPassword) {
        profile.codeforcesPassword = codeforcesPassword;
      }
      await profile.save();
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const startRun = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { settings } = req.body;
    
    const profile = await CompetitiveProfile.findOne({ userId });
    if (!profile) return res.status(400).json({ message: "Profile not found" });

    // Mark any existing active run as inactive
    await CompetitiveRun.updateMany({ userId, isActive: true }, { isActive: false });

    // Fetch problems from Codeforces API
    let cfProblems = await CodeforcesService.getProblems(settings.tags || []);
    
    // Filter by rating
    if (settings.minRating) {
      cfProblems = cfProblems.filter((p: any) => p.rating && p.rating >= settings.minRating);
    }
    if (settings.maxRating) {
      cfProblems = cfProblems.filter((p: any) => p.rating && p.rating <= settings.maxRating);
    }

    // Filter solved if requested
    if (settings.excludeSolved && profile.codeforcesHandle) {
      const submissions = await CodeforcesService.getUserSubmissions(profile.codeforcesHandle);
      const solvedIds = new Set(
        submissions
          .filter((sub: any) => sub.verdict === "OK")
          .map((sub: any) => `${sub.problem.contestId}-${sub.problem.index}`)
      );
      cfProblems = cfProblems.filter((p: any) => !solvedIds.has(`${p.contestId}-${p.index}`));
    }

    // Shuffle and pick
    cfProblems = cfProblems.sort(() => 0.5 - Math.random());
    const selectedProblems = cfProblems
      .slice(0, settings.infiniteMode ? 50 : settings.numberOfProblems)
      .map((p: any) => ({
        id: `${p.contestId}-${p.index}`,
        name: p.name,
        rating: p.rating || 0,
        tags: p.tags || []
      }));

    const newRun = await CompetitiveRun.create({
      userId,
      isActive: true,
      settings,
      problems: selectedProblems,
      currentProblemIndex: 0,
    });

    res.json(newRun);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to start run" });
  }
};

export const getActiveRun = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const run = await CompetitiveRun.findOne({ userId, isActive: true });
    res.json(run);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const submitSolution = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { problemCode } = req.body; // sourceCode and languageId no longer needed for submission
    
    const profile = await CompetitiveProfile.findOne({ userId });
    const run = await CompetitiveRun.findOne({ userId, isActive: true });
    
    if (!profile || !run) return res.status(400).json({ message: "Invalid state" });
    if (!profile.codeforcesHandle) return res.status(400).json({ message: "No Codeforces handle linked" });
    
    if (profile.codeforcesHandle.includes("@")) {
      return res.json({ 
        success: false, 
        verdict: "INVALID_HANDLE", 
        message: "Invalid Codeforces Handle! You entered an email address. Please update your profile with your actual Codeforces username." 
      });
    }

    // Fetch actual submissions from Codeforces
    const submissions = await CodeforcesService.getUserSubmissions(profile.codeforcesHandle);
    
    // Find the most recent submission for this exact problem
    const [contestId, index] = problemCode.split("-");
    const problemSubmission = submissions.find((sub: any) => 
      sub.problem.contestId.toString() === contestId && sub.problem.index === index
    );

    if (!problemSubmission) {
      return res.json({ 
        success: false, 
        verdict: "NOT_FOUND", 
        message: "No submission found on Codeforces for this problem. Please submit it there first!" 
      });
    }

    if (problemSubmission.verdict === "TESTING" || !problemSubmission.verdict) {
      return res.json({
        success: false,
        verdict: "TESTING",
        message: "Codeforces is still testing your solution. Please wait a moment and verify again."
      });
    }

    // Process the result
    const isAccepted = problemSubmission.verdict === "OK";
    
    if (isAccepted) {
      run.runStats.solved += 1;
      run.runStats.xpEarned += 100;
      run.runStats.coinsEarned += 50;
      profile.problemsSolved += 1;
      profile.xp += 100;
      profile.coins += 50;
      profile.currentStreak += 1;
      if (profile.currentStreak > profile.longestStreak) {
        profile.longestStreak = profile.currentStreak;
      }
    } else {
      run.runStats.wrong += 1;
      run.runStats.xpEarned = Math.max(0, run.runStats.xpEarned - 50); // Penalty
      profile.wrongAttempts += 1;
      profile.currentStreak = 0;
    }

    await run.save();
    await profile.save();

    res.json({
      success: true,
      verdict: isAccepted ? "Accepted" : problemSubmission.verdict.replace(/_/g, ' '),
      timeMs: problemSubmission.timeConsumedMillis || 0,
      memoryBytes: problemSubmission.memoryConsumedBytes || 0,
      passedTestCount: problemSubmission.passedTestCount || 0
    });
  } catch (error) {
    console.error("Verification failed:", error);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
};

export const nextProblem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const run = await CompetitiveRun.findOne({ userId, isActive: true });
    if (!run) return res.status(400).json({ message: "No active run" });

    run.currentProblemIndex += 1;
    
    if (run.currentProblemIndex >= run.problems.length) {
      if (!run.settings.infiniteMode) {
        run.isActive = false;
      } else {
        // If infinite, we should fetch more problems. For now just wrap around or end.
        // Simplified: Just end if we exhaust 50 problems.
        run.isActive = false; 
      }
    }
    
    await run.save();
    res.json(run);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const skipProblem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const run = await CompetitiveRun.findOne({ userId, isActive: true });
    const profile = await CompetitiveProfile.findOne({ userId });
    if (!run || !profile) return res.status(400).json({ message: "Invalid state" });

    run.runStats.skipped += 1;
    run.runStats.xpEarned = Math.max(0, run.runStats.xpEarned - 10); // Skip penalty
    profile.skipped += 1;
    profile.currentStreak = 0;
    
    run.currentProblemIndex += 1;
    if (run.currentProblemIndex >= run.problems.length) {
      run.isActive = false;
    }
    
    await run.save();
    await profile.save();
    
    res.json(run);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const quitRun = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const run = await CompetitiveRun.findOneAndUpdate(
      { userId, isActive: true },
      { isActive: false },
      { new: true }
    );
    res.json(run);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getProblemHtml = async (req: Request, res: Response) => {
  try {
    const html = await CodeforcesService.getProblemStatement(req.params.code);
    res.send(html);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

import { executeCode } from "../services/piston.js";

export const executeCustomCode = async (req: Request, res: Response) => {
  try {
    const { sourceCode, languageId, stdin } = req.body;
    
    // Convert monaco language keys to piston/wandbox compatible keys if needed
    // Piston currently expects "cpp", "python", "javascript"
    
    const result = await executeCode(languageId, sourceCode, stdin || "");
    res.json(result);
  } catch (error) {
    console.error("Execute code error:", error);
    res.status(500).json({ message: "Execution Failed" });
  }
};
