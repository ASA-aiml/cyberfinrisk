# Architecture Decisions

Every non-trivial choice in this project has a rejected alternative. Documenting
these is the highest-signal activity for FAANG interviews — it proves you evaluate
trade-offs rather than defaulting to familiar tools.

---

## Decision 1: FAIR-lite vs. Full FAIR Taxonomy

**Chosen:** FAIR-lite (5 loss categories)

**Rejected:** Full FAIR MAM (26 sub-categories, FAIR-MAM v3.0)

**Reasoning:**
Full FAIR's 26-category loss taxonomy (Primary Loss: 8 productivity sub-types,
7 response sub-types, 11 replacement sub-types; Secondary Loss: fine sub-types
for each of 5 stakeholder groups) requires per-category data that most companies
do not have. For a self-service tool, 26 empty categories degrade UX without
improving accuracy — every unfilled category is a missing data point that adds
noise.

The 5 categories (Data Breach, Regulatory, Incident Response, Downtime,
Reputation) cover ~90% of breach costs per IBM's Cost of Data Breach Report 2024
and Verizon DBIR 2024. Adding sub-categories is justified only when a customer
has the data to populate them.

**Trade-off accepted:** Granularity for usability. The model errs on the side of
simplicity because simple + populated beats complex + empty.

---

## Decision 2: Monte Carlo Point Estimate vs. Full Distribution

**Chosen:** Hybrid — Monte Carlo with triangular/PERT distributions,
10,000 iterations, output P10/P50/P90 + mean

**Rejected:** Single point estimate (`P × I`), or full stochastic model
with 100K+ iterations and Bayesian updating

**Reasoning:**
A single point estimate is mathematically indefensible — it implies precision
that does not exist in security data. Every input (probability, cost per record,
downtime hours) is an estimate with ±50-200% uncertainty. Multiplying uncertain
numbers produces a wide range, not a point.

Full stochastic models (PyMC, pgmpy) add calibration complexity (convergence
diagnostics, effective sample size, R-hat statistics) that requires a data
scientist to operate. For a self-service tool, the model must produce defensible
outputs without requiring a PhD to validate.

Monte Carlo with triangular distributions and 10K iterations gives stable P50/P90
estimates (verified by convergence tests) using only stdlib Python. This is the
minimum complexity that produces honest confidence intervals.

**Trade-off accepted:** More sophisticated Bayesian approaches would narrow
confidence intervals with the same data, but add operational complexity that
reduces adoption.

---

## Decision 3: Semgrep + Trivy vs. Commercial Scanners

**Chosen:** Open-source scanners (Semgrep for SAST, Trivy for SCA + IaC)

**Rejected:** Snyk Code, Checkmarx, Fortify, SonarQube

**Reasoning:**
Semgrep and Trivy cover ~90% of real-world vulnerability classes (OWASP Top 10,
CWE Top 25, SANS 25) at zero licensing cost. They produce structured JSON output,
support custom rules, and run in CI/CD pipelines with no external dependencies.

Commercial scanners add incremental value for niche categories (business logic
flaws, advanced taint analysis) but require license procurement, per-seat pricing,
and vendor relationship management. For an open-source tool, every commercial
dependency is an adoption barrier.

**Trade-off accepted:** Missed findings from commercial-only rules. Mitigated by
extensible design — new scanners can be added as adapter modules.

---

## Decision 4: Gemini 2.5 Flash vs. Other AI Models

**Chosen:** Google Gemini 2.5 Flash (free tier, 1M token context)

**Rejected:** GPT-4o (paid per-token), Claude 3.5 Sonnet (paid), local LLMs
(Llama 3, Mistral)

**Reasoning:**
Gemini 2.5 Flash offers the best accuracy/cost trade-off for code analysis.
It has a generous free tier, 1M token context (handles large code windows),
and strong code understanding capabilities (HumanEval score >90%).

Local LLMs (Llama 3 70B, Mistral 8x22B) require GPU infrastructure that most
users do not have. While privacy-preserving, the setup friction eliminates
the target audience.

The analyzer is model-agnostic. A single function call wraps the Gemini API;
replacing it with GPT-4o, Claude, or a local model requires changing one import
and the prompt template.

**Trade-off accepted:** Vendor dependency on Google API. Mitigated by
model-agnostic design and the option to disable AI analysis entirely
(fallback to knowledge-base probabilities).

---

## Decision 5: Two Databases (PostgreSQL + MongoDB)

**Chosen:** PostgreSQL for relational data (users, orgs, groups, memberships),
MongoDB for scan results (variable schema documents)

**Rejected:** Single database (all in PG, all in Mongo), or SQLite

**Reasoning:**
Scan results have variable schema — different scanners produce different fields,
and the result document grows as features are added (attack chains, AI analysis,
business briefs). MongoDB's document model handles this naturally without
migrations.

Organizational data (users, orgs, groups, invitations, notifications) has rigid
relational constraints (unique emails, referential integrity, cascading deletes).
PostgreSQL handles this natively with foreign keys, unique constraints, and ACID
transactions.

SQLite would work for single-user deployments but cannot scale to multi-tenant
usage. A single PG database with JSONB columns for scan results would also work
but makes querying nested fields painful compared to Mongo's native dot-notation.

**Trade-off accepted:** Operational complexity of two databases. Mitigated by
Docker Compose — both databases start with `docker compose up`.

---

## Decision 6: FastAPI vs. Django/Flask

**Chosen:** FastAPI

**Rejected:** Django REST Framework, Flask

**Reasoning:**
FastAPI provides async request handling, Pydantic validation (identical to our
data models), automatic OpenAPI docs, and excellent performance. The async
scan pipeline (clone + scan + analyze + aggregate) benefits from async concurrency
without the complexity of Celery or Redis queues.

Django would have been familiar but adds ORM opinion, admin panel, and app
structure that our non-relational scan data does not fit. Flask is minimalist
and would require Pydantic integration (already needed for models) as an add-on.

**Trade-off accepted:** FastAPI ecosystem is smaller than Django. Mitigated by
the fact that all backend logic is in `engine/` — replacing the framework
requires rewriting only the API layer.

---

## Decision 7: ThreadPoolExecutor vs. AsyncIO for AI Calls

**Chosen:** `concurrent.futures.ThreadPoolExecutor` (max 10 workers)

**Rejected:** `asyncio` + `aiohttp`, sequential processing

**Reasoning:**
Gemini API calls are I/O-bound (network latency), not CPU-bound. ThreadPoolExecutor
with 10 workers runs ~10 concurrent Gemini API calls, limited by API rate limits
(60 requests/minute on free tier). Going higher would hit rate limits, not CPU.

`asyncio` would be slightly more efficient for pure I/O but adds complexity — the
Gemini SDK is synchronous, so `asyncio` would require `run_in_executor` anyway,
which just wraps ThreadPoolExecutor. Sequential processing (no parallelism) would
make scan time scale linearly: N findings × ~3s per Gemini call.

**Trade-off accepted:** Fixed 10-worker pool without dynamic scaling. 10 is the
sweet spot for free-tier Gemini rate limits; paid tiers could increase this.

---

## Decision 8: Priority Score = Expected Loss / Fix Effort Hours

**Chosen:** This formula as the primary sort key

**Rejected:** CVSS score, expected loss alone, fix effort alone, arbitrary weighted formula

**Reasoning:**
A vulnerability with $100K expected loss that takes 1 hour to fix should be
higher priority than one with $200K expected loss that takes 100 hours. The
ratio answers "dollar of risk reduced per dollar of fix cost" — which is exactly
what a business leader needs to decide sprint priorities.

CVSS score does not incorporate financial context. Expected loss alone ignores
remediation cost. Fix effort alone ignores risk. Weighted formulas (e.g.,
`0.4 × severity + 0.3 × impact + 0.3 × effort`) introduce arbitrary weights
that cannot be justified mathematically.

**Trade-off accepted:** The formula assumes linear utility — fixing a $10K-risk
vulnerability for $1 is always better than a $100K-risk vulnerability for $20.
In practice, risk appetite policies may override (e.g., "fix all criticals
regardless of ROI").

---

## Decision 9: Risk Score (0-1000) in Addition to Dollar Amounts

**Chosen:** Both — normalized risk score for dashboards, dollar ranges for business briefs

**Rejected:** Either one alone

**Reasoning:**
Dollar amounts require the user to provide revenue, user count, ARPU, etc.
These are sensitive data that some users will not enter. The risk score
provides a useful output even without financial context, derived purely from
vulnerability data + public breach cost benchmarks.

When financial data IS provided, the dollar ranges activate in business briefs
and executive summaries. This allows two user personas:
- **Technical users:** Risk score, fix priority, vulnerability details
- **Business users:** Dollar expected loss, ROI of fixing, board-ready briefs

**Trade-off accepted:** Maintaining two parallel output formats increases
testing surface. Mitigated by shared underlying computation — risk score is
just a normalized view of the same expected loss.
