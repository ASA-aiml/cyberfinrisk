# 🔐 CyberFinRisk: Vulnerability Financial Impact Engine (VFIE)

## 📌 Overview

**CyberFinRisk** is an advanced **cybersecurity risk quantification platform** that transforms technical vulnerability findings into **financial risk insights**.

Instead of prioritizing vulnerabilities purely by severity (e.g., CVSS), CyberFinRisk enables organizations to answer:

> “What is the financial impact if this vulnerability is exploited?”

This allows engineering and security teams to make **data-driven, business-aligned remediation decisions**.

---

## 🎯 Core Objective

Bridge the gap between:

* **Technical Security Findings** (e.g., SQL Injection, XSS)
* **Business Risk Impact** (e.g., revenue loss, regulatory fines)

By converting vulnerabilities into **Expected Financial Loss**, CyberFinRisk helps prioritize what truly matters.

---

## ⚙️ How It Works

CyberFinRisk operates in a multi-stage pipeline:

### 1. 🔍 Vulnerability Detection & Normalization

* Integrates with tools like **Semgrep**
* Detects:

  * Static code vulnerabilities
  * Dependency risks
* Normalizes findings into a unified taxonomy:

  * `SQL_INJECTION`
  * `XSS`
  * `IDOR`
* Removes duplicates and ignores non-production files

---

### 2. 🧠 Contextual Exploitability Analysis

* Uses AI models (e.g., Gemini) to analyze:

  * Authentication presence
  * Input sanitization
  * Data exposure level
* Adjusts **probability of exploit** dynamically

---

### 3. 💰 Financial Impact Modeling

Each vulnerability is evaluated across multiple cost dimensions:

#### 📊 Components of Financial Impact

* **Data Breach Costs**

  * `records_exposed × cost_per_record`

* **Regulatory Penalties**

  * GDPR, PCI DSS, HIPAA, etc.

* **Incident Response**

  * Forensics, containment, recovery

* **Operational Downtime**

  * Revenue loss during outages

* **Reputation Damage**

  * Customer churn × ARPU

---

### 4. 🔗 Attack Chain Modeling

* Detects related vulnerabilities
* Prevents **double-counting of financial risk**
* Models real-world exploit paths

---

### 5. 📈 Expected Loss Calculation

Core formula:

```
Expected Loss (EL) = Probability of Exploit × Total Financial Impact
```

This becomes the **primary prioritization metric**.

---

### 6. 🛠 Remediation Cost & ROI

* Estimates:

  * Developer effort (hours)
  * Cost of fixing vulnerabilities

* Calculates:

```
Remediation ROI = Expected Loss ÷ Fix Cost
```

➡️ Helps teams fix **high-impact, low-cost vulnerabilities first**

---

### 7. 🤖 AI-Powered Remediation

* Generates:

  * Secure code fixes
  * Context-aware patches
  * Developer-friendly explanations

* Ensures:

  * Practicality
  * Security best practices

---

### 8. 📊 Executive Risk Reporting

Produces business-level insights:

* Total financial exposure
* Top risk vulnerabilities
* Attack scenarios
* ROI-driven remediation plan

---

## 🚀 Key Features

* ✅ Automated GitHub repository scanning
* ✅ AI-driven exploitability validation
* ✅ Financial risk quantification (Expected Loss)
* ✅ Multi-factor impact analysis
* ✅ ROI-based prioritization
* ✅ Executive-ready reports
* ✅ Developer-friendly remediation guidance

---

## 🧰 Tech Stack

### Frontend

* Next.js
* React
* TailwindCSS (optional)

### Backend

* Python 3.11+
* FastAPI

### Analysis Engine

* Semgrep CLI

### AI Integration

* Google Gemini

### Data Modeling

* Pydantic

### Dev Tools

* GitPython
* Uvicorn

---

## 📂 Project Structure

```
cyberfinrisk/
├── frontend/             # Next.js frontend
│   ├── package.json
│   ├── pages/
│   └── public/
├── backend/              # FastAPI backend
│   ├── main.py
│   ├── engine/           # Core risk + scanning logic
│   ├── models/           # Pydantic schemas
│   └── knowledge_base/   # Risk benchmarks (JSON)
├── docs/                 # Documentation
├── LICENSE
└── README.md
```

---

## ⚙️ Prerequisites

### Frontend

* Node.js 18+
* npm / yarn

### Backend

* Python 3.11+
* Semgrep (`pip install semgrep`)
* Gemini API Key (optional)

---

## 📥 Installation & Setup

### 🔧 Backend Setup

```bash
git clone https://github.com/shadil-rayyan/finrisk.git
cd cyberfinrisk/backend
```

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
```

```bash
pip install -r requirements.txt
```

Create `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

Run server:

```bash
uvicorn main:app --reload
```

➡️ API available at: `http://localhost:8000`

---

### 🎨 Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

➡️ App runs at: `http://localhost:3000`

---

## 🚀 Usage

### API Endpoints

#### `POST /scan-repo`

Scan a GitHub repository

**Input:**

* `repo_url`
* `company` context

---

#### `POST /analyze-manual`

Analyze manually provided vulnerabilities

---

#### `GET /health`

Check system status

---

### 🧾 Example Company Context

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

---

## ☁️ Deployment

### Frontend

* Vercel
* Netlify

### Backend

* Render
* Railway
* AWS / GCP / Azure (optional)

---

## ⚠️ Limitations

* Financial estimates are probabilistic
* Depends on input accuracy
* AI-based exploitability is heuristic-driven
* Real-world breach costs may vary

---

## 🔮 Future Enhancements

* Automated data volume detection
* Database schema integration
* Historical breach calibration
* Enterprise risk system integration
* Real-time monitoring & alerts

---

## 💡 Why CyberFinRisk?

Traditional tools answer:

> “How severe is this vulnerability?”

CyberFinRisk answers:

> “How much money could this vulnerability cost us?”

That shift enables:

* Better prioritization
* Business alignment
* Faster decision-making

