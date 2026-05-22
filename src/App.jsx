import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <nav className="nav">
        <div className="brand">
          <span className="brand-mark">PF</span>
          <div>
            <h1>Phantom Forge</h1>
            <p>Local websites, visibility audits, and premium client systems.</p>
          </div>
        </div>

        <div className="nav-actions">
          <a href="#services">Services</a>
          <a href="#audit">Audit</a>
          <a href="#contact" className="nav-button">Book Call</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Built for local businesses that need to look serious online.</p>
          <h2>Turn weak online presence into a clean, premium customer experience.</h2>
          <p className="hero-text">
            Phantom Forge helps service businesses upgrade their website, Google visibility,
            booking flow, and first impression with modern design and practical strategy.
          </p>

          <div className="hero-buttons">
            <a href="#audit" className="primary-button">Start With an Audit</a>
            <a href="#services" className="secondary-button">View Services</a>
          </div>
        </div>

        <div className="hero-card">
          <p className="card-label">Mini Audit Preview</p>
          <h3>What we check</h3>
          <ul>
            <li>Mobile-first website experience</li>
            <li>Google Business Profile clarity</li>
            <li>Booking and contact flow</li>
            <li>Trust signals, reviews, and service clarity</li>
          </ul>
        </div>
      </section>

      <section className="section" id="services">
        <div className="section-heading">
          <p className="eyebrow">Core services</p>
          <h2>Simple offers that lead to real client conversations.</h2>
        </div>

        <div className="cards">
          <article className="service-card">
            <h3>Visibility Audit</h3>
            <p>
              A clear review of the business website, Google presence, social links,
              and customer journey.
            </p>
          </article>

          <article className="service-card">
            <h3>Landing Page Build</h3>
            <p>
              A clean one-page site designed to explain services, build trust,
              and drive calls or bookings.
            </p>
          </article>

          <article className="service-card">
            <h3>Google Cleanup</h3>
            <p>
              Help businesses organize their service wording, contact details,
              photos, reviews, and local search presence.
            </p>
          </article>
        </div>
      </section>

      <section className="audit-panel" id="audit">
        <div>
          <p className="eyebrow">Phantom Forge audit</p>
          <h2>Start small. Show value first.</h2>
          <p>
            Use audits to open the door before pitching a full website. The goal is to
            show business owners what is hurting trust, visibility, and bookings.
          </p>
        </div>

        <div className="audit-list">
          <span>01 / First impression</span>
          <span>02 / Mobile layout</span>
          <span>03 / Services clarity</span>
          <span>04 / Contact flow</span>
          <span>05 / Google visibility</span>
        </div>
      </section>

      <footer id="contact">
        <p>© 2026 Phantom Forge. Built by Elijah France.</p>
        <p>Websites • Audits • Client Systems • Local Visibility</p>
      </footer>
    </main>
  );
}

export default App;