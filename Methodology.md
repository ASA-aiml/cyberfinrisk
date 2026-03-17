# Methodology (Workstream & Module Descriptions)

The FinRisk methodology is a multi-layered approach that integrates **Frontend Contextual Ingestion** with **Backend Probabilistic Quantification** using the **Factor Analysis of Information Risk (FAIR)** framework.

---

## I. Context & Presentation Layer (Frontend)

The frontend (built with **Next.js 15**) serves as the bridge between raw technical data and business-level risk management.

### 1. Ingestion & Context Engine (`app/dashboard/scan`)
Captures critical organizational data (Industry, Revenue, User Count, Exposure Type) required for accurate risk modelling. This ensures that a vulnerability in a production payment API is prioritized higher than one in an internal tool.

### 2. Dynamic Risk Visualization (`app/dashboard/project`)
Translates complex probabilistic outputs into high-density visual dashboards using **Recharts**.
- **Loss Exceedance Curves**: Visualizes the range of potential financial impacts.
- **Risk by Category**: Breaks down exposure into Data Breach, Regulatory, and Operational buckets.

### 3. Executive Reporting Module (`app/dashboard/reports`)
Standardizes findings into a "Business Brief" format. It hides technical jargon while emphasizing the **ROI of Remediation**, allowing executives to make data-driven cybersecurity investments.

---

## II. Analysis & Quantification Layer (Backend)

The backend (built with **FastAPI**) executes the rigorous mathematical functions required to quantify risk.

### 1. Scanner & Normalization (`engine/scanner.py`)
Clones repositories and executes **Semgrep** scans. It normalizes findings into a unified taxonomy, deduplicating alerts across large codebases.

### 2. AI Exploitability Analyzer (`engine/gemini_analyzer.py`)
Leverages **Google Gemini** for deep code context analysis. It validates if a vulnerability is reachable and exploitable, effectively filtering out non-production or mitigated risks before they reach the financial model.

#### 3. Impact Model (`engine/impact_model.py`)
The "Heart" of the financial engine. It calculates potential losses across five primary categories:
- **Data Breach:** Estimated records exposed × sector-specific cost per record.
- **Regulatory Penalties:** Dynamic modeling of GDPR, PCI-DSS, and HIPAA fines.
- **Incident Response:** Costs for forensics, legal, and public relations.
- **Operational Downtime:** Revenue loss based on business function criticality.
- **Reputational Damage:** Customer churn estimates based on ARPU and industry averages.

#### 4. Probability Model (`engine/probability_model.py`)
Defines baseline exploit probabilities based on the vulnerability type and its exposure (Internal vs. Public). This is later refined by the AI Analyzer.

#### 5. Expected Loss & ROI (`engine/expected_loss.py`)
Calculates the final **Expected Loss (EL = Probability × Impact)**. It also estimates remediation effort and calculates **ROI (EL / Fix Cost)** to provide a rigorous prioritization list.

#### 6. Attack Chain Analysis (`engine/attack_chain.py`)
A predictive module that identifies how multiple vulnerabilities can be chained together (e.g., Auth Bypass + SQL Injection) to cause a "Blast Radius" larger than the sum of its parts.

#### 7. Business Brief Generation (`engine/business_brief.py`)
Translates complex technical findings into "Plain English" executive summaries, focusing on business impact and required remediation steps.
