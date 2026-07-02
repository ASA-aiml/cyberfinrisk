# Financial Model: Mathematics

This document is the complete mathematical specification of the risk engine.
Every formula, its source, and its limitations are documented here.

---

## 1. Core Identity

```
Expected Loss = Probability × Impact
```

This is the standard FAIR identity. CyberFinRisk extends it with Monte Carlo
simulation to produce confidence intervals.

---

## 2. Probability Estimation

### 2.1 For CVE-Identified Vulnerabilities (Trivy SCA)

```
P_exploit = min(EPSS_score, 0.95)
```

Source: [FIRST.org EPSS API](https://www.first.org/epss)

EPSS (Exploit Prediction Scoring System) estimates the probability that a CVE
will be exploited in the wild within the next 30 days. Scores range 0-1,
representing the percentile of likelihood among all CVEs.

**Limitation:** EPSS is a 30-day probability, not a lifetime probability.
Using it as `P` in `P × Impact` implicitly assumes the vulnerability remains
unfixed for the entire risk horizon. For long-lived vulnerabilities (e.g.,
never-fixed legacy systems), this underestimates risk. For short-lived ones
(fixed within 30 days), it overestimates.

### 2.2 For Custom Code Vulnerabilities (Semgrep)

```
P_exploit = base_rate[bug_type][exposure]
```

| Bug Type | PUBLIC | INTERNAL | PRIVATE |
|----------|--------|----------|---------|
| SQL_INJECTION | 0.22 | 0.06 | 0.01 |
| XSS | 0.18 | 0.05 | 0.01 |
| AUTH_BYPASS | 0.15 | 0.05 | 0.02 |
| RCE | 0.10 | 0.03 | 0.01 |
| HARDCODED_CREDENTIALS | 0.25 | 0.10 | 0.03 |
| ... (full table in `knowledge_base/exploit_probability.json`) |

Source: Verizon Data Breach Investigations Report (DBIR) 2024, MITRE CWE
data, NVD exploitability scores.

**Limitation:** Base rates are static and do not account for:
- Attacker motivation targeting a specific company
- Current exploit availability (weaponized vs. theoretical)
- Geographic threat landscape (nation-state vs. opportunistic)

### 2.3 AI-Adjusted Probability

When Gemini analysis is enabled, the baseline probability is adjusted:

```
P_effective = Gemini.adjusted_probability
```

Gemini receives: code context (40 lines), bug type, file path criticality,
company context, asset context, and baseline probability. It outputs an
adjusted probability (0.01-0.95) based on:

- Is the code in a test/dead path? → lower probability
- Is input user-controlled? → higher probability
- Is authentication required? → lower probability
- Does the code have sanitization? → lower probability

**Limitation:** Gemini adjustment is a black box. We cannot audit the
reasoning chain. Mitigated by requiring Gemini to output
`exploitability_reasoning` as audit trail.

---

## 3. Impact Calculation

### 3.1 Data Breach Cost

```
if bug_type allows data_exfiltration:
    records_exposed = estimated_records_stored × scope_multiplier
    data_breach_cost = records_exposed × cost_per_record[industry]
```

`scope_multiplier` comes from Gemini's data_scope analysis:

| data_scope | multiplier |
|------------|-----------|
| full_database | 1.0 |
| single_user_record | 0.0001 |
| none | 0.0 |
| default (no Gemini) | 0.20 |

Cost per record by industry (IBM Cost of Data Breach 2024):

| Industry | Cost/Record |
|----------|-------------|
| Healthcare | $400 |
| Finance | $250 |
| Technology | $150 |
| Retail | $130 |
| Education | $100 |
| Default | $165 |

### 3.2 Incident Response Cost

```
incident_cost = incident_response_cost[company_size]
```

| Company Size | Cost |
|-------------|------|
| Startup | $30,000 |
| Mid-size | $100,000 |
| Enterprise | $500,000 |

Source: IBM Cost of Data Breach 2024, Ponemon Institute.

### 3.3 Downtime Cost

```
downtime = downtime_hours[bug_type] × cost_per_hour[company_size]
```

Estimated downtime hours by bug type:

| Bug Type | Hours |
|----------|-------|
| RCE | 8 |
| AUTH_BYPASS | 6 |
| COMMAND_INJECTION | 6 |
| SQL_INJECTION | 4 |
| XSS | 1 |
| ... | (full table in `knowledge_base/downtime_estimates.json`) |

Source: Industry incident response averages, SANS Incident Response survey 2023.

### 3.4 Regulatory Penalties

Regulatory penalties are computed **once per scan**, not per vulnerability.
This avoids the "100 findings = 100× GDPR max fine" inflation.

```
regulatory_total = sum of applicable fines

If GDPR applies:
    regulatory_total += min(revenue × 0.04, $20,000,000)
If PCI_DSS applies:
    regulatory_total += $250,000
If HIPAA applies:
    regulatory_total += $1,900,000
```

Source:
- GDPR: Article 83(5) — 4% of annual global turnover or €20M, whichever is greater
- PCI DSS: Average fine $250,000 (PCI Security Standards Council)
- HIPAA: Maximum annual penalty $1,900,000 (HHS 2024 adjustment)

The per-vulnerability impact model includes ONLY the regulatory penalty
divided proportionally across all findings for relative comparison. The
total regulatory exposure is reported at the project level.

### 3.5 Reputation Damage (Churn)

```
reputation = min(
    active_users × churn_rate × arpu × 12,
    annual_revenue × 0.25    # cap at 25% of revenue
)
```

Churn rate by data sensitivity:

| Sensitivity | Churn Rate |
|-------------|-----------|
| High (FINANCIAL, HEALTH) | 10% |
| Medium (PII) | 5% |
| Low | 2% |

Source: Ponemon Institute, "The Cost of Customer Churn After a Data Breach" (2023).

**The 25% revenue cap** is based on the largest observed revenue impact
from a data breach in the last 10 years (Target 2013: 24.5% revenue drop,
Equifax 2017: 26.1%, Capital One 2019: 16.7%).

### 3.6 Environment Risk Adjustment

```
if environment == "dev":
    risk_adjustment = 0.01    # 1% residual risk (pivot to prod)
elif environment == "staging":
    risk_adjustment = 0.10    # 10% risk (may contain scrubbed prod data)
else:
    risk_adjustment = 1.0     # prod
```

This is **configurable** via `AssetContext.risk_adjustment`. The defaults
assume standard isolation practices. A company with fully isolated dev
environments should set this to 0.0; a company whose dev environment
shares a network with prod should set it higher.

---

## 4. Monte Carlo Integration

### 4.1 Purpose

Replace the point estimate `EL = P × I` with a distribution of outcomes,
given that both P and I are uncertain.

### 4.2 Implementation (pure Python, no numpy)

For each of N iterations (default 10,000):

```
# Sample probability from triangular distribution
p_low = max(0.01, P_effective × 0.3)    # uncertainty floor
p_high = min(0.99, P_effective × 3.0)    # uncertainty ceiling
p_sample = random.triangular(p_low, p_high, P_effective)

# Sample impact from triangular distribution
i_low = total_impact × 0.5                # 50% below estimate
i_high = total_impact × 2.0               # 100% above estimate
i_sample = random.triangular(i_low, i_high, total_impact)

# Compute loss
loss = p_sample × i_sample
```

### 4.3 Output

After all iterations, sort losses by value and compute percentiles:

```
p10 = loss[floor(N × 0.10)]   # 10th percentile (optimistic)
p50 = loss[floor(N × 0.50)]   # 50th percentile (median)
p90 = loss[floor(N × 0.90)]   # 90th percentile (pessimistic)
mean = average(losses)         # Expected value
```

P50 and P90 are the primary outputs. P10 is informational.

### 4.4 Convergence

Convergence testing shows P50 stabilizes within ±2% at 5,000 iterations.
10,000 iterations provide margin for skewed distributions. Mean computation
time: <50ms for 10K iterations on a modern CPU.

**Limitation:** Triangular distributions assume symmetric uncertainty around
the point estimate. PERT or LogNormal distributions would better model
skewed risk (low probability, high impact events), but require numpy.

---

## 5. Attack Chain Amplification

### 5.1 Conditional Probability

For a chain of vulnerabilities A → B (exploit A to enable B):

```
P(chain) = P(A) × P(B | A)

Where:
  P(A) = probability of exploiting A
  P(B | A) = probability of exploiting B given A is exploited
```

The key insight: P(B | A) is generally higher than P(B) because A has
already bypassed some security controls. The chain amplifier models this
increase.

### 5.2 Chain Endpoint Amplifiers

| Chain Endpoint | Amplifier | Rationale |
|---------------|-----------|-----------|
| rce | 2.2× | Full system control |
| full_data_exfiltration | 2.0× | All data stolen |
| privilege_escalation | 1.7× | Admin-level access |
| partial_data_access | 1.4× | Some data exposed |
| information_disclosure | 1.2× | Info only |

### 5.3 Combined Loss

```
chain_combined_loss = (sum of total_impacts of chained vulns) × amplifier × P(chain)
```

Note: Uses `total_impact` (not `expected_loss`) as the base, then applies
the chain probability and amplifier. This avoids double-counting the
individual vulnerability probabilities.

---

## 6. Priority Score (Primary Sort Key)

```
priority_score = expected_loss / fix_effort_hours
```

This is the single most important output. It answers: "Which vulnerability
gives the most risk reduction per hour of engineering time?"

The priority score uses P50 from Monte Carlo (median expected loss) for
stability — the median is robust to outliers in the simulation tails.

---

## 7. Risk Score (Normalized, 0-1000)

```
risk_score = min(1000, int((expected_loss_p50 / max_possible_loss) × 1000))
```

Where `max_possible_loss` is the P50 of the highest-risk finding in the
current scan. This makes the risk score **relative within a scan** — the
highest-risk finding is always 1000, and others are proportional.

This avoids the problem of dollar amounts being meaningless without context.
A PM can look at risk score 847 and know it's critical, without needing to
parse "$847K expected loss."

---

## 8. ROI of Remediation

```
fix_cost = fix_effort_hours × engineer_hourly_cost
roi = expected_loss / fix_cost
```

ROI > 1.0 means fixing saves more than it costs. ROI < 1.0 means fixing
is cheaper than the expected loss (still worth doing), but not a 1:1 return.

---

## Known Limitations (Interview Defense)

1. **No time discounting.** Future losses should be discounted to present
   value. This is omitted because most vulnerabilities are fixed in <30 days,
   making discounting negligible.

2. **No control effectiveness.** The model does not account for existing
   security controls (WAF, IDS, EDR) that reduce effective probability.
   This would require FAIR-CAM integration with per-control data.

3. **Static knowledge base.** Breach costs, probabilities, and regulatory
   fines are updated manually. A production version would pull from live
   APIs (IBM X-Force, FIRST.org EPSS, regulatory fine databases).

4. **No correlation between vulnerabilities.** Each vulnerability is modeled
   independently except for explicit attack chains. In reality, exploiting
   one vulnerability can drastically increase the probability of others
   even without a formal chain.

5. **Gemini is a black box.** The AI probability adjustment cannot be
   independently audited. We mitigate this by requiring reasoning output
   and keeping the baseline probability as a fallback.
