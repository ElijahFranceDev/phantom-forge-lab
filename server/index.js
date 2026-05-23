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

function scoreBusiness(place) {
  let score = 0;
  const reasons = [];

  const hasWebsite = Boolean(place.websiteUri);
  const hasPhone = Boolean(place.nationalPhoneNumber);
  const rating = place.rating || 0;
  const reviews = place.userRatingCount || 0;
  const status = place.businessStatus || "UNKNOWN";

  if (!hasWebsite) {
    score += 40;
    reasons.push("No website listed");
  } else {
    score += 12;
    reasons.push("Website exists, needs manual review");
  }

  if (hasPhone) {
    score += 12;
    reasons.push("Phone number available");
  }

  if (rating >= 4.7) {
    score += 16;
    reasons.push("Strong Google rating");
  } else if (rating >= 4.3) {
    score += 12;
    reasons.push("Good Google rating");
  } else if (rating >= 4.0) {
    score += 8;
    reasons.push("Decent Google rating");
  }

  if (reviews >= 150) {
    score += 18;
    reasons.push("High review count");
  } else if (reviews >= 75) {
    score += 14;
    reasons.push("Solid review count");
  } else if (reviews >= 25) {
    score += 10;
    reasons.push("Some review proof");
  } else if (reviews > 0) {
    score += 5;
    reasons.push("Low but existing review proof");
  }

  if (status === "OPERATIONAL") {
    score += 10;
    reasons.push("Business appears operational");
  }

  if (score > 100) score = 100;

  let priority = "Low";
  if (score >= 80) priority = "High";
  else if (score >= 60) priority = "Medium";

  let bestOffer = "Local Visibility Audit";
  if (!hasWebsite) {
    bestOffer = "Mobile landing page + Google visibility audit";
  } else if (hasWebsite && score >= 65) {
    bestOffer = "Website audit + booking/contact flow review";
  }

  return {
    score,
    priority,
    reasons,
    bestOffer,
  };
}

function formatScoutResults(query, places) {
  if (!places.length) {
    return `CLIENT SCOUT RESULTS

Search Query:
${query}

No businesses were found from Google Places for this search.

Try a broader search like:
- tattoo shops in Winston-Salem NC
- tattoo studios Winston-Salem
- piercing shops Winston-Salem NC`;
  }

  const ranked = places
    .map((place) => {
      const scoring = scoreBusiness(place);

      return {
        name: place.displayName?.text || "Unknown business",
        address: place.formattedAddress || "Address not listed",
        rating: place.rating || "No rating",
        reviews: place.userRatingCount || 0,
        website: place.websiteUri || "No website listed",
        phone: place.nationalPhoneNumber || "No phone listed",
        maps: place.googleMapsUri || "Google Maps link not available",
        status: place.businessStatus || "Unknown",
        score: scoring.score,
        priority: scoring.priority,
        reasons: scoring.reasons,
        bestOffer: scoring.bestOffer,
      };
    })
    .sort((a, b) => b.score - a.score);

  const resultText = ranked
    .map((business, index) => {
      return `${index + 1}. ${business.name} — ${business.score}/100 (${business.priority} Priority)
Address: ${business.address}
Rating: ${business.rating}
Reviews: ${business.reviews}
Website: ${business.website}
Phone: ${business.phone}
Google Maps: ${business.maps}
Status: ${business.status}
Why this lead ranks here: ${business.reasons.join(", ")}
Best Phantom Forge Offer: ${business.bestOffer}
Outreach Angle: ${
        business.website === "No website listed"
          ? "Lead with the fact that they already have Google presence/reviews, but no full website listed for customers to view services, trust the brand, and contact/book easily."
          : "Lead with a quick audit angle. Mention that they have a website listed, but Phantom Forge can review whether it is mobile-friendly, modern, and built to convert visitors into appointments."
      }`;
    })
    .join("\n\n");

  return `CLIENT SCOUT RESULTS

Search Query:
${query}

Ranked high-to-low based on missing website, reviews, rating, phone availability, and business status.

${resultText}

Next Step:
Pick the top 3 high-priority leads, screenshot their Google listing/website/socials, then run each one through the Audit Agent for a personalized mini-audit.`;
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "PhantomSync backend online",
  });
});

app.post("/api/scout-businesses", async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || !input.trim()) {
      return res.status(400).json({
        success: false,
        output: "Add a search request first, like: Find tattoo shops in Winston-Salem, NC with no website.",
      });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return res.status(500).json({
        success: false,
        output: "Missing GOOGLE_PLACES_API_KEY. Add it to your local .env file and Render environment variables.",
      });
    }

    const googleResponse = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.businessStatus,places.types",
      },
      body: JSON.stringify({
        textQuery: input,
        maxResultCount: 15,
        languageCode: "en",
        regionCode: "US",
      }),
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      console.error("Google Places error:", data);

      return res.status(500).json({
        success: false,
        output:
          "Google Places hit an error. Check your API key, billing, Places API access, and Render environment variables.",
      });
    }

    const places = data.places || [];
    const output = formatScoutResults(input, places);

    return res.json({
      success: true,
      output,
    });
  } catch (error) {
    console.error("Scout businesses error:", error);

    return res.status(500).json({
      success: false,
      output:
        "Client Scout hit an error while searching Google Places. Check your Render logs and Google API key setup.",
    });
  }
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

app.use(express.static(path.join(__dirname, "../dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`PhantomSync server running on http://localhost:${PORT}`);
});