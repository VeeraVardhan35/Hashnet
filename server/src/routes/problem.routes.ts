import { Router } from "express";
import ProblemModel from "../models/Problem.js";

const router = Router();

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_PROBLEMS = [
    {
        order: 1,
        title: "Longest Substring Without Repeating Characters",
        description: `Given a string \`s\`, find the length of the longest substring without repeating characters.

A **substring** is a contiguous non-empty sequence of characters within a string.`,
        difficulty: "medium",
        points: 100,
        timeLimit: 5000,
        tags: ["string", "sliding-window", "hash-table"],
        examples: [
            {
                input: "abcabcbb",
                output: "3",
                explanation: 'The answer is "abc", with the length of 3.',
            },
            {
                input: "bbbbb",
                output: "1",
                explanation: 'The answer is "b", with the length of 1.',
            },
            {
                input: "pwwkew",
                output: "3",
                explanation: 'The answer is "wke", with the length of 3.',
            },
        ],
        hiddenTestCases: [
            { input: "a", expectedOutput: "1" },
            { input: "dvdf", expectedOutput: "3" },
            { input: "abba", expectedOutput: "2" },
            { input: "tmmzuxt", expectedOutput: "5" },
            { input: "aab", expectedOutput: "2" },
        ],
        templates: {
            python: `def lengthOfLongestSubstring(s: str) -> int:
# USER_CODE_START
    # Write your solution here
    pass
# USER_CODE_END

s = input().strip()
print(lengthOfLongestSubstring(s))`,
            javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (s) => {
    function lengthOfLongestSubstring(s) {
// USER_CODE_START
        // Write your solution here
        return 0;
// USER_CODE_END
    }
    console.log(lengthOfLongestSubstring(s.trim()));
    rl.close();
});`,
            cpp: `#include <bits/stdc++.h>
using namespace std;

int lengthOfLongestSubstring(string s) {
// USER_CODE_START
    // Write your solution here
    return 0;
// USER_CODE_END
}

int main() {
    string s;
    getline(cin, s);
    cout << lengthOfLongestSubstring(s) << endl;
    return 0;
}`,
        },
    },
    {
        order: 2,
        title: "Valid Parentheses",
        description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Output \`true\` if valid, \`false\` otherwise.`,
        difficulty: "easy",
        points: 50,
        timeLimit: 3000,
        tags: ["string", "stack"],
        examples: [
            { input: "()", output: "true", explanation: "" },
            { input: "()[]{}", output: "true", explanation: "" },
            { input: "(]", output: "false", explanation: "" },
        ],
        hiddenTestCases: [
            { input: "([)]", expectedOutput: "false" },
            { input: "{[]}", expectedOutput: "true" },
            { input: "nonempty", expectedOutput: "true" },
            { input: "((", expectedOutput: "false" },
            { input: "(){{}}", expectedOutput: "true" },
        ],
        templates: {
            python: `def isValid(s: str) -> bool:
# USER_CODE_START
    # Write your solution here
    pass
# USER_CODE_END

s = input().strip()
result = isValid(s)
print(str(result).lower())`,
            javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (s) => {
    function isValid(s) {
// USER_CODE_START
        // Write your solution here
        return false;
// USER_CODE_END
    }
    console.log(isValid(s.trim()).toString());
    rl.close();
});`,
            cpp: `#include <bits/stdc++.h>
using namespace std;

bool isValid(string s) {
// USER_CODE_START
    // Write your solution here
    return false;
// USER_CODE_END
}

int main() {
    string s;
    getline(cin, s);
    cout << (isValid(s) ? "true" : "false") << endl;
    return 0;
}`,
        },
    },
    {
        order: 3,
        title: "Maximum Subarray",
        description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A **subarray** is a contiguous part of an array.

Numbers are given as a single line of space-separated integers.`,
        difficulty: "medium",
        points: 100,
        timeLimit: 5000,
        tags: ["array", "dynamic-programming", "divide-and-conquer"],
        examples: [
            {
                input: "-2 1 -3 4 -1 2 1 -5 4",
                output: "6",
                explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
            },
            { input: "1", output: "1", explanation: "" },
            {
                input: "5 4 -1 7 8",
                output: "23",
                explanation: "The subarray [5,4,-1,7,8] has the largest sum 23.",
            },
        ],
        hiddenTestCases: [
            { input: "-1", expectedOutput: "-1" },
            { input: "-2 -1", expectedOutput: "-1" },
            { input: "1 2 3 4 5", expectedOutput: "15" },
            { input: "-3 -2 -1 -4", expectedOutput: "-1" },
            { input: "2 -1 2 3 4 -1", expectedOutput: "10" },
        ],
        templates: {
            python: `def maxSubArray(nums) -> int:
# USER_CODE_START
    # Write your solution here (Kadane's algorithm hint: O(n))
    pass
# USER_CODE_END

nums = list(map(int, input().split()))
print(maxSubArray(nums))`,
            javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const nums = line.trim().split(' ').map(Number);
    function maxSubArray(nums) {
// USER_CODE_START
        // Write your solution here
        return 0;
// USER_CODE_END
    }
    console.log(maxSubArray(nums));
    rl.close();
});`,
            cpp: `#include <bits/stdc++.h>
using namespace std;

int maxSubArray(vector<int>& nums) {
// USER_CODE_START
    // Write your solution here
    return 0;
// USER_CODE_END
}

int main() {
    int x;
    vector<int> nums;
    while (cin >> x) nums.push_back(x);
    cout << maxSubArray(nums) << endl;
    return 0;
}`,
        },
    },
];

/**
 * POST /api/problems/seed
 * Drops all problems and inserts fresh seed data (dev only).
 */
router.post("/seed", async (_req, res) => {
    try {
        await ProblemModel.deleteMany({});

        // Fix hiddenTestCases for problem 1 (uses different key name)
        const toInsert = SEED_PROBLEMS.map((p) => ({
            ...p,
            hiddenTestCases: (p as any).hiddenTestCases?.map((tc: any) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput ?? tc.output,
            })),
        }));

        const inserted = await ProblemModel.insertMany(toInsert);
        console.log(`[problem.routes] Seeded ${inserted.length} problems`);
        res.json({ ok: true, count: inserted.length });
    } catch (err) {
        console.error("[problem.routes] Seed error:", err);
        res.status(500).json({ error: "Failed to seed problems" });
    }
});

/**
 * GET /api/problems
 * Returns all problems (no hidden test cases sent).
 */
router.get("/", async (_req, res) => {
    try {
        const problems = await ProblemModel.find({})
            .select("-hiddenTestCases")
            .sort({ order: 1 })
            .lean();
        res.json({ problems });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch problems" });
    }
});

export default router;
