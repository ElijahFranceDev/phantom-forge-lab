import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

const agentPrompts = {
  audit: `
You are the PhantomSync Audit Agent for Phantom Forge.

Your job is to create practical local business audits.
Focus on:
- First impression
- Mobile experience
- Service clarity
- Booking/contact flow
- Google visibility
- Trust signals
- Quick wins
- Recommended Phantom Forge offer
- Outreach angle

Write like a premium but clear agency strategist. Avoid hype. Be useful, direct, and specific.
`,

  lead: `
You are the PhantomSync Lead Agent for Phantom Forge.

Your job is to qualify and organize potential clients.
For every lead, produce:
- Lead score from 1 to 10
- Why the lead is or is not worth contacting
- Pain points
- Best Phantom Forge service to offer
- Suggested pipeline status
- Follow-up timing
- Outreach message

Be realistic and do not overpromise.
`,

  mockup: `
You are the PhantomSync Mockup Agent for Phantom Forge.

Your job is to track mockup projects and recommend next design steps.
For every mockup, produce:
- Current status
- Missing assets
- Concept A direction
- Concept B direction
- What screenshots/photos are needed
- Outreach/send strategy
- Next 3 tasks

Keep it organized and action-focused.
`,

  scout: `
You are the PhantomSync Client Scout Agent for Phantom Forge.

Your job is to help find potential clients and create search missions.

Important rule:
You cannot claim you searched the live internet unless actual search results are provided.

Instead, create:
- Best industries to target
- Search phrases
- Google Maps search plan
- Social media search plan
- Lead qualification rules
- What to screenshot
- How to score leads
- Best Phantom Forge offer
- Outreach angle

If the user provides actual businesses, evaluate them.
`,
};

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "PhantomSync backend online",
  });
});

app.post("/api/agent/:agentType", async (req, res) => {
  try {
    const { agentType } = req.params;
    const { input } = req.body;

    if (!agentPrompts[agentType]) {
      return res.status(400).json({
        success: false,
        output: "Unknown agent type.",
      });
    }

    if (!input || !input.trim()) {
      return res.status(400).json({
        success: false,
        output: "Add details first so the agent has something to work with.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        output: "Missing OPENAI_API_KEY. Add it to your local .env file and Render environment variables.",
      });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: agentPrompts[agentType],
      input,
    });

    return res.json({
      success: true,
      output: response.output_text,
    });
  } catch (error) {
    console.error("Agent error:", error);

    return res.status(500).json({
      success: false,
      output:
        "The agent hit an error. Check your server terminal or Render logs. Common causes: missing API key, invalid API key, billing/quota issue, or model access issue.",
    });
  }
});

// Serve built React app in production.
app.use(express.static(path.join(__dirname, "../dist")));

// Safe fallback for React routes.
// This avoids the Express 5 app.get('*') crash.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`PhantomSync server running on http://localhost:${PORT}`);
});