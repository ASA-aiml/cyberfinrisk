# Why CyberFinRisk Exists

## The Problem

Security teams produce vulnerability scan results — lists of CVEs, misconfigurations,
and code flaws. Business leaders (CEOs, CFOs, board members) cannot act on raw
vulnerability data. They need to know:

1. **"How much money is at stake?"**
2. **"Which fix gives the best ROI?"**
3. **"Should we fix this now or defer it?"**

Existing tools (Snyk, DefectDojo, Tenable) rank by CVSS score — a technical severity
metric that does not translate to financial impact. CVSS 9.0 in a non-critical
internal service causes the same alert as CVSS 9.0 in a production payment API.

## The Gap

| Need | Existing Tools | CyberFinRisk |
|------|---------------|--------------|
| Dollar-denominated risk | No | Yes (with confidence ranges) |
| Business context (revenue, users, data) | Manual tagging per finding | Company profile applied to all findings |
| AI-powered false-positive reduction | Limited (Snyk Code) | Gemini code-context analysis per finding |
| ROI of remediation | Not calculated | Expected loss / fix cost |
| Attack chain amplification | Not modeled | Gemini-identified multi-step chains |

## The Approach

CyberFinRisk applies **Factor Analysis of Information Risk (FAIR)** methodology
to translate technical vulnerabilities into financial terms. FAIR decomposes risk into:

```
Risk = Loss Event Frequency × Loss Magnitude
     = (Probability of Exploit) × (Financial Impact)
```

We extend this with:

1. **Monte Carlo simulation** — replaces point estimates with probability
   distributions, producing P50/P90 confidence ranges instead of false-precision
   single numbers.

2. **AI-contextualized exploitability** — Gemini analyzes actual code context
   (40 lines around each finding) to adjust baseline probabilities. A SQL injection
   behind authentication gets lower probability than one on a public endpoint.

3. **Attack chain detection** — Multiple vulnerabilities in sequence (e.g.,
   Path Traversal → Credential Theft → RCE) can cause greater damage than
   any single finding. Gemini identifies these chains and the financial model
   applies conditional probability amplification.

4. **Remediation ROI** — Priority = Expected Loss / Fix Effort Hours. This
   directly answers "which vulnerability should we fix first?" in business terms.

## What This Is NOT

- **Not a compliance tool** — It does not prove PCI-DSS, SOC2, or HIPAA compliance.
- **Not a replacement for CVSS** — CVSS measures technical severity. FinRisk
  measures business risk. They complement each other.
- **Not a financial audit** — The dollar figures are estimates for prioritization,
  not accounting-grade numbers. Monte Carlo confidence ranges communicate this
  honestly.
- **Not real-time threat detection** — It analyzes code at rest, not running
  infrastructure.

## What Makes This FAANG-Relevant

| Signal | How This Project Demonstrates It |
|--------|--------------------------------|
| **Probabilistic thinking** | Monte Carlo simulation, PERT distributions, confidence intervals |
| **System design** | Multi-stage pipeline (scanner → classifier → AI → risk engine → aggregator) |
| **Trade-off reasoning** | FAIR-lite vs full FAIR, Semgrep vs commercial, Gemini vs local models |
| **Testing discipline** | Property-based tests, convergence checks, edge case coverage |
| **Production readiness** | Docker Compose, CI/CD, Prometheus monitoring, Helm chart |
| **Code quality** | Ruff linting, type hints, pre-commit hooks, clean architecture |
