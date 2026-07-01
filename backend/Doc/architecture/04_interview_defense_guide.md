# Interview Defense Guide

How to talk about CyberFinRisk in a FAANG interview. Every likely challenge
and its response.

---

## Q1: "How accurate is your financial model?"

**Don't say:** "Our expected loss calculations are validated against IBM Ponemon data."

**Do say:** "The model is designed for **relative prioritization**, not absolute
forecasting. The mathematical honest output is the **priority score** —
`expected_loss / fix_effort_hours` — which tells you what to fix first. The
dollar ranges provide business context with explicit confidence intervals
(P50-P90 from Monte Carlo simulation) so no one mistakes a range for a precise
number. Absolute accuracy would require company-specific incident history that
most organizations don't have. What we do have is defensible industry benchmarks
and a methodology that orders risks correctly even when the dollar amounts are
approximate."

**Why this works:** You acknowledge the limitation BEFORE they find it. You
redirect to the thing that IS mathematically sound (the priority ordering).
You show you understand the difference between relative ranking and absolute
accuracy.

---

## Q2: "Why Monte Carlo? Isn't that overengineering for a side project?"

**Don't say:** "It's more accurate."

**Do say:** "A point estimate `P × I` implies precision that doesn't exist. If
I claim expected loss is exactly $1.2M, and the interviewer asks 'How confident
are you in that number?', the only honest answer is 'I'm not.' Monte Carlo with
triangular distributions lets me say 'P50 is $450K, P90 is $2.2M' — which is
statistically honest. It's 15 lines of pure Python with zero additional
dependencies. The cost of implementation was negligible; the cost of a false-precision
number to a CEO making a security budget decision is enormous."

**Why this works:** You show you understand the difference between precision and
accuracy. You quantify implementation cost. You connect technical decisions to
business outcomes.

---

## Q3: "Why do you need AI? Can't you just use CVSS scores?"

**Don't say:** "AI makes it more accurate."

**Do say:** "CVSS is a technical severity score computed from the vulnerability
itself — it doesn't know whether this SQL injection is in a public API endpoint
or an internal admin tool behind SSO. Gemini analyzes the actual code context:
it can see that the vulnerable code is behind authentication, or it's in a test
file, or it handles admin-only functionality. This adjusts the probability from
the baseline 22% to something like 2-5% for an authenticated endpoint, or 95%
for a public unauthenticated one. That's 10-50× difference in expected loss,
and CVSS cannot provide it. The AI doesn't replace the model — it provides
data that the model couldn't get otherwise."

**Why this works:** You explain WHY AI is needed, not just that it's used. You
give concrete numbers. You define the boundary between AI and the model.

---

## Q4: "How do you validate your risk scores?"

**Don't say:** "We used historical breach data."

**Do say:** "We validate three ways:
1. **Convergence tests:** Monte Carlo P50 stabilizes within ±2% at 5K iterations,
verified by running 100 trials and measuring variance.
2. **Synthetic scenarios:** We construct known-risk scenarios (e.g., public SQL
injection with sensitive data) and verify the model ranks them above low-risk
ones (e.g., private misconfiguration with no data).
3. **Edge case testing:** Zero revenue, zero users, negative values, missing
data — the model degrades gracefully to default values and never crashes.

What we DON'T do is claim absolute accuracy against real breach costs, because
that requires company-specific data we don't have. The model is designed to
order risks correctly, not predict exact dollar impacts."

**Why this works:** You give specific, concrete validation methodology. You
explain what you DO and DON'T validate, showing maturity.

---

## Q5: "This looks like Snyk/DefectDojo. What's different?"

**Don't say:** "Ours has financial impact."

**Do say:** "Snyk and DefectDojo rank by CVSS or severity score. They tell you
which vulnerability is technically most severe. They don't tell you which one
to fix first given your business context. CyberFinRisk's primary output is
`priority_score = expected_loss / fix_hours` — which directly answers 'which
fix gives the most risk reduction per engineering hour?' For a startup with
5 engineers, a $50K-risk that takes 1 hour to fix might be higher priority
than a $200K-risk that takes 80 hours. CVSS cannot capture that trade-off.

The second difference is the Monte Carlo confidence intervals. Snyk shows
a single severity score. We show 'Expected Loss: $450K-$2.2M (90% confidence)'
— which is honest about uncertainty and useful for budget decisions.

The third difference is AI-contextualized exploitability. We don't just detect
vulnerabilities. We analyze each one in its code context to determine if it's
actually exploitable in THIS codebase."

**Why this works:** You demonstrate competitive analysis. You show you understand
the landscape and can articulate differentiation clearly.

---

## Q6: "Why Semgrep and Trivy? Why not a commercial scanner?"

**Don't say:** "They're free and open source."

**Do say:** "Semgrep and Trivy cover OWASP Top 10, CWE Top 25, and SANS 25
with structured JSON output, custom rule support, and CI/CD-native design.
They detect ~90% of real-world vulnerability classes. Commercial scanners
(Checkmarx, Fortify) add marginal coverage for niche categories but require
license procurement, per-seat pricing, and vendor management — barriers for
an open-source tool. The adapter pattern means adding a new scanner is a
single module, so users who need a commercial scanner can plug it in."

**Why this works:** You show you understand trade-offs, not just feature lists.
You know the cost of dependencies. You designed for extensibility.

---

## Q7: "Google uses Go for performance-critical systems. Why Python?"

**Don't say:** "It's what I know."

**Do say:** "Python is the right tool for this workload because:
1. The bottleneck is Gemini API latency (~3s per call), not CPU. Parallelism
(ThreadPoolExecutor) solves the throughput problem regardless of language.
2. The AI/ML ecosystem (Gemini SDK, any future ML components) is Python-native.
3. The risk model processing time is <50ms per finding — Python is fast enough.
4. FastAPI provides async request handling competitive with Go's net/http.

If the bottleneck ever shifts to CPU-bound computation (e.g., millions of
Monte Carlo iterations), I would rewrite the engine in Go or Rust and call it
as a subprocess. The current architecture's API layer is just an HTTP adapter
around `run_risk_engine()` — replacing the engine doesn't require rewriting
the API."

**Why this works:** You demonstrate language-agnostic thinking. You identify
the actual bottleneck. You have a migration plan. You designed for it.

---

## Q8: "How would you scale this to scan 1000 repos per day?"

**Don't say:** "Add more workers."

**Do say:** "The current bottleneck is the Gemini API call (~3s per finding).
For 1000 repos with an average of 50 findings each, that's 150K Gemini calls
or ~125 hours of sequential processing.

Scale plan:
1. **Horizontal:** Stateless FastAPI behind a load balancer, backed by a Redis
   job queue (RQ or Celery). Each worker pod handles one repo scan.
2. **Caching:** Gemini results cached by file hash + line number. If the same
   code is scanned again (e.g., in a CI pipeline), we reuse the previous
   analysis. Expected 60%+ cache hit rate for CI scans.
3. **Rate limiting:** Paid Gemini tier allows 2000+ RPM. With 20 worker pods
   at 200 RPM each, that's 4000 RPM — enough for ~1000 repos/day.
4. **Queue priority:** Paid-tier customers jump the queue. Free-tier scans
   run in a low-priority queue.

The Monte Carlo engine and impact model are already sub-50ms per finding, so
they're not the bottleneck. The scanner (Semgrep + Trivy) runs at ~30s per
repo, which is fine."

**Why this works:** You identify the bottleneck correctly. You have a concrete
scaling plan with numbers. You think about tiered service, caching, and
asynchronous processing.

---

## Q9: "What would you do differently if you started over?"

**Don't say:** "Nothing, it's well-designed."

**Do say:** "Three things:
1. **Full FAIR taxonomy from day one.** The FAIR-lite decision was pragmatic
for v1, but the data model should accommodate all 26 loss categories so
adding a new one doesn't require schema changes.
2. **Async-first architecture.** The current pipeline is synchronous with
ThreadPoolExecutor. An async job queue (Celery + Redis) would provide better
observability, retry logic, and worker scaling.
3. **Pluggable AI provider interface.** The Gemini integration works well but
lock-in is real. An abstract `AIClient` interface with implementations for
Gemini, GPT-4o, Claude, and local models would make switching a config change.

These are refinements, not rewrites. The core architecture — scanner →
classifier → AI → risk engine → aggregator — has proven correct through
testing."

**Why this works:** You show growth mindset. You identify real improvements.
You validate your current design while acknowledging it could be better.

---

## Q10: "How do you handle the cold-start problem? No incident history."

**Don't say:** "We use industry benchmarks."

**Do say:** "The cold-start problem is inherent to cyber risk quantification —
most companies don't have enough incident data for statistically significant
probability estimates. We handle it with three strategies:

1. **EPSS for CVEs:** 190K+ CVEs with empirical exploit probability from
FIRST.org. No company history needed.
2. **Semi-quantitative ranges:** The Monte Carlo output is always a range,
not a point. Wide ranges for baseline estimates (no company data) and narrower
ranges as data accumulates.
3. **Knowledge base transparency:** Every value in `breach_costs.json` is
sourced and dated. Users can override any value with their own data. The
model degrades gracefully — missing data uses defaults, never crashes.

The assumption ledger (documented in `architecture/03_financial_model_math.md`)
tracks what data went into each estimate. As the user runs more scans and
provides more company context, the ranges narrow."

**Why this works:** You acknowledge the problem directly. You have multiple
strategies to mitigate it. The Monte Carlo design (ranges instead of points)
is explained as a deliberate cold-start mitigation strategy.

---

## Q11: "How did you decide which test cases to write?"

**Don't say:** "I wrote tests for all the functions."

**Do say:** "I prioritized tests that catch the most expensive bugs:

1. **Edge cases that crash:** Zero probability, zero revenue, negative values,
   None inputs. The model should never crash regardless of input.
2. **Mathematical invariants:** P50 < P90 always (monotonic). Risk score is
   never > 1000. Monte Carlo converges to approximately P × I for large N.
3. **Regression tests for known bugs:** Regulatory fines were previously
   per-vulnerability (100 findings × $20M = $2B). The test asserts fines are
   per-incident.
4. **Performance benchmarks:** 10K Monte Carlo iterations in <100ms. This
   catches accidental complexity regressions.

I don't test trivial getters/setters. I don't test the Gemini integration
(mocked — Gemini is a black box by design). I test the mathematical core
and the integration points."

**Why this works:** You show testing philosophy, not just test count. You
prioritize by risk. You know what NOT to test.

---

## General Principles for the Interview

1. **Lead with trade-offs.** Never present a decision as obvious. Always name
   the rejected alternative and why.

2. **Quantify everything.** "Fast" → "<50ms for 10K iterations." "Scalable" →
   "10 concurrent workers, limited by Gemini API rate limits at 60 RPM."

3. **Acknowledge limitations before they ask.** If you say "my model outputs
   expected loss," they will ask about accuracy. Say "my model outputs
   expected loss ranges with explicit confidence intervals because..."
   and you've already answered the question.

4. **Know what you don't know.** "I don't know the exact convergence rate
   of PERT vs triangular distributions in Monte Carlo, but I would benchmark
   it by running 100 trials at varying iteration counts." This is better than
   guessing.

5. **The architecture is the answer.** Draw the pipeline: Scanner → Classifier
   → AI Analyzer → Risk Engine → Aggregator. Point to each stage and explain
   what it contributes. This structure alone covers 15 minutes of interview.
