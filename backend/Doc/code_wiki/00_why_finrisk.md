
# FinRisk Internal System Architecture

### Turning Software Vulnerabilities into Financial Risk Intelligence

---

# 1. Introduction

Modern organizations rely heavily on automated security tools to detect vulnerabilities in software systems. Static analysis tools, dependency scanners, and configuration analyzers can generate hundreds or thousands of findings across large repositories.

While these tools are effective at detecting technical weaknesses, they introduce a new operational challenge: **interpreting the business significance of vulnerability findings**.

Security reports typically contain technical information such as:

* CVE identifiers
* vulnerability severity scores
* code locations
* exploit descriptions

These reports are useful for engineers but do not answer the question that organizational leadership ultimately cares about:

**What is the financial risk associated with these vulnerabilities?**

Two vulnerabilities with identical technical severity scores may have drastically different business consequences depending on factors such as:

* system exposure
* stored data volume
* regulatory obligations
* operational dependencies
* customer impact

As a result, organizations often struggle to prioritize remediation efforts effectively.

FinRisk addresses this problem by translating technical vulnerability findings into **financial risk estimates**, allowing organizations to prioritize remediation based on potential economic impact rather than raw vulnerability counts.

---

# 2. System Overview

FinRisk is a **cyber risk quantification engine** that transforms vulnerability findings into financial risk estimates.

The system operates through a multi-stage pipeline consisting of:

1. Repository Security Analysis
2. Vulnerability Normalization
3. Contextual Exploitability Analysis
4. Financial Impact Modeling
5. Risk Aggregation and Attack Chain Modeling
6. Remediation Cost Estimation
7. Executive Risk Reporting

The final output is a structured risk report that includes:

* expected financial loss
* vulnerability prioritization
* remediation ROI
* executive-level explanations

---

# 3. Required Organizational Context

Security scanners detect vulnerabilities but have no knowledge of the organization operating the software.

However, financial risk estimation requires contextual information such as:

* company revenue
* number of users
* sensitive data types
* regulatory exposure
* operational costs

FinRisk therefore requires **organizational context inputs** from the user before analysis begins.

These inputs include:

### Business Context

* company name
* industry sector
* company size
* annual revenue
* number of active users
* average revenue per user

### Infrastructure Context

* system role (SaaS product, framework, internal tool)
* deployment exposure (public, internal, private)

### Data Sensitivity

* personally identifiable information (PII)
* financial data
* healthcare data
* authentication credentials

### Regulatory Environment

* GDPR
* PCI DSS
* HIPAA
* CCPA

### Operational Costs

* engineer hourly cost
* downtime cost per hour

### Data Volume

* estimated number of records stored by the system

These variables provide the business context necessary for financial risk modeling.

---

# 4. Security Analysis Pipeline

FinRisk begins by scanning the target software repository to identify vulnerabilities.

The system integrates multiple security analysis tools including static code scanners and dependency vulnerability scanners.

These tools detect issues such as:

* SQL injection
* cross-site scripting
* insecure authentication logic
* insecure deserialization
* vulnerable third-party libraries

Each finding includes metadata such as:

* vulnerability rule identifier
* file path
* source code location
* severity classification
* descriptive message

However, raw scanner outputs contain substantial noise and must be processed before risk modeling.

---

# 5. Vulnerability Normalization

Security scanners use inconsistent rule identifiers to describe vulnerabilities.

For example:

```
javascript.express.security.injection.sqli
python.sqlalchemy.injection
nodejs.sqli
```

FinRisk maps these identifiers to a standardized vulnerability taxonomy using:

```
bug_taxonomy.json
```

Example taxonomy categories include:

* SQL_INJECTION
* CROSS_SITE_SCRIPTING
* IDOR
* AUTHENTICATION_BYPASS
* INSECURE_DESERIALIZATION

This normalization allows vulnerabilities to be associated with predefined risk models.

---

# 6. Noise Reduction and Deduplication

Static analysis tools frequently generate duplicate findings for the same root cause.

For example, a single SQL injection vulnerability may be reported across multiple adjacent lines of code.

To prevent inflated vulnerability counts, FinRisk performs **root cause clustering**.

Findings are grouped using:

```
rule_id + file_path
```

Multiple detections of the same vulnerability pattern are consolidated into a single actionable issue.

Additionally, vulnerabilities detected in non-production files are filtered.

Examples include:

```
test/
mock/
docs/
scripts/
.env.example
```

These files are excluded because they do not represent real attack surfaces.

---

# 7. Contextual Exploitability Analysis

Traditional vulnerability scoring systems rely on static severity metrics such as CVSS.

However, severity alone does not indicate whether a vulnerability is realistically exploitable.

FinRisk therefore performs contextual analysis using source code inspection.

For each vulnerability, the system extracts a context window of approximately 40 lines surrounding the vulnerable code.

This code is analyzed to determine exploitability signals such as:

* presence of authentication checks
* exposure of API endpoints
* user input reaching sensitive operations
* input validation or sanitization mechanisms
* database queries or file system access

An AI model acts as an application security analyst, interpreting these signals and producing structured outputs such as:

```
authentication_required
data_scope
false_positive_probability
exploitability_adjustment
```

These outputs are used to adjust baseline exploit probability estimates.

The AI model does not assign final probabilities directly but provides contextual signals that refine baseline estimates.

---

# 8. Exploit Probability Estimation

Each vulnerability type has a baseline exploit probability defined in:

```
exploit_probability.json
```

Example values:

```
SQL Injection (Public): 0.25
SQL Injection (Internal): 0.12
SQL Injection (Private): 0.05
```

These values represent heuristic estimates derived from security research and historical breach observations.

Contextual signals identified during code analysis modify these baseline probabilities.

Example adjustments include:

* reduced probability if authentication is required
* increased probability if user input is directly reachable
* reduced probability if sanitization mechanisms are present

The result is an adjusted probability estimate representing the likelihood that the vulnerability could be successfully exploited.

---

# 9. Financial Impact Modeling

If a vulnerability is exploited, the resulting financial impact can arise from several sources.

FinRisk models impact across five categories.

---

### Data Breach Costs

If sensitive data is exposed, breach cost is estimated using:

```
Data Breach Cost =
Records Exposed × Cost Per Record
```

Cost-per-record benchmarks are stored in:

```
breach_costs.json
```

Example:

```
Finance: $150 per record
Healthcare: $300 per record
```

The number of exposed records is adjusted based on AI-derived `data_scope`.

Possible scopes include:

```
full_database
single_user_record
system_files
none
```

This prevents unrealistic assumptions that every vulnerability exposes the entire database.

---

### Regulatory Penalties

If sensitive data is compromised, regulatory penalties may apply.

Penalty models are defined in:

```
regulatory_models.json
```

Example:

GDPR allows fines up to:

```
4% of global annual revenue
```

or

```
€20 million
```

whichever is greater.

---

### Incident Response Costs

Security incidents require operational response including:

* forensic investigation
* legal consultation
* customer notification
* crisis management

FinRisk estimates incident response costs using baseline values scaled by company size.

---

### Operational Downtime

Certain vulnerabilities may cause service outages.

Downtime durations are estimated using:

```
downtime_estimates.json
```

Example:

```
Remote Code Execution: 8 hours
SQL Injection: 4 hours
Cross-Site Scripting: 2 hours
```

Downtime cost is calculated as:

```
Downtime Cost =
Downtime Hours × Revenue Per Hour
```

---

### Reputation Damage and Customer Churn

Security incidents often cause customers to abandon a service.

FinRisk estimates churn impact using:

```
Active Users × Churn Rate × ARPU × 12 months
```

Churn rate varies depending on the sensitivity of compromised data.

---

# 10. Expected Financial Loss

The final risk score for each vulnerability is calculated using the standard risk equation:

```
Expected Loss =
Probability of Exploit × Financial Impact
```

This produces a monetary estimate representing the expected financial damage associated with the vulnerability.

---

# 11. Attack Chain Modeling

Multiple vulnerabilities may form a combined attack path.

Example:

```
Authentication Bypass → SQL Injection → Database Access
```

Naively summing the expected loss of each vulnerability would artificially inflate risk estimates.

FinRisk prevents this by modeling **attack chains** using:

```
attack_stories.json
```

Linked vulnerabilities are grouped into chains and assigned a single maximum impact value.

This prevents double counting of financial exposure.

---

# 12. Remediation Cost Estimation

The system also estimates the cost required to fix each vulnerability.

Fix cost is calculated as:

```
Engineer Hourly Rate × Estimated Fix Hours
```

Estimated fix hours are defined by vulnerability type based on developer experience.

Example:

```
SQL Injection: 6 hours
XSS: 3 hours
IDOR: 4 hours
```

---

# 13. Remediation ROI

FinRisk calculates the return on investment for fixing each vulnerability.

```
Remediation ROI =
Expected Loss ÷ Fix Cost
```

This metric identifies vulnerabilities where remediation produces the greatest reduction in financial risk.

---



# 13A. LLM-Based Vulnerability Remediation Suggestions

In addition to estimating financial risk, FinRisk provides **automated remediation guidance** for detected vulnerabilities.

Rather than relying solely on static rule-based recommendations, FinRisk uses a **Large Language Model (LLM)** to generate context-aware fix suggestions based on the vulnerable code.

This allows the system to produce remediation guidance tailored to the **exact code implementation**, programming language, and framework used in the repository.

---

## LLM Remediation Analysis Pipeline

For each confirmed vulnerability, the system constructs an input package containing:

* normalized vulnerability type
* vulnerable code snippet
* surrounding context (approximately 40 lines)
* programming language
* framework (if identifiable)
* vulnerability description

Example input structure:

```
{
  vulnerability_type: "SQL_INJECTION",
  file_path: "api/userController.js",
  language: "JavaScript",
  framework: "Express",
  code_context: "...40 lines of code..."
}
```

This information is passed to the LLM using a structured prompt designed to emulate a **secure code reviewer**.

---

## Prompt Design

The LLM is instructed to analyze the vulnerability and produce structured remediation guidance.

Example prompt instruction:

```
You are a senior application security engineer.

Analyze the following code snippet containing a security vulnerability.

Tasks:
1. Explain the root cause of the vulnerability
2. Describe how an attacker could exploit it
3. Suggest a secure remediation strategy
4. Provide an example code fix
```

The model then generates a structured response.

---

## Structured LLM Output

The response from the LLM is parsed into structured fields used by the reporting engine.

Example output:

```
{
  root_cause: "User input is concatenated directly into a SQL query",
  exploit_description: "An attacker could inject malicious SQL to access the database",
  remediation_strategy: "Use parameterized queries or prepared statements",
  example_fix: "...secure code example..."
}
```

These fields are included in the final vulnerability report.

---

## Benefits of LLM-Generated Fix Suggestions

Using an LLM provides several advantages compared to static remediation guidance:

### Context Awareness

The model can interpret the surrounding code and recommend fixes that align with the existing implementation.

### Language Flexibility

LLMs can generate remediation suggestions across multiple programming languages and frameworks without requiring separate rule sets.

### Developer-Friendly Explanations

The model provides clear explanations that help developers understand **why the vulnerability occurs**, not just how to fix it.

### Faster Remediation

Developers can immediately apply suggested fixes without needing to research the vulnerability type.

---

## Safety Controls

Because LLM outputs may occasionally contain incorrect suggestions, FinRisk applies basic validation checks before including recommendations in reports.

These checks include:

* verifying that suggested fixes modify the vulnerable code location
* ensuring the fix aligns with the identified vulnerability type
* filtering potentially unsafe code modifications

The system therefore treats LLM-generated fixes as **developer guidance rather than automatic patches**.

---

## Integration with Risk Reports

Each vulnerability entry in the final FinRisk report includes:

* vulnerability classification
* exploit probability
* expected financial loss
* recommended remediation strategy
* example secure code fix
* estimated remediation effort

This allows developers to move directly from **risk identification to practical mitigation**.

# 14. Executive Risk Reporting

The final output of FinRisk is an executive-level risk report.

The report includes:

* total estimated financial exposure
* prioritized vulnerability list
* attack chain scenarios
* remediation ROI
* plain-language risk explanations

These reports allow leadership to understand cybersecurity risks in business terms.

---

# 15. System Limitations

FinRisk produces **risk estimates rather than precise financial forecasts**.

Several limitations apply.

### User-Supplied Data

Organizational context values such as revenue, user count, and records stored are provided by users and may be approximate.

### Heuristic Probability Models

Exploit probability estimates are based on heuristic models rather than exact statistical measurements.

### AI Analysis Uncertainty

Contextual analysis performed by AI models is probabilistic and may contain inaccuracies.

### Breach Cost Variability

Actual breach costs vary widely depending on incident specifics.

---

# 16. Future Improvements

Future enhancements may include:

* automated estimation of stored data volumes
* integration with database schema analysis
* improved exploit probability models
* historical breach dataset calibration
* integration with enterprise risk management systems

