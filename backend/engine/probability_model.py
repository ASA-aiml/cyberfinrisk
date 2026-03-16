import json
import logging
from typing import Dict, Optional
from engine.epss_client import get_epss_score

logger = logging.getLogger(__name__)

def load_probabilities() -> Dict:
    with open("knowledge_base/exploit_probability.json") as f:
        return json.load(f)

def get_probability(
    bug_type: str,
    exposure: str,
    probabilities: Dict,
    cve_id: Optional[str] = None,
) -> tuple[float, str]:
    """
    Returns (probability: float, source: str).
    
    For known CVEs (from Trivy), fetches a real-world exploit probability
    from the EPSS API (FIRST.org). This is far more accurate than static
    base rates, e.g., CVE-2023-44487 (HTTP/2 RapidReset) has EPSS ~0.97.

    For custom code bugs (Semgrep findings), falls back to the knowledge-base
    base rates adjusted by exposure level.
    """
    # Attempt EPSS lookup for CVE-identified vulnerabilities
    if cve_id and cve_id.upper().startswith("CVE-"):
        epss_score = get_epss_score(cve_id)
        if epss_score is not None:
            # EPSS scores are already [0, 1] empirical probabilities
            # Cap at 0.95 to avoid 100% certainty in the model
            final_score = min(epss_score, 0.95)
            logger.info(f"Using EPSS score {final_score:.4f} for {cve_id}")
            return final_score, f"epss:{cve_id}"

    # Fallback: knowledge-base base rates (Semgrep, or CVE without EPSS data)
    base_rate = probabilities.get(bug_type, probabilities["UNKNOWN"]).get(
        exposure.upper(), 0.05
    )
    return base_rate, "knowledge_base"
