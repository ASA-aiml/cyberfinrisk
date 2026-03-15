# FinRisk: Vulnerability Financial Impact Engine (VFIE)



## **FinRisk Project Summary**

**Objective:**
FinRisk is a **cyber risk quantification system** that translates software vulnerability findings into **financial risk estimates**, helping organizations prioritize remediation based on potential economic impact rather than raw technical severity.

**Key Features:**

1. **Vulnerability Detection & Normalization**

   * Integrates multiple security scanners (static analysis, dependency scanning).
   * Normalizes vulnerabilities into a standard taxonomy (e.g., SQL_INJECTION, XSS, IDOR).
   * Deduplicates findings and filters non-production files.

2. **Contextual Exploitability Analysis**

   * Uses AI models to analyze surrounding code for exploitability signals.
   * Adjusts baseline exploit probabilities based on authentication, data exposure, and input sanitization.

3. **Financial Impact Modeling**

   * Calculates expected loss if a vulnerability is exploited, across categories like:

     * **Data breach costs** (records exposed × cost per record)
     * **Regulatory penalties** (e.g., GDPR, PCI DSS, HIPAA fines)
     * **Incident response costs**
     * **Operational downtime**
     * **Reputation damage / customer churn**

4. **Attack Chain Modeling**

   * Identifies linked vulnerabilities to prevent double-counting of financial risk.

5. **Remediation Cost & ROI**

   * Estimates developer effort and cost to fix vulnerabilities.
   * Calculates **remediation ROI** = expected loss ÷ fix cost, prioritizing high-impact fixes.

6. **LLM-Powered Remediation Suggestions**

   * Uses Large Language Models to generate secure, context-aware code fixes.
   * Provides developer-friendly explanations and example patches for each vulnerability.
   * Includes safety validation to ensure suggestions are practical.

7. **Executive Risk Reporting**

   * Generates business-focused reports with total financial exposure, prioritized vulnerabilities, attack scenarios, and remediation guidance.

**Inputs Required:**

* Organizational data: revenue, user count, regulatory obligations, sensitive data types.
* Infrastructure context: system type, exposure, operational costs, data volume.

**Limitations:**

* Estimates are probabilistic, based on heuristics and AI analysis.
* User-supplied organizational context may be approximate.
* Actual financial losses and breach impacts may vary.

**Future Enhancements:**

* Automated data volume estimation, database schema integration, historical breach calibration, and integration with enterprise risk management systems.

**Overall:**
FinRisk bridges the gap between **technical vulnerability detection** and **business-level risk management**, enabling organizations to make informed, financially-driven decisions about cybersecurity remediation.


---

## 🚀 Key Features

* **Automated Scanning**: Clones and scans GitHub repositories using Semgrep rulesets.
* **Financial Risk Modeling**: Calculates **Expected Loss (EL)**:
  `EL = Probability of Exploit × Total Financial Impact`
* **Comprehensive Impact Analysis**:

  * Data Breach (Industry-adjusted cost per record)
  * Incident Response
  * Operational Downtime
  * Regulatory Penalties (GDPR, PCI DSS, HIPAA, etc.)
  * Reputational Damage (Churn-based)
* **AI-Powered Insights**: Integrates Google Gemini for exploitability validation and contextual remediation guidance.
* **ROI Ranking**: Prioritizes vulnerabilities by expected loss per engineering hour.
* **Business Briefings**: Generates executive summaries and plain-English reports for management.

---

## 🛠 Tech Stack

* **Frontend**: Next.js, React, TailwindCSS (optional)
* **Backend**: Python 3.11+, FastAPI
* **Analysis Engine**: Semgrep CLI
* **AI Integration**: Google Gemini (Generative AI)
* **Data Models**: Pydantic
* **Development Tools**: GitPython, Uvicorn

---

## 📂 Project Structure

```
finrisk/
├── frontend/             # Next.js frontend
│   ├── package.json
│   ├── pages/
│   └── public/
├── backend/              # FastAPI backend
│   ├── main.py
│   ├── engine/           # Core scanning and risk logic
│   ├── models/           # Pydantic models
│   └── knowledge_base/   # JSON benchmarks for probability & costs
├── Doc/                  # Documentation (Architecture, API, Engine)
├── LICENSE
└── README.md
```

---

## ⚙️ Prerequisites

### Frontend

* Node.js 18+
* npm or yarn

### Backend

* Python 3.11+
* Semgrep CLI (`pip install semgrep`)
* Gemini API Key (optional for advanced AI analysis)

---

## 📥 Installation & Setup

### Backend Setup

1. Clone the repository:

```bash
git clone https://github.com/shadil-rayyan/finrisk.git
cd finrisk/backend
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. The frontend is accessible at: `http://localhost:3000` (default Next.js port)

---

## 🚀 Usage

### Backend Server

Start the FastAPI server:

```bash
cd backend
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`.

### API Endpoints

* **`POST /scan-repo`**: Scan a GitHub repository.
  **Required**: `repo_url`, `company` context.

* **`POST /analyze-manual`**: Analyze specific vulnerability data manually.

* **`GET /health`**: Check system health.

### Example Request Body (Company Context)

```json
{
  "company_name": "Acme Corp",
  "industry": "finance",
  "annual_revenue": 10000000,
  "active_users": 50000,
  "arpu": 20,
  "engineer_hourly_cost": 100,
  "infrastructure_type": "cloud",
  "deployment_exposure": "public",
  "sensitive_data_types": ["PII", "financial"],
  "regulatory_frameworks": ["GDPR", "PCI_DSS"],
  "estimated_records_stored": 100000,
  "company_size": "mid_size"
}
```

