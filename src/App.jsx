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
  scout: {
    name: "Client Scout Agent",
    label: "Internet Lead Search",
    description:
      "Create search plans for finding businesses that need websites, audits, Google cleanup, or mockups.",
    placeholder:
      "Example: Find tattoo shops in Fort Wayne with no website, weak websites, or only social media presence.",
    button: "Run Client Scout",
  },
};

const starterStats = [
  { label: "Agents Online", value: "4" },
  { label: "Mode", value: "Live Lab" },
  { label: "Storage", value: "Local" },
  { label: "API", value: "OpenAI" },
];

function App() {
  const [activeAgent, setActiveAgent] = useState("audit");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [savedItems, setSavedItems] = useState([]);

  const currentAgent = agentData[activeAgent];

  async function handleRunAgent() {
    setOutput("Running agent...");

    try {
      const response = await fetch(`/api/agent/${activeAgent}`, {
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
        "Could not reach the PhantomSync backend. Make sure the deployed server is running."
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
          Live V1 Online
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