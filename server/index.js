import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

function buildFakeAgentResponse(agentType, input) {
  if (!input || !input.trim()) {
    return {
      success: false,
      output: "Add details first so the agent has something to work with.",
    };
  }

  if (agentType === "audit") {
    return {
      success: true,
      output: `PHANTOMSYNC AUDIT AGENT

Business Input:
${input}

Audit Summary:
This business has enough public presence to build from, but the customer journey should be made clearer. The main opportunity is improving trust, service clarity, local Google visibility, and the booking/contact path.

What Is Working:
- The business already has visible proof or public presence.
- There is likely content that can be turned into a stronger landing page.
- The brand can be positioned better with cleaner structure and stronger calls to action.

What May Be Hurting Them:
- Customers may not instantly understand what to do next.
- If the business relies mostly on social media, it may be missing Google search traffic.
- Weak service wording or unclear contact flow can cost leads.

Recommended Phantom Forge Offer:
Start with a Local Visibility Audit, then offer a mobile landing page and Google Business Profile cleanup.

Suggested Next Step:
Create a short audit PDF or message and offer to send a free visual concept.`,
    };
  }

  if (agentType === "lead") {
    return {
      success: true,
      output: `PHANTOMSYNC LEAD AGENT

Lead Input:
${input}

Lead Score:
8 / 10

Lead Type:
Warm local business lead.

Best Offer:
- Local Visibility Audit
- Landing Page Build
- Google Business Profile Cleanup

Why This Lead Matters:
This business likely has enough proof to benefit from a cleaner online presence, but may need help turning attention into calls, bookings, or quote requests.

Recommended Pipeline Status:
New Lead → Research → Mini Audit → Outreach → Follow Up

Suggested Outreach:
“Hey, I came across your business and noticed a few ways your online presence could be cleaner and easier for customers to use. I help local businesses improve their website, Google visibility, and booking flow. Would you be open to a quick mini-audit?”`,
    };
  }

    if (agentType === "scout") {
    return {
      success: true,
      output: `PHANTOMSYNC CLIENT SCOUT AGENT

Search Request:
${input}

Scout Mission:
Find businesses that likely need Phantom Forge services such as local visibility audits, landing pages, website redesigns, Google cleanup, or mockup previews.

Best Businesses To Target:
- Local service businesses
- Tattoo shops
- Barbers and salons
- Lawn care and landscaping
- Contractors
- Food trucks and restaurants
- Cleaning businesses
- Beauty professionals
- Home service providers
- Small medical/wellness offices
- Local creators or authors

Search Strategy:
1. Search Google Maps by industry and city.
2. Look for businesses with no website listed.
3. Check businesses that only link Facebook, Instagram, Vagaro, GlossGenius, Square, or booking-only pages.
4. Screenshot weak websites or social-only pages.
5. Score each lead before messaging.
6. Create a mini-audit or mockup for the best leads.

Search Phrases:
- "[industry] [city] no website"
- "[industry] [city] Facebook"
- "[industry] [city] Instagram"
- "[industry] [city] booking"
- "[industry] [city] old website"
- "[industry] near [city]"
- "site:facebook.com [industry] [city]"
- "site:instagram.com [industry] [city]"

Lead Score Rules:
10/10 = no website, active business, strong photos, clear need
8/10 = weak website, good service, needs better booking/contact flow
6/10 = has decent website but weak Google/social presence
4/10 = hard to verify or inactive
1/10 = not worth contacting

Recommended Output Format:
Business Name:
Industry:
City:
Current Link:
Problem Found:
Lead Score:
Best Phantom Forge Offer:
Suggested Outreach Angle:

Next Step:
Search manually for 10 businesses, paste them into the Lead Agent, then save the best ones for mockups or audits.`,
    };
  }

  if (agentType === "mockup") {
    return {
      success: true,
      output: `PHANTOMSYNC MOCKUP AGENT

Mockup Input:
${input}

Current Mockup Status:
Research and planning stage.

Recommended Mockup Workflow:
1. Collect screenshots of current website/socials.
2. Save logo, photos, services, reviews, and booking/contact info.
3. Create Concept A with a premium Phantom Forge style.
4. Create Concept B with a brighter customer-friendly style.
5. Add Phantom Forge watermark.
6. Prepare before/after post.
7. Send with short outreach message.

Next Step:
Decide whether the mockup needs a landing page preview, logo concept, or full before/after presentation.`,
    };
  }

  return {
    success: false,
    output: "Unknown agent type.",
  };
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "PhantomSync backend online",
  });
});

app.post("/api/agent/:agentType", (req, res) => {
  const { agentType } = req.params;
  const { input } = req.body;

  const response = buildFakeAgentResponse(agentType, input);
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`PhantomSync server running on http://localhost:${PORT}`);
});