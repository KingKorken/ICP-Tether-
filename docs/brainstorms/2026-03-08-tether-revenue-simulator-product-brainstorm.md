# Brainstorm: Tether Revenue Simulator — From Proposal to Product

**Date:** 2026-03-08
**Status:** Active
**Context:** Building a working product from the merged Revenue Simulator concept pitched to Tether (Esade I2P project). The existing HTML prototype has proven calculation logic, interactive inputs, and visualizations. Now we need to productize it with tokenised access, analytics, and a data collection strategy.

---

## What We're Building

A **standalone web application** (e.g. `app.tetherev.io/simulator`) that transforms the existing Revenue Simulator prototype into a production product with three pillars:

### 1. The Calculator (CPO-Facing)
The interactive revenue simulator that shows CPOs their potential earnings from Tether's two revenue streams (e-credits + grid flexibility). Built on the proven calculation engine from the merged concept HTML.

**Core inputs:** Company name, business email, country, charger type (public/residential), number of chargers, power per charger, utilization rate, flexibility potential.

**Core outputs:** Annual revenue estimate (split by e-credits + flexibility), revenue per charger, 12-month seasonal chart, 12/24-month cumulative timeline, loss-aversion counter, expandable methodology section.

### 2. Tokenised Access System (Gate + Tracking)
Email-gated access: CPOs enter their business email to receive a unique access token. This token ties all subsequent interactions to that identity.

**What the token enables:**
- Identify WHO is using the tool (company, role, email domain → company size inference)
- Track WHAT they input (charger count, country, type → market intelligence)
- Measure HOW they engage (frequency of visits, time spent, sections viewed, inputs changed)
- Score WHEN they're sales-ready (engagement signals → lead scoring)

### 3. Data & Intelligence Layer (Tether-Facing)
Every calculator interaction generates structured data feeding three use cases:

- **Lead qualification:** Individual CPO engagement scoring for sales prioritization
- **Market intelligence:** Aggregate fleet sizes, charger types, country distribution, reported utilization rates
- **Sales pipeline:** Visit frequency, return rate, export actions, "Contact Sales" clicks

---

## Why This Approach

**Chosen approach: Token-First MVP (Approach 1)**

Ship the core value loop in 2-4 weeks, then iterate based on real usage data.

**Rationale:**
1. **Data flywheel starts immediately** — Every day without the product running is data not collected. The sooner CPOs interact with the tool, the sooner Tether has market intelligence.
2. **Existing calculation engine is proven** — The Revenue Simulator HTML already has working formulas, interactive inputs, seasonal models, and visualizations. We're wrapping, not rebuilding.
3. **YAGNI on enhancements** — Scenario comparison, real-time market data, and benchmarking are all valuable, but building them before knowing how CPOs actually use the tool risks building features nobody wants.
4. **Competitive research validates the model** — Competitor analysis shows 78% completion rates with 3-5 inputs, and instant results convert 3.4x better than gated results. Our approach (email gate → full access) aligns with best practices.

**Approaches considered but deferred:**
- **Full-Featured Launch (Approach 2):** 6-8 weeks, includes scenario comparison + PDF + partial real-time data. Rejected: too long before data collection starts.
- **Data Platform First (Approach 3):** Lean calculator, heavy backend analytics. Rejected: CPO-facing experience must be strong enough to generate the data worth collecting.

---

## Key Decisions

### Architecture
- **Tech stack:** Next.js (React) + Supabase (Postgres DB + auth + edge functions)
- **Deployment target:** Standalone web app on dedicated subdomain
- **Frontend:** Port existing Revenue Simulator calculation engine and UI into React components
- **Backend:** Next.js API routes for token management, event tracking, admin dashboard
- **Database:** Supabase Postgres for users (tokens), sessions, events, and calculator snapshots

### Token System
- **Distribution:** Email-gated. CPO enters business email on landing page.
- **Token format:** Unique URL token (e.g. `app.tetherev.io/sim/t/abc123def`)
- **Token lifecycle:** Email → verify → token generated → cookie stored → all interactions tagged
- **No password:** Token-based access only. Bookmark the link, return anytime.
- **Sales can also generate tokens:** Admin creates token pre-filled with CPO data, sends link.

### Data Collection (What We Track)
| Category | Events | Purpose |
|----------|--------|---------|
| Identity | Email, company name, email domain | Lead identification |
| Fleet data | Charger count, type, power, country | Market intelligence |
| Engagement | Page views, time on tool, return visits | Interest measurement |
| Interaction | Inputs changed, sliders moved, sections expanded | Depth of engagement |
| Conversion | PDF exported, "Contact Sales" clicked, results shared | Sales readiness |
| Methodology | "See the Math" expanded, formulas viewed | Trust/technical buyer signal |

### MVP Scope (v1 — 2-4 weeks)
**In scope:**
- Email-gated landing page with clear value prop
- Full interactive calculator (ported from existing HTML)
- Token generation and session tracking
- Event tracking on all interactions (client-side → API → DB)
- Basic admin dashboard (list of leads, engagement scores, fleet data table)
- PDF export of personalized revenue report (branded)
- Mobile-responsive design

**Out of scope (v2+):**
- Scenario comparison (save/compare multiple configurations)
- Real-time market data integration (live mFRR/FCR/CO2 prices)
- Benchmarking / peer comparison (needs aggregate data first)
- CRM/HubSpot integration (manual export from admin for now)
- A/B testing infrastructure
- Multi-language support

### Design Direction
- Build on the Revenue Simulator's purple/cyan scheme (`--brand-primary: #2D1B69`, `--brand-accent: #00D4FF`) or align to Tether's actual brand guidelines if available
- Inter + Playfair Display font pairing (established in prototypes)
- Clean, modern SaaS aesthetic — trust-building for B2B audience

---

## Enhancement Roadmap (Post-MVP)

### Phase 2: Deepen Engagement (Month 2-3)
- **Scenario Comparison:** Save configurations, compare side-by-side (e.g. "current fleet" vs. "planned expansion"). Increases return visits and time-on-tool.
- **PDF Report v2:** Multiple report styles — executive summary (1-page) vs. detailed analysis (5-page with methodology). Include CPO branding option.

### Phase 3: Live Data & Benchmarking (Month 3-4)
- **Real-Time Market Data:** Integrate live mFRR/FCR prices from Mimer (Svenska kraftnat) and CO2 prices. Makes the tool a living dashboard, not a one-time calculator.
- **Peer Benchmarking:** "CPOs with similar fleet sizes in Sweden typically earn X from flexibility." Built from anonymized aggregate data collected through the tool.

### Phase 4: Platform Features (Month 4+)
- **CRM Integration:** Auto-push leads and engagement data to HubSpot/Salesforce
- **API Access:** Let CPOs embed their revenue widget on their own dashboards
- **Historical Tracking:** Show CPOs how their projected revenue changes over time as market conditions evolve
- **Fleet Optimization Suggestions:** "Adding 50 residential chargers could increase your flexibility revenue by 23%"

---

## Resolved Questions

1. **Tether brand guidelines:** Use Tether's existing brand assets (colors, logo, typography). Need to obtain these from the client.

2. **Email verification depth:** Accept all emails (including free providers), but flag/tag free-email users differently in analytics. Lower barrier to entry while still distinguishing B2B leads from casual visitors.

3. **Admin dashboard users:** Sales team + leadership. Build two views: (a) sales-focused with lead scoring, engagement signals, and pipeline management, and (b) leadership-focused with aggregate market intelligence dashboards for strategic decisions.

4. **Country coverage:** Launch with all 5 countries (Sweden, Norway, Germany, Netherlands, France). Mark non-Sweden estimates as "preliminary" or "estimated" in the UI. Sweden has real market data; others use multiplier-based estimates.

## Open Questions

1. **Data privacy / GDPR:** The tool collects business emails and usage data from EU-based companies. We will need a privacy policy, cookie consent, and data processing agreement. Needs legal review before production launch.

2. **Tether brand asset delivery:** Need to obtain actual brand files (logo, color palette, typography specs) from Tether to implement the design.

---

## Success Metrics

- **Lead capture rate:** % of visitors who enter email and receive token
- **Calculator completion rate:** % of token holders who fill in all inputs and view results
- **Return visit rate:** % of token holders who come back within 7/14/30 days
- **Methodology engagement:** % who expand "See the Math" (signals technical buyer)
- **PDF export rate:** % who download their report (signals internal champion)
- **Contact Sales conversion:** % who click CTA after seeing results
- **Data richness:** Average number of data points collected per CPO interaction
