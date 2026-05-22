import { useState } from "react";
import "./App.css";

const agentData = {
  audit: {
    name: "Audit Agent",
    label: "Visibility + Conversion",
    description:
      "Turn a business website, social page, or notes into a clean Phantom Forge audit.",
    placeholder:
      "Example: Audit Garden of Ink. Tattoo studio, uses Vagaro, strong photos, no full website, needs better Google visibility.",
    button: "Run Audit Agent",
  },
  lead: {
    name: "Lead Agent",
    label: "Lead Finder + Qualifier",
    description:
      "Score leads, identify pain points, and suggest the best Phantom Forge offer.",
    placeholder:
      "Example: Add Jester Lawn and Land. Lawn care business, active Facebook, weak branding, needs website and Google cleanup.",
    button: "Run Lead Agent",
  },
  mockup: {
    name: "Mockup Agent",
    label: "Design Tracker",
    description:
      "Track Concept A/B, screenshots, logo ideas, outreach status, and next steps.",
    placeholder:
      "Example: Track S&K. Concept A complete, Concept B needed, invoice message sent, waiting on photos.",
    button: "Run Mockup Agent",
  },
};

const starterStats = [
  { label: "Agents Online", value: "3" },
  { label: "Mode", value: "Lab" },
  { label: "Storage", value: "Local" },
  { label: "API", value: "Next" },
];

function generateAgentResponse(activeAgent, input) {
  const cleanInput = input.trim();

  if (!cleanInput) {
    return "Add business details first. Give me the business name, industry, website/social link, and what you noticed.";
  }

  if (activeAgent === "audit") {
    return `PHANTOM FORGE AUDIT DRAFT

Business Notes:
${cleanInput}

1. First Impression
The business has enough information to start a visibility review, but the online presence needs to feel clearer, more trustworthy, and easier to act on.

2. What Is Working
- There is already some public presence to build from.
- The business likely has photos, services, or social proof that can be turned into stronger website content.
- A focused landing page could make the brand feel more professional fast.

3. What May Be Hurting Them
- Customers may not instantly understand the services, booking flow, or next step.
- If they rely only on social media, they may be missing search traffic from Google.
- If the contact button, booking link, or service list is unclear, people may leave before reaching out.

4. Quick Wins
- Add a clean mobile-first landing page.
- Add clear service sections.
- Add a strong call-to-action above the fold.
- Add reviews, photos, and trust signals.
- Improve Google visibility wording with city + service keywords.

5. Phantom Forge Recommendation
Start with a Local Visibility Audit, then offer a mobile landing page with Google Business Profile cleanup.

Suggested Outreach Angle:
“I noticed a few areas where your online presence could make it easier for customers to find, trust, and contact you. I put together a quick audit showing what could be improved.”`;
  }

  if (activeAgent === "lead") {
    return `LEAD QUALIFICATION DRAFT

Lead Notes:
${cleanInput}

Lead Score: 8/10

Best Fit Service:
- Local Visibility Audit
- Landing Page Build
- Google Business Profile Cleanup

Why This Lead Is Worth Contacting:
- The business appears to have an online presence but may not have a complete customer journey.
- If they rely heavily on social media, Phantom Forge can offer a stronger home base.
- This lead could respond well to a free mini-audit or mockup preview.

Suggested Status:
New Lead → Research → Send Mini Audit → Follow Up in 2 Days

Recommended Message:
“Hey, I came across your business and noticed a few ways your online presence could be cleaner and easier for customers to use. I help local businesses improve their website, Google visibility, and booking flow. Would you be open to me sending over a quick mini-audit?”`;
  }

  return `MOCKUP TRACKING DRAFT

Mockup Notes:
${cleanInput}

Current Status:
- Research started
- Screenshots/content review needed
- Concept direction ready to define

Recommended Mockup Plan:
1. Collect current screenshots
2. Save logo/photos/services
3. Create Concept A: premium clean landing page
4. Create Concept B: brighter customer-friendly version
5. Prepare before/after post
6. Send with a short outreach message

Next Steps:
- Confirm business name and industry
- Choose design direction
- Build mobile-first preview
- Add Phantom Forge watermark
- Track whether mockup was sent

Suggested Follow-Up:
“Just wanted to send over this quick visual concept. It is not a final website, just an example of how your online presence could look cleaner and make it easier for customers to contact or book with you.”`;
}

function App() {
  const [activeAgent, setActiveAgent] = useState("audit");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [savedItems, setSavedItems] = useState([]);

  const currentAgent = agentData[activeAgent];

 async function handleRunAgent() {
   setOutput("Running agent...");

  try {
    const response = await fetch(`http://localhost:5050/api/agent/${activeAgent}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();

    if (!data.success) {
      setOutput(data.output || "Something went wrong.");
      return;
    }

    setOutput(data.output);
  } catch (error) {
    setOutput(
      "Could not reach the PhantomSync backend. Make sure the server is running with npm.cmd run dev:all."
    );
  }
}

  function handleSaveResult() {
    if (!output.trim()) return;

    const newItem = {
      id: Date.now(),
      agent: currentAgent.name,
      title: input.slice(0, 48) || "Untitled result",
      output,
    };

    setSavedItems([newItem, ...savedItems]);
  }

  function handleClear() {
    setInput("");
    setOutput("");
  }

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <div className="brand">
          <span className="brand-mark">PS</span>
          <div>
            <h1>PhantomSync Agent Lab</h1>
            <p>Prototype space for Phantom Forge AI agents.</p>
          </div>
        </div>

        <div className="nav-status">
          <span className="pulse"></span>
          Local V1 Online
        </div>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">Phantom Forge internal AI system</p>
          <h2>Build audits, organize leads, and track mockups from one agent lab.</h2>
          <p className="hero-text">
            This is the safe prototype environment for PhantomSync before features move into
            portal.phantomforge.pro.
          </p>
        </div>

        <div className="stats-grid">
          {starterStats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="agent-layout">
        <aside className="agent-sidebar">
          <p className="sidebar-label">Choose Agent</p>

          {Object.entries(agentData).map(([key, agent]) => (
            <button
              key={key}
              className={activeAgent === key ? "agent-tab active" : "agent-tab"}
              onClick={() => {
                setActiveAgent(key);
                setOutput("");
              }}
            >
              <span>{agent.name}</span>
              <small>{agent.label}</small>
            </button>
          ))}
        </aside>

        <section className="agent-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{currentAgent.label}</p>
              <h3>{currentAgent.name}</h3>
              <p>{currentAgent.description}</p>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={currentAgent.placeholder}
          />

          <div className="button-row">
            <button className="primary-button" onClick={handleRunAgent}>
              {currentAgent.button}
            </button>
            <button className="secondary-button" onClick={handleSaveResult}>
              Save Result
            </button>
            <button className="ghost-button" onClick={handleClear}>
              Clear
            </button>
          </div>

          <div className="output-box">
            <div className="output-header">
              <span>Agent Output</span>
              <small>{output ? "Ready" : "Waiting for input"}</small>
            </div>

            <pre>{output || "Run an agent to generate a draft response here."}</pre>
          </div>
        </section>
      </section>

      <section className="saved-section">
        <div className="section-heading">
          <p className="eyebrow">Local memory preview</p>
          <h3>Saved Agent Results</h3>
        </div>

        {savedItems.length === 0 ? (
          <div className="empty-state">
            No saved results yet. Run an agent, then click “Save Result.”
          </div>
        ) : (
          <div className="saved-grid">
            {savedItems.map((item) => (
              <article className="saved-card" key={item.id}>
                <span>{item.agent}</span>
                <h4>{item.title}</h4>
                <p>{item.output.slice(0, 170)}...</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;