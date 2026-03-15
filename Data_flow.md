# FinRisk Project Documentation

## 3. Block Diagram / Data Flow

The following diagram illustrates the end-to-end data flow from the user initiation to the generation of financial risk reports.

```mermaid
graph TD
    User["User (Web UI)"] -->|Inputs: Repo URL, Company Context| FE["Frontend (Next.js)"]
    FE -->|API Request| BE["Backend (FastAPI)"]
    
    subgraph "Backend Orchestration"
        BE -->|Clone & Scan| Scanner["Scanner (Semgrep)"]
        Scanner -->|Raw Findings| Clust["Clustering & Filtering"]
        Clust -->|Vulnerability Context| AI["AI Analyzer (Gemini)"]
        AI -->|Validated Exploitability| RiskEng["Risk Engine (FAIR Model)"]
        
        subgraph "FAIR Quantification"
            RiskEng -->|Impact Model| Impact["Financial Loss Calculation"]
            RiskEng -->|Prob Model| Prob["Effective Probability"]
            Impact & Prob -->|Quantification| EL["Expected Loss & ROI"]
        end
    end
    
    EL -->|Results| BE
    BE -->|Risk Data| FE
    FE -->|Visuals| Dash["Dashboard & Business Briefs"]
```

### Data Flow Steps:
1.  **Ingestion:** The user provides a repository URL and organizational context via the Next.js frontend.
2.  **Collection:** The FastAPI backend clones the repo and runs Semgrep (SAST/SCA) to identify potential security issues.
3.  **Refinement:** Findings are clustered to remove noise and filtered to exclude non-production code.
4.  **Augmentation:** GEMINI AI analyzes the code context to validate exploitability and adjust probability scores.
5.  **Quantification:** The engine applies the FAIR model, calculating financial impact across categories (Data Breach, Regulatory, etc.) and determining Expected Loss.
6.  **Reporting:** Results are ranked by ROI and presented back to the user as actionable business insights.

