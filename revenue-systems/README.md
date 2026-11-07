# Phantom Forge Revenue Systems — Pilot Intake

**Project $100K is a $100,000/month gross revenue goal, not current revenue.**

This app runs independently from Frontline Forge Solutions. Its working source is on the project-100k-intake branch only, in the revenue-systems directory.

## Current functionality
- Front-end pilot application form and privacy notice
- Node HTTP API POST /api/apply with consent and input validation
- Honeypot and same-origin controls
- Neon Postgres server-side storage with 1-hour email duplicate suppression
- GET /api/health with no secrets shown
- No billing, call answering, CRM synchronization, automated prospecting or appointment bookings yet

## Deployment
- Use a separate new hosting service/project; do not point an existing brand domain at this while the pilot is unreviewed.
- Build: cd revenue-systems && npm install
- Start: cd revenue-systems && npm start
- Set DATABASE_URL as a secret for dedicated Neon project withered-silence-13587258 only.
- Never commit credentials or customer data.
- Initial Render plan, if used, must be "free" and treated as staging, not production-grade hosting.

## Required before broad launch
- Test GET /api/health and POST /api/apply end to end against isolated Neon database.
- Confirm an authorized, monitored receiving mailbox and an application review cadence.
- Add robust anti-abuse limits, consent/retention and privacy handling, and authenticated operator access.
- Develop and validate service delivery, contracts, integration credentials, support, and the payment system.
- Do not promise results, charge users, or automate customer outreach without the required authorizations.

## Pilot offer
Proposed $500/month for one scoped workflow; later price of $2,500/month is aspirational and must be proven. No checkout enabled.