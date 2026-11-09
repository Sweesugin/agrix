# AgriX: A Gamified Platform to Promote Sustainable Farming Practices

**AgriX** is a full-stack, research-oriented digital platform designed to accelerate the adoption of sustainable farming practices among smallholder farmers. By combining a transparent multi-factor recommendation engine, grounded AI agronomic assistance, and a structured gamification reward ledger, AgriX transforms complex sustainable agriculture protocols into engaging, trackable farm achievements.

---

## 1. System Architecture & Research Overview

AgriX addresses the critical gap between agricultural advisory science and on-field execution. Instead of passive brochures, AgriX employs:

1. **Multi-Factor Recommendation Engine**: Deterministic Normalized Additive Weighting (NAW) model evaluating 7 agronomic factors with configurable weights.
2. **Grounded AI Explanation (`Explain with AgriX AI`)**: Context-aware practice breakdown powered by Google Gemini and verified agronomic protocols (ICAR, TNAU, CRIDA, NRRI).
3. **Gamified Challenge State Machine**: Enforced progression (`not_started` &rarr; `in_progress` &rarr; `submitted` &rarr; `verified`) with a deduplicated tamper-evident `RewardTransaction` ledger.
4. **Empirical Evaluation Pipeline**: Built-in comparative benchmarking framework (`/api/evaluation/recommendations/compare`) contrasting Multi-Factor NAW against baseline heuristics.

```
+-------------------------------------------------------------------------+
|                              Farmer Profile                             |
|        (Crop, Soil Texture, Method, Acreage, Experience, Region)        |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  7-Factor Normalized Weighting Engine                   |
|  Crop (25%) + Soil (20%) + Season (15%) + Location (15%) + Method (10%) |
|                     + Experience (10%) + Size (5%)                      |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                 Top-K Sustainable Practice Guidance                     |
|           ("Explain with AgriX AI" Structured ICAR Guidance)            |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                     Gamified Challenge State Machine                    |
|    not_started  --->  in_progress  --->  submitted  --->  verified     |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Deduplicated Reward Transaction Ledger                 |
|       (Monthly Leaderboards, Streak Milestones, Badges Unlocked)       |
+-------------------------------------------------------------------------+
```

---

## 2. Multi-Factor Recommendation Formulation

The recommendation score $S_j$ for each practice $P_j$ is computed as a normalized weighted sum of 7 factor compatibility functions $C_i(P_j, U)$:

$$S_j = \sum_{i=1}^{7} w_i \times C_i(P_j, U)$$

Subject to $\sum_{i=1}^{7} w_i = 1.0$ and $C_i \in [0, 100]$.

### Proposed Factor Weights ($w_i$)
1. **Crop compatibility ($w_1 = 0.25$)**: Direct agronomic synergy between target cash/food crop and practice.
2. **Soil compatibility ($w_2 = 0.20$)**: Physical texture, hydraulic retention, and cation exchange dynamics.
3. **Seasonal suitability ($w_3 = 0.15$)**: Alignment with active Kharif, Rabi, or Zaid cropping calendars.
4. **Location & Agro-climatic suitability ($w_4 = 0.15$)**: Regional precipitation and agro-ecological zones.
5. **Farming method compatibility ($w_5 = 0.10$)**: Synergy with Organic, Natural, Mixed, or Conventional management.
6. **Farmer experience level ($w_6 = 0.10$)**: Adoption curve and technical difficulty (Easy, Medium, Advanced).
7. **Farm size suitability ($w_7 = 0.05$)**: Scale appropriateness (marginal, smallholder, medium, or large acreage).

### Safety & Incompatibility Constraints
Certain practices enforce strict agro-ecological constraints. For example, Alternate Wetting and Drying (AWD) is incompatible with coarse sandy soils due to excessive percolation rates ($C_{soil} = 0$, safety override triggered).

---

## 3. Verified Practices & Agronomic Grounding

All 15 cataloged practices in AgriX are cross-referenced with established agricultural research institutes:

| ID | Sustainable Practice Title | Category | Primary Research Citation |
|---|---|---|---|
| `prac_1` | Alternate Wetting & Drying (AWD) | Water Conservation | ICAR-NRRI & IRRI Technical Bulletin |
| `prac_2` | Precision Drip Irrigation Setup | Water Conservation | NCPAH & TNAU Micro-Irrigation Protocols |
| `prac_3` | Organic Mulching Application | Soil Health | ICAR-CRIDA In-situ Moisture Conservation |
| `prac_4` | Neem-Based Botanical Pest Spray | Pest Management | ICAR-NCIPM Botanical Formulations Guide |
| `prac_5` | Farm-Scale Vermicomposting Bed | Organic Farming | ICAR-IISS Vermitechnology Handbook |
| `prac_6` | Leguminous Green Manuring | Soil Health | ICAR-CSSRI & TNAU Agronomy Compendium |
| `prac_7` | Yellow & Blue Sticky Traps | Pest Management | ICAR-IIHR Eco-Friendly IPM Protocols |
| `prac_8` | Intercropping with Short-Duration Pulses | Biodiversity | ICAR-IIPR Intercropping Systems Guideline |
| `prac_9` | Panchagavya Biostimulant Preparation | Organic Farming | TNAU Organic Agriculture Compendium |
| `prac_10` | Rainwater Bunding & In-Field Trenching | Water Conservation | ICAR-IISWC Watershed Engineering Bulletin |
| `prac_11` | Biological Seed Treatment (Trichoderma) | Soil Health | ICAR-DSR & NBAIM Bio-inoculant Protocols |
| `prac_12` | Solar Photovoltaic Pumping Integration | Energy Efficiency | PM-KUSUM Technical Standard & ICAR-CIAE |
| `prac_13` | Crop Residue In-Situ Shredding | Waste Reduction | ICAR-IARI In-situ CRM Protocols |
| `prac_14` | Biochar Application & Charcoal Charging | Soil Health | ICAR-CRIDA Biochar Systems Bulletin |
| `prac_15` | Floral Border Strips for Pollinators | Biodiversity | ICAR-NBAIR Ecological Engineering Guide |

---

## 4. Gamification & Tamper-Evident Reward Ledger

- **State Machine**: Transitions require affirmative action steps. Submitting field proof marks status as `submitted` for extension officer verification.
- **Deduplicated Transaction Ledger**: Every awarded point is recorded with a unique transaction ID (`tx_...`), timestamp, beneficiary user ID, challenge ID, and verifying authority. Duplicate attempts on the same challenge are automatically rejected.
- **Dynamic Monthly Leaderboards**: Monthly rankings are dynamically aggregated from dated ledger records (`timestamp >= startOfMonth`), ensuring 100% authentic ranking.

---

## 5. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express.js (REST API).
- **AI Integration**: Google Gemini API (`@google/genai`) with fallback agronomic rule engine.
- **Data Store**: File-backed JSON store (`server/data/agrix_store.json`) with auto-persistence.
- **Testing**: Node.js native test runner (`tsx --test test/**/*.test.ts`).

---

## 6. Research Evaluation Endpoints

- `GET /api/evaluation/recommendations/compare`: Runs comparative benchmark between Baseline and 7-Factor NAW engines. Computes Jaccard index, rank displacement, and score variance.
- `GET /api/evaluation/metrics`: Returns platform-wide empirical telemetry (total farmers, transaction count, category distributions, audit logs).

---

## 7. Setup & Execution

### Prerequisites
Node.js v20+ and npm.

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/your-username/agrix.git
cd agrix

# Install dependencies
npm install

# Run automated tests
npm test

# Run development server (Vite + Express on port 3000)
npm run dev
```

---

## 8. Research Prototype Disclaimer

*AgriX is developed as an interactive research prototype and design demonstration for sustainable agriculture adoption. It does not fabricate experimental crop yield statistics or replace qualified local agronomic consultation.*
