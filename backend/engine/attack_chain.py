import json
import math

import google.generativeai as genai
from models.company import CompanyContext
from models.risk_result import AttackChain, RiskResult


def find_attack_chains(results: list[RiskResult], company: CompanyContext) -> list[AttackChain]:
    if len(results) < 2:
        return []

    model = genai.GenerativeModel("gemini-2.5-flash")

    vuln_summary = []
    for r in results:
        vuln_summary.append(
            {
                "id": r.vulnerability_id,
                "type": r.bug_type,
                "file": r.file,
                "line": r.line,
                "exposure": r.exposure,
                "gemini_context": r.gemini_analysis.business_context if r.gemini_analysis else "",
                "exploitable": r.gemini_analysis.is_exploitable if r.gemini_analysis else True,
            }
        )

    prompt = f"""You are a senior penetration tester analyzing a set of vulnerabilities
found in {company.company_name}'s codebase ({company.industry} company, {company.deployment_exposure} deployment).

VULNERABILITIES FOUND:
{json.dumps(vuln_summary, indent=2)}

TASK: Identify attack chains — sequences of 2 or more vulnerabilities that an attacker
could exploit in sequence to cause greater damage than any single vulnerability alone.

Classic chain examples:
- XSS → steal session → auth bypass → access admin → SQLi → full database
- Path traversal → read credentials → auth bypass → RCE
- IDOR → enumerate users → credential stuffing → account takeover

Respond ONLY with valid JSON with NO markdown fences, in exactly this format:
{{
  "chains": [
    {{
      "chain_id": "CHAIN_001",
      "vulnerability_ids": ["VULN_001", "VULN_002"],
      "chain_description": "Plain English description of the full attack path (2-3 sentences, no jargon)",
      "combined_severity": "critical" or "high" or "medium",
      "chain_endpoint": "rce" or "full_data_exfiltration" or "privilege_escalation" or "partial_data_access" or "information_disclosure",
      "severity_reasoning": "Why chaining makes this worse than the individual bugs",
      "steps": [
        "Step 1: Attacker exploits [VULN_001] to...",
        "Step 2: Using what they gained, they exploit [VULN_002] to...",
        "Step 3: The result is..."
      ]
    }}
  ]
}}

Rules:
- If no meaningful chains exist, return {{"chains": []}}.
- Only include chains where the combination is genuinely more dangerous.
- Write all descriptions for a non-technical CEO audience — no CVE IDs, no jargon.
- You MUST include `chain_endpoint` — this drives the financial amplifier in our model.
- Be conservative: only output chains you are highly confident exist."""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)

        amplifiers = {
            "rce": 2.2,
            "full_data_exfiltration": 2.0,
            "privilege_escalation": 1.7,
            "partial_data_access": 1.4,
            "information_disclosure": 1.2,
        }
        severity_amplifiers = {"critical": 2.0, "high": 1.7, "medium": 1.3}

        chains = []
        for c in data.get("chains", []):
            involved = [r for r in results if r.vulnerability_id in c["vulnerability_ids"]]
            if not involved:
                continue

            chain_endpoint = c.get("chain_endpoint", "partial_data_access")
            severity = c.get("combined_severity", "high")
            amplifier = amplifiers.get(chain_endpoint, severity_amplifiers.get(severity, 1.5))

            # Conditional probability chain:
            # P(chain) = P(first) × P(second|first) × P(third|first&second) × ...
            # Each subsequent vuln is easier because prior steps bypassed controls.
            # Amplifier models the increased ease: step_prob = min(0.95, p × sqrt(amplifier))
            total_impact_sum = sum(r.total_impact for r in involved)
            chain_prob = involved[0].effective_probability
            for r in involved[1:]:
                step_boost = math.sqrt(amplifier)
                conditional_p = min(0.95, r.effective_probability * step_boost)
                chain_prob *= conditional_p

            # Combined loss uses total_impact (not expected_loss) as base,
            # then applies chain probability and endpoint amplifier.
            # This avoids double-counting individual vuln probabilities.
            combined_loss = total_impact_sum * amplifier * chain_prob

            chains.append(
                AttackChain(
                    chain_id=c["chain_id"],
                    vulnerability_ids=c["vulnerability_ids"],
                    chain_description=c["chain_description"],
                    combined_severity=c.get("combined_severity", "high"),
                    combined_expected_loss=round(combined_loss, 2),
                    chain_steps=c.get("steps", []),
                )
            )
        return chains
    except Exception as e:
        print(f"Attack chain analysis failed: {e}")
        return []
