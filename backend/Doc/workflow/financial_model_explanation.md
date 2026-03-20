# FinRisk Financial Model & Equations

FinRisk translates technical vulnerabilities into business impact using a multi-layered financial risk model. This document outlines the core equations and data sources used.

## 1. Core Risk Equation
The primary metric calculated for every vulnerability is the **Expected Loss**.

$$Expected\ Loss = Probability \times Total\ Impact$$

- **Probability**: The likelihood of the vulnerability being exploited within one year.
- **Total Impact**: The total financial cost to the business if a breach occurs.

---

## 2. Probability Model
FinRisk uses a hybrid approach to determine exploit probability:

### A. Real-world Data (EPSS)
For known vulnerabilities (CVEs), the engine fetches the **Exploit Prediction Scoring System (EPSS)** score from FIRST.org. 
- EPSS is an empirical probability $[0.0, 1.0]$ based on real-world exploit activity.
- *Source: `backend/engine/epss_client.py`*

### B. Base Rates (Semgrep/Custom Code)
For bugs found in custom code (without a CVE), the engine uses base rates from the knowledge base, adjusted by the system's **Exposure**:
- **Public/Internet-facing**: Higher base rate.
- **Internal/Private**: Lower base rate.
- *Source: `backend/engine/probability_model.py`*

---

## 3. Total Impact Breakdown
The **Total Impact** is the sum of five distinct financial risk categories:

$$Impact = Breach + Response + Downtime + Regulatory + Reputation$$

| Category | Calculation Method |
| :--- | :--- |
| **Data Breach** | $Records\ Impacted \times Cost\ Per\ Record\ (Industry\ Specific)$ |
| **Incident Response** | Base cost for forensics, legal, and notification based on company size. |
| **Downtime** | $Hours\ of\ Outage \times Cost\ Per\ Hour\ (CPH)$ |
| **Regulatory** | Fines from GDPR ($max(4\%\ Revenue,\ \$20M)$), PCI DSS, HIPAA, etc. |
| **Reputation** | $Active\ Users \times Churn\ Rate \times ARPU \times 12\ months$ |

- *Source: `backend/engine/impact_model.py`*

---

## 4. Multipliers & Adjustments

### A. Asset Criticality
Financial risk is scaled based on the **File Path** where the bug is located.
- **Payment/Auth paths**: $2.2x - 2.5x$ multiplier (High risk).
- **Admin/API paths**: $1.5x - 1.8x$ multiplier.
- **Test/Dev paths**: $0.2x$ multiplier (De-prioritized).
- *Source: `backend/engine/criticality.py`*

### B. Environment Scaling
The environment where the asset resides scales the final risk:
- **Production**: $100\%$ risk.
- **Staging**: $10\%$ risk.
- **Dev/Test**: $1\%$ risk (Residual risk of lateral movement).

---

## 5. Efficiency Metrics
To help security teams prioritize, FinRisk calculates:

- **Priority Score**: $Expected\ Loss / Fix\ Effort\ (Hours)$
- **Fix Cost**: $Fix\ Effort \times Hourly\ Engineering\ Rate$
- **ROI**: $Expected\ Loss / Fix\ Cost$

---
*Source: `backend/engine/expected_loss.py`*
