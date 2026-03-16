import os
import json
import google.generativeai as genai
from typing import Optional
from models.risk_result import GeminiAnalysis
from models.company import CompanyContext, AssetContext
from engine.criticality import get_asset_criticality

MAX_RETRIES = 2  # Retry Gemini once on JSON parse failure

def init_gemini(api_key: str):
    genai.configure(api_key=api_key)

def analyze_vulnerability(
    bug_type: str,
    file: str,
    line: int,
    code_context: str,
    message: str,
    exposure: str,
    company: CompanyContext,
    baseline_probability: float,
    asset: Optional[AssetContext] = None
) -> Optional[GeminiAnalysis]:
    """
    Ask Gemini to analyze a single vulnerability with full code context.
    Returns structured analysis including adjusted probability and fix.
    """
    model = genai.GenerativeModel("gemini-2.5-flash")  # free tier

    # Get file path criticality multiplier
    crit_label, crit_multiplier, crit_explanation = get_asset_criticality(file)

    prompt = f"""You are a senior application security engineer performing a vulnerability assessment.

COMPANY CONTEXT:
- Company: {company.company_name}
- Industry: {company.industry}
- System Role: {company.system_role} (e.g. saas_product, infrastructure, framework)
- Product: {company.product_description or 'Not specified'}
- Tech stack: {company.stack_description or 'Not specified'}
- Global Data stored: {', '.join(company.sensitive_data_types)}
- Base Deployment: {exposure} facing

ASSET CONTEXT (The specific component this vulnerability affects):
{
f"- Asset Name: {asset.name}" + chr(10) +
f"- Business Function: {asset.business_function}" + chr(10) +
f"- Estimated Value: ${asset.estimated_value_usd:,.2f}" + chr(10) +
f"- Handled Data: {', '.join(asset.sensitive_data_types)}" + chr(10) +
f"- Asset Environment: {asset.environment}" + chr(10) +
f"- Asset Exposure: {asset.exposure}"
if asset else "- This vulnerability affects the general codebase."
}

FILE PATH CRITICALITY:
- File: {file}
- Criticality Category: {crit_label} (multiplier: {crit_multiplier}x)
- Reason: {crit_explanation}

VULNERABILITY DETECTED:
- Type: {bug_type}
- File: {file}, Line(s): {line}
- Scanner message: {message}
- Baseline exploit probability: {baseline_probability}

CODE CONTEXT (lines around the vulnerability):
```
{code_context if code_context else "Code context not available — reason from file name and bug type."}
```

Analyze this vulnerability. Respond ONLY with raw JSON — NO markdown fences, NO code blocks, NO extra text.
Output exactly this structure:
{{
  "is_exploitable": true or false,
  "exploitability_confidence": "high", "medium", or "low",
  "exploitability_reasoning": "2-3 sentences explaining WHY this is or isn't exploitable based on the actual code, historical breach rates for this bug, and system context.",
  "business_context": "1-2 sentences describing what this code actually does and what business function it serves.",
  "authentication_required": "public_unauthenticated", "authenticated_user", "admin_only", or "internal_service",
  "data_scope": "full_database", "single_user_record", "system_files", or "none",
  "adjusted_probability": <float between 0.01 and 0.95>,
  "false_positive_likelihood": "high", "medium", or "low",
  "recommended_fix": "Specific fix — include actual code if possible, or precise instructions",
  "fix_complexity": "simple", "moderate", or "complex"
}}

Rules:
- If this is a framework/library issue and this company builds a framework, the impact is to the end-users.
- If this looks like a test file or dead code, set `is_exploitable` to false and lower probability to <= 0.05.
- Evaluate if authentication is really required based on routing, namespaces (e.g., admin_controller), or middleware.
- Base `data_scope` on the type of query or access (e.g. read-only vs full drop table, limited ORM scope vs raw SQL).
- If the input appears to come directly from user requests, raise the probability.
- The recommended_fix must be actionable — not generic advice.
- Adjust `adjusted_probability` down heavily for admin-only bugs or non-production code.
- IMPORTANT: `adjusted_probability` MUST be a number, not a string. It must be >= 0.01 and <= 0.95.
- IMPORTANT: Output ONLY the JSON object. Do not wrap in markdown."""

    def _parse_gemini_json(text: str) -> dict:
        """Robustly strip markdown fences and parse JSON, with fallback."""
        text = text.strip()
        # Strip triple-backtick markdown fences
        if text.startswith("```"):
            lines = text.split("\n")
            # Drop first line (```json or ```) and last line (```)
            inner = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
            text = inner.strip()
        return json.loads(text)

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = model.generate_content(prompt)
            text = response.text
            data = _parse_gemini_json(text)

            # Clamp adjusted_probability to valid range
            raw_prob = data.get("adjusted_probability", baseline_probability)
            try:
                adjusted_prob = max(0.01, min(0.95, float(raw_prob)))
            except (TypeError, ValueError):
                adjusted_prob = float(baseline_probability)

            return GeminiAnalysis(
                is_exploitable=bool(data.get("is_exploitable", True)),
                exploitability_confidence=data.get("exploitability_confidence", "medium"),
                exploitability_reasoning=data.get("exploitability_reasoning", ""),
                business_context=data.get("business_context", ""),
                authentication_required=data.get("authentication_required", "unknown"),
                data_scope=data.get("data_scope", "unknown"),
                adjusted_probability=adjusted_prob,
                false_positive_likelihood=data.get("false_positive_likelihood", "medium"),
                recommended_fix=data.get("recommended_fix", "Review and remediate manually."),
                fix_complexity=data.get("fix_complexity", "moderate")
            )
        except (json.JSONDecodeError, ValueError) as e:
            if attempt < MAX_RETRIES:
                print(f"Gemini JSON parse failed (attempt {attempt+1}), retrying... Error: {e}")
                continue
            print(f"Gemini analysis failed for {file}:{line} after {MAX_RETRIES+1} attempts — {e}")
            return None
        except Exception as e:
            print(f"Gemini analysis failed for {file}:{line} — {e}")
            return None
