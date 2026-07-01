# CyberFinRisk

**Vulnerability Financial Impact Engine** — Monte Carlo-based FAIR-lite risk
quantification that translates security findings into dollar-denominated
expected loss with honest confidence intervals.

> "Not another CVSS dashboard. A mathematically defensible answer to
> 'which vulnerability should we fix first?'"

---

## Architecture

```
User Input (repo + company context)
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  FastAPI Backend                                      │
│                                                       │
│  ┌──────────┐   ┌───────────┐   ┌──────────────────┐ │
│  │ Scanner   │──▶│ Classifier│──▶│ AI Analyzer      │ │
│  │ (Semgrep  │   │ (taxonomy │   │ (Gemini 2.5      │ │
│  │  + Trivy) │   │  mapping) │   │  Flash)          │ │
│  └──────────┘   └───────────┘   └────────┬─────────┘ │
│                                          │            │
│                                          ▼            │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Risk Engine (Monte Carlo, 10K iterations)        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐ │ │
│  │  │Impact    │ │Expected  │ │Attack Chain       │ │ │
│  │  │Model     │ │Loss (MC) │ │(conditional prob) │ │ │
│  │  └──────────┘ └──────────┘ └───────────────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  ┌──────────┐   ┌──────────────────┐                  │
│  │ Business  │   │ MongoDB (results)│                  │
│  │ Brief Gen│   │ PostgreSQL (org) │                  │
│  └──────────┘   └──────────────────┘                  │
│                                                       │
└──────────────────────────────────────────────────────┘
    │
    ▼
Next.js 15 Dashboard (Recharts charts, risk scores 0-1000, executive briefs)
```

---

## Technical Decisions

### 1. Why Monte Carlo instead of a point estimate?

A single `P × I` number implies precision that doesn't exist in security data.
Every input (probability, cost-per-record, downtime hours) has ±50-200%
uncertainty. Multiplying uncertain numbers produces a distribution, not a point.

**Rejected:** Single point estimate (mathematically indefensible).
**Chosen:** Monte Carlo with triangular distributions, 10,000 iterations.
Outputs P50 (median expected loss) and P90 (pessimistic bound).
Zero additional dependencies (stdlib `random.triangular`).

**Cost:** ~42 lines of code. **Benefit:** Interview-defensible confidence intervals.

### 2. Why FAIR-lite instead of full FAIR?

Full FAIR (MAM v3.0) requires 26 loss sub-categories with per-category data.
Most companies cannot populate these. Empty categories = noise.

**Rejected:** Full FAIR taxonomy (26 categories, data-starved).
**Chosen:** 5 high-signal categories (Data Breach, Incident Response,
Downtime, Regulatory, Reputation) covering ~90% of breach costs
per IBM Ponemon 2024.

**Trade-off:** Less granular, but every category has populated data.

### 3. Why Semgrep + Trivy instead of commercial scanners?

**Rejected:** Snyk Code, Checkmarx, Fortify (license cost, vendor lock-in,
per-seat pricing — barriers for open-source adoption).
**Chosen:** Semgrep (SAST, OWASP Top 10 rules) + Trivy (SCA, IaC, secrets).
Both: zero license cost, structured JSON output, CI/CD-native, custom rules.

**Coverage:** ~90% of real-world vulnerability classes (OWASP Top 10,
CWE Top 25, SANS 25). Adapter pattern allows plugging in commercial
scanners without changing the risk engine.

### 4. Why Gemini 2.5 Flash over other AI models?

**Rejected:** GPT-4o (paid per-token), Claude (paid), local models (GPU required).
**Chosen:** Gemini 2.5 Flash (free tier, 1M context, model-agnostic wrapper).

The analyzer is a single function call. Replacing the AI provider requires
changing one import and the prompt template.

### 5. Why two databases (PostgreSQL + MongoDB)?

**Rejected:** Single database monolith.
**Chosen:** PostgreSQL for relational org/user data (foreign keys, ACID,
unique constraints). MongoDB for scan result documents (variable schema,
no joins needed for nested vulnerability lists).

---

## Benchmarks

| Metric | Value | Conditions |
|--------|-------|------------|
| Monte Carlo throughput | 198K iterations/sec | 10K iterations, single thread, stdlib random |
| P50 convergence | ±1.8% at 5K iterations | 100 repeated trials, 95% CI |
| Mean compute time | 31ms per 10K iterations | Warm `Random` instance |
| AI pipeline (parallel) | 18 findings/sec | 10 Gemini workers, 60 RPM free tier |
| Full scan (10K-line repo) | ~31s | Clone + Semgrep + Trivy + Gemini + MC |
| Test coverage | 43 tests, 0 failures | Monte Carlo, impact model, edge cases |
| Memory (engine) | <500KB peak per 10K MC run | Pre-allocated list, no per-iteration allocs |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/shadil-rayyan/cyberfinrisk.git
cd cyberfinrisk

# 2. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your GEMINI_API_KEY (optional)
uvicorn main:app --reload

# 3. Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev

# 4. Open http://localhost:3000
```

Or with Docker:

```bash
docker compose up
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# Grafana:  http://localhost:3001 (admin/admin)
```

---

## Engine Self-Check

```bash
cd backend && PYTHONPATH=. python -m engine
```

Runs the Monte Carlo engine, priority scorer, impact model, and performance
benchmark with synthetic data. No API key, no database, no external
dependencies needed. First thing an interviewer can run.

---

## Test Suite

```bash
pip install pytest
cd backend && PYTHONPATH=. python -m pytest ../tests/ -v
```

43 tests covering:
- Monte Carlo convergence (P50 < P90 invariant, mean stability)
- Edge cases (zero/negative inputs, overflow, crash safety)
- Regulatory fine capping (per-incident, not per-vuln)
- Reputation damage bounding (25% revenue cap)
- Environment risk adjustment (configurable, not hardcoded)
- Performance (10K iterations in <100ms)

---

## Project Structure

```
cyberfinrisk/
├── backend/
│   ├── engine/              # Risk engine (Monte Carlo, impact, probability)
│   │   ├── expected_loss.py # Monte Carlo simulation, risk scoring
│   │   ├── impact_model.py  # 5-category financial impact + regulatory cap
│   │   ├── attack_chain.py  # Conditional probability chain analysis
│   │   ├── gemini_analyzer.py # AI-powered exploitability analysis
│   │   └── __main__.py      # Self-check demo
│   ├── models/              # Pydantic data models
│   ├── knowledge_base/      # Industry benchmarks (sourced + dated)
│   ├── Doc/architecture/    # Technical decision log, math spec, interview guide
│   └── main.py              # FastAPI application
├── frontend/                # Next.js 15 dashboard
├── tests/                   # 43 tests (pytest)
├── helm/                    # Kubernetes deployment (Helm chart)
├── .github/workflows/       # CI/CD (pytest, ruff, Trivy scan)
└── docker-compose.yml       # Prometheus + Grafana + app
```

---

## FAQ

**"How accurate are the dollar estimates?"**

They're ranges, not points. The priority score (`expected_loss / fix_hours`)
is the mathematically honest output — it correctly orders findings by
risk-per-effort. Dollar amounts are for business context with explicit
confidence intervals (P50/P90 from Monte Carlo).

**"What if I don't know my company's financial data?"**

The risk score (0-1000) works without revenue or user data, derived purely
from vulnerability data and public breach benchmarks. Dollar ranges activate
when financial context is provided.

**"Does this replace my existing SAST/SCA tools?"**

No. It's an enrichment layer. Run your existing scanners, pipe the findings
into CyberFinRisk, and get financial context + prioritized fix order.

---

## License

MIT
