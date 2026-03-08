# Industry Research: European Grid Balancing, E-Credits & CPO Market Overview
## Context: Tether — Helping CPOs Earn Revenue from EV Charging Infrastructure

*Research compiled February 2026*

---

## 1. Grid Balancing Markets in Europe (Focus: Nordics / Sweden)

### How Frequency Markets Work

European Transmission System Operators (TSOs) maintain grid frequency at 50 Hz by procuring reserve services from market participants. The three main products, in order of activation speed:

| Product | Activation Time | How It Works | Nordic TSO |
|---------|----------------|--------------|------------|
| **FCR-N** (Normal) | Seconds | Automatically corrects small frequency deviations (+/- 100 mHz). Continuous, proportional response. | Svenska kraftnat (SE), Fingrid (FI), Statnett (NO), Energinet (DK) |
| **FCR-D** (Disturbance) | Seconds | Activates for larger frequency drops (below 49.9 Hz). Emergency backstop. | Same |
| **aFRR** | ~30 seconds | Automatic Frequency Restoration Reserve. Restores frequency after FCR activates. | Nordic aFRR capacity market launched |
| **mFRR** | 12.5 minutes | Manual Frequency Restoration Reserve. TSO-dispatched, slower, larger volumes. | mFRR EAM launched March 2025 |

### Key Nordic Market Developments (2025-2026)

**mFRR Energy Activation Market (EAM) — launched March 4, 2025:**
- Introduced 15-minute Market Time Units (MTUs) for bidding and pricing
- Following launch, imbalance prices in three Swedish bidding zones reached EUR 2,000/MWh during peak hours — demonstrating extreme price volatility and revenue opportunity
- Day-ahead market also moving to 15-minute MTUs from September 30, 2025

**FCR Pricing in Sweden (April 2025 reference):**
- FCR-N averaged 37.4 EUR/MW
- FCR-D up averaged 8.91 EUR/MW
- FCR-D down averaged 11.38 EUR/MW
- Battery capacity qualified for FCR-N increased by 30% since January 2025 in southern Sweden
- In 2024, FCR prices on average hovered slightly above 50 EUR/MW

**Revenue Stacking Opportunity:**
- Combining day-ahead market + FCR market yields 76% larger profit vs. operating separate assets for each service
- Storage assets in Sweden and Finland earn 70-90% of baseline revenues from frequency reserve services (primarily FCR-N in Finland, FCR-D in Sweden)
- mFRR procurement expected to grow significantly in both Finland and Sweden

### What This Means for EV Charging / Tether

For a consumption portfolio like aggregated EV chargers:
- **mFRR up** = reducing charging (load shedding — you get paid to NOT charge)
- **mFRR down** = increasing charging (you get paid to absorb excess grid energy)
- A single charger's flexibility is too small, but **aggregating hundreds of chargers creates a resource significant enough to participate in flexibility markets**
- Co-optimization across day-ahead + mFRR increases expected profit and lowers downside risk
- No study had evaluated EV aggregator participation in the Nordic 15-min mFRR EAM until late 2025 — this is a genuinely nascent opportunity

---

## 2. E-Credits / Carbon Credit Markets for EV Charging

### Sweden's Reduktionsplikt (Greenhouse Gas Reduction Mandate)

**What it is:** Swedish law requiring fuel suppliers (gasoline and diesel distributors) to reduce greenhouse gas emissions from their fuels by a specified percentage each year, primarily through biofuel blending.

**Critical 2025 change:** From July 1, 2025, the reduction levels increased from 6% to 10% for both gasoline and diesel. More importantly, **electricity credits (elkrediter) may now be used to fulfill the mandate** — this is a brand-new revenue stream for EV charging operators.

**How it works for CPOs:**
1. Public charging station operators generate electricity credits for every kWh of electricity delivered to EVs
2. These credits can be transferred/sold to fuel suppliers who use them to meet their reduction obligation
3. Fuel suppliers buy credits to offset emissions (cheaper than biofuel blending in many cases)
4. The proposed value is **0.27 SEK (27 ore) per publicly charged kWh**
5. There are no provisions in the law about HOW compensation works — parties must negotiate bilateral contracts, creating a role for intermediaries/aggregators like Tether

**Key nuance:** The law allows the climate benefit from electricity to be sold as emission credits. CPOs who do not themselves sell fuel can sell credits to fuel distributors. This creates an entirely new market for credit brokers.

### EU RED III (Renewable Energy Directive III)

**The 4x Multiplier:**
- Under RED III, renewable energy delivered to road vehicles via charging gets a **4x multiplier** in calculating a member state's renewable transport target
- This dramatically increases the "value" of each kWh of renewable electricity used in EV charging compared to other uses
- Reflects the higher energy efficiency of BEVs vs. ICE vehicles

**The Credit Mechanism (Article 25):**
- RED III **mandates** all 27 EU member states to establish a credit marketplace
- CPOs who supply electricity to EVs through public charging points can **generate and sell credits** to fuel suppliers
- Fuel suppliers buy credits to meet their renewable energy transport obligations
- Transposition deadline was May 21, 2025 — implementation varies by country
- ChargeUp Europe has developed an implementation guide for national authorities

**Revenue flow:** CPO charges EV --> generates credit --> sells credit to fuel supplier (often via broker/trader) --> fuel supplier uses credit toward regulatory obligation

**Why this matters for Tether:** This is a complex, fragmented market with 27 different national implementations. CPOs need help navigating it. The credit mechanism is brand-new, and many CPOs don't yet understand or participate. An aggregator/intermediary that handles credit generation, certification, and sales could capture significant value.

---

## 3. CPO Industry Pain Points (2025-2026)

### The Core Economics Problem

CPO revenue follows a simple formula:
**Total Income = (Number of Stations) x (Avg Sessions/Day/Station) x (Avg Price per kWh)**

But the reality is harsh:

**Low Utilization:**
- Many public DC networks report single-digit average utilization (~8% in some portfolios)
- Lease costs, grid capacity charges, maintenance, and depreciation accrue regardless of utilization
- Networks are often oversized for current demand — built for future EV adoption that hasn't arrived yet
- Massive variation by location: urban taxi fleet sites can hit 60%, while rural sites languish at sub-10%

**Capital Intensity:**
- Heavy upfront CAPEX for hardware, grid connections, and site development
- Grid connection timelines are a major bottleneck — prolonged bureaucratic processes
- Insufficient grid capacity in many areas

**Profitability Timeline:**
- Most CPOs report breakeven in 2-4 years for fast-charging, sometimes faster with grants or fleet deals
- Many businesses are in "long-game mode" — burning cash while building network scale
- Industry has seen a wave of market exits and bankruptcies among smaller players
- A typical CPO captures only $70-500/year per customer (avg ~$140), with only 13-24% of average customer wallet share

### The Competitive Squeeze

- More players entering = market saturation and price competition
- Differentiation is increasingly difficult — charging is becoming commoditized
- Leading CPOs with scale advantages (Tesla Supercharger, Ionity, etc.) are pulling ahead
- Smaller CPOs struggle to compete on reliability, coverage, and pricing

### What CPOs Are Desperate For

1. **New revenue streams** that don't depend on more EV drivers showing up
2. **Higher asset utilization** of existing infrastructure
3. **Reduced operational costs** through smarter energy management
4. **Faster path to profitability** to satisfy investors and lenders
5. **Competitive differentiation** beyond basic charging service

---

## 4. EV Flexibility / V2G / Smart Charging Trends

### The Macro Opportunity

The EY/Eurelectric 2025 study ("Plugging into potential") provides the definitive numbers:
- **50+ million EVs** on European roads by 2030 (15% of total vehicle stock)
- EV batteries could provide **114 TWh of battery capacity** by 2030 — enough to power 30 million homes
- EV owners could save **EUR 450-2,900 per year** through smart + bidirectional charging
- DSOs could benefit from **EUR 4 billion in annual savings** from EV flexibility
- Grid investments could drop from EUR 67bn to EUR 55bn annually (2025-2050) — a EUR 12bn/year reduction

### V2G Commercialization Timeline

- **2025:** V2G moving from experimental to early commercial. UK mandated V2G capability for new commercial charge points above 22kW from March 2025.
- **2026:** Anticipated as the year V2G moves from experimental technology to commercial standard. Large selection of EV models expected to ship with V2G support by default.
- Active projects: 50 Renault 5 E-Tech EVs live today, scaling to 500 V2G-capable vehicles with ~EUR 100M project budget targeting local grid stability.

### Smart Charging Aggregation Models

**Jedlix (now Kraken/Octopus Energy):**
- Pioneer since 2016 in consumer smart charging
- Aggregates tens of thousands of EVs and chargers across 9 European countries
- Revenue model: controls EV charging timing to balance the grid, gets paid by grid operators and energy companies, passes portion back to customers
- Acquired by Kraken Technologies (Octopus Energy Group subsidiary)
- API integrations with major OEMs (Renault, Polestar, Kia, Hyundai) and charger manufacturers (Easee, Zaptec, Wallbox)

**Key insight:** The Jedlix acquisition by Octopus/Kraken validates that large energy players see EV flexibility aggregation as strategically valuable.

### Regulatory Tailwinds

- EU AFIR (Alternative Fuels Infrastructure Regulation) exploring V2G integration measures
- Multiple member states developing frameworks for flexibility market participation
- Nordic TSOs actively updating technical requirements to accommodate new asset types (batteries, EVs)

---

## 5. How CPOs Evaluate New Revenue Opportunities

### Decision-Making Framework

CPOs evaluate new services through several lenses:

**Financial:**
- Revenue per charger/per site — must be material enough to matter
- Payback period on any required investment (hardware, software, integration)
- Predictability of revenue — recurring > one-time
- Impact on existing charging revenue (will it cannibalize or complement?)

**Operational:**
- Integration complexity with existing CPMS (Charge Point Management System)
- Impact on charger uptime and reliability — the #1 operational priority
- Staff/resource requirements to manage the new service
- Scalability across their network

**Strategic:**
- Competitive differentiation potential
- Alignment with investor/board expectations
- Regulatory compliance or advantage
- Customer experience impact (will smart charging frustrate drivers?)

### What Actually Convinces CPOs to Adopt

1. **Proof with real numbers** — not projections, but demonstrated revenue from comparable deployments
2. **Low integration friction** — plug-and-play with existing systems
3. **No risk to core business** — charging availability must not be compromised
4. **Revenue that scales with their network** — not a one-off benefit
5. **Data-driven decision making** — CPOs increasingly use analytics for site selection, pricing, and operations. They expect the same rigor from partners.

### Revenue Streams CPOs Are Already Pursuing

- **Dynamic pricing:** Time-of-day, demand-based pricing optimization
- **White-label / turnkey services:** Building or operating chargers for others
- **Demand response:** Getting paid to reduce load during grid stress
- **Fleet contracts:** Guaranteed utilization from commercial fleet operators
- **Advertising and ancillary sales:** Revenue from co-located services
- **Renewable energy credits:** Emerging (RED III, Reduktionsplikt)
- **Grid services:** Emerging (FCR, mFRR participation via aggregation)

---

## 6. Trust and Credibility Barriers

### Why CPOs Are Skeptical of Revenue Projections from Startups

**The Credibility Gap:**
- Charging station reliability is already a pain point (success rates of only 64-80% for leading CPOs in some markets)
- CPOs have been burned by technology promises that didn't deliver
- Startup revenue projections are frequently viewed as optimistic at best, misleading at worst

**Specific Trust Barriers:**

1. **"Show me, don't tell me"** — CPOs want to see live deployments earning real revenue, not pitch deck projections. Investors have flagged that listing non-binding MoUs, pilots without revenue, or vague "pipeline" numbers invites skepticism.

2. **Regulatory uncertainty** — Markets like Reduktionsplikt credits and RED III are brand new. CPOs question whether the revenue will actually materialize and persist. Will regulations change? Will credit prices hold?

3. **Technical risk** — Will smart charging / flexibility participation reduce charger availability or driver satisfaction? Any downtime = direct revenue loss from their core business.

4. **Market price volatility** — FCR and mFRR prices fluctuate significantly. Promising "X EUR per charger per year" feels unreliable when the underlying market swings.

5. **Aggregation complexity** — CPOs question whether a startup can actually aggregate their diverse hardware, software, and grid connections into a functioning flexibility asset.

6. **Revenue magnitude skepticism** — If the additional revenue is only a few hundred EUR per charger per year, is it worth the integration effort and operational risk?

7. **Counterparty risk** — A startup might not survive long enough to deliver on multi-year revenue commitments. CPOs have seen EV charging companies go bankrupt.

8. **Lack of peer validation** — CPOs want to hear from other CPOs who have successfully earned this revenue, not from the startup selling the solution.

### What Builds Trust

- **Named reference customers** with verifiable results
- **Transparent methodology** — show how revenue is calculated, what market prices were used, what assumptions were made
- **Risk-sharing structures** — revenue share models where the startup only earns if the CPO earns
- **Pilot programs** — low-commitment trials that let CPOs see real results before scaling
- **Industry credentials** — partnerships with TSOs, energy companies, or established players (like Jedlix being acquired by Kraken/Octopus)
- **Regulatory expertise** — demonstrating deep understanding of the policy landscape builds confidence
- **Conservative projections** — deliberately understating potential revenue and then overdelivering

---

## Key Implications for Tether's Lead-Magnet Strategy

### The Opportunity Space

Tether sits at the intersection of three emerging, complex, and poorly-understood revenue streams for CPOs:
1. **Grid flexibility markets** (FCR, mFRR) — technically complex, requires aggregation
2. **E-credits / carbon credits** (Reduktionsplikt, RED III) — regulatory complex, requires navigation
3. **Energy optimization** (smart charging, load shifting) — operationally complex, requires integration

### CPO Emotional State

- **Anxiety:** Low utilization, long payback periods, competitive pressure
- **Skepticism:** Burned by hype, wary of startup promises
- **Curiosity:** Know they need new revenue streams, unsure which ones are real
- **Overwhelm:** Too many acronyms, regulations, and market mechanisms to track
- **FOMO:** Fear of missing out if competitors unlock these revenues first

### What a Lead Magnet Must Do

1. **Educate** without selling — CPOs don't understand these markets well enough to evaluate opportunities
2. **Quantify** with transparency — show real market data, not hypothetical projections
3. **De-risk** the decision — make it feel safe to explore, not committing to anything
4. **Demonstrate expertise** — prove Tether understands these markets better than the CPO does
5. **Create urgency** without hype — regulatory deadlines and market timing are real
6. **Personalize** to the CPO's specific situation — generic projections won't convince anyone

### Data Points That Would Be Powerful in a Lead Magnet

- FCR-N averaged 37.4 EUR/MW in Sweden (April 2025)
- mFRR prices hit EUR 2,000/MWh in Swedish bidding zones after EAM launch
- Reduktionsplikt electricity credits valued at 0.27 SEK per publicly charged kWh
- CPO utilization rates averaging ~8% on many networks
- EUR 4 billion annual savings potential from EV flexibility (Eurelectric/EY)
- Revenue stacking (day-ahead + FCR) yields 76% higher profit
- RED III credit mechanism mandated across all 27 EU member states
- V2G becoming commercial standard in 2026

---

## Sources

- [Nordic Balancing Model — mFRR EAM](https://nordicbalancingmodel.net/roadmap-and-projects/automated-nordic-mfrr-energy-activation-market/)
- [Sourceful Energy — FCR Prices in Sweden April 2025](https://sourceful.energy/blog/april-2025-market-update-frequency-control-reserve-(fcr)-prices-in-sweden)
- [Svenska kraftnat — FCR Technical Requirements](https://www.svk.se/en/about-us/news/news/updated-version-of-the-technical-requirements-for-fcr-is-now-available/)
- [ArXiv — Nordic 15-min mFRR EV Aggregation Study](https://arxiv.org/html/2511.19715)
- [Swedish Energy Agency — Greenhouse Gas Reduction Mandate](https://www.energimyndigheten.se/en/climate/sustainable-fuels/greenhouse-gas-reduction-mandate/)
- [ChargeUp Europe — RED Credit Mechanism](https://www.chargeupeurope.eu/red)
- [Transport & Environment — RED III and Renewable Electricity](https://www.transportenvironment.org/articles/red-iii-and-renewable-electricity)
- [EY/Eurelectric — Plugging into Potential (2025)](https://evision.eurelectric.org/report-2025/)
- [gridX — European EV Charging Report 2025](https://www.gridx.ai/resources/european-ev-charging-report-2025)
- [Rabobank — From Niche to Norm: Europe's EV Charging 2025](https://www.rabobank.com/knowledge/d011497508-from-niche-to-norm-europes-ev-charging-infrastructure-in-2025)
- [AMPECO — EV Charging Flexibility Assets](https://www.ampeco.com/blog/transform-your-network-into-revenue-generating-flexibility-assets/)
- [Jedlix / Kraken Technologies](https://www.jedlix.com/)
- [Strategy& (PwC) — EV Charging Market Outlook 2025](https://www.strategyand.pwc.com/n1/en/ev-charging-market-outlook-2025.html)
- [FFD Power — BESS for FCR in Sweden](https://ffdpower.com/bess-for-fcr-in-sweden/)
- [Fluence — Powering the Nordic Market](https://blog.fluenceenergy.com/powering-nordic-market-battery-based-energy-storage)
- [Electric Avenue — CPO Profitability](https://www.readelectricavenue.com/p/charge-point-operator-profitability)
- [Stuart Energy — CPO Utilization Statistics](https://www.stuart.energy/news/unveiling-misleading-interpretation-of-statistics-in-the-charge-point-operator-cpo-business-understanding-the-complexities-of-usage-percentage-and-its-impact-on-sales)
- [Driivz — 2026 EV Charging Industry Predictions](https://driivz.com/blog/2026-ev-charging-industry-predictions-and-trends/)
