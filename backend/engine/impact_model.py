import json
import os

from models.company import AssetContext, CompanyContext
from models.risk_result import GeminiAnalysis, ImpactBreakdown

_KB_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge_base"
)


def _load_kb(name):
    path = os.path.join(_KB_DIR, name)
    with open(path) as f:
        return json.load(f)


def compute_total_impact(
    company: CompanyContext,
    bug_type: str,
    gemini_result: GeminiAnalysis | None = None,
    asset: AssetContext | None = None,
):
    bc = _load_kb("breach_costs.json")
    rm = _load_kb("regulatory_models.json")
    de = _load_kb("downtime_estimates.json")
    tax = _load_kb("bug_taxonomy.json")

    bug_info = tax.get(bug_type, {})

    # Data breach cost
    if bug_info.get("data_exfiltration", False):
        cpr = bc["cost_per_record_by_industry"].get(
            company.industry.lower(), bc["cost_per_record_by_industry"]["default"]
        )

        scope_multiplier = 0.20
        if gemini_result:
            if gemini_result.data_scope == "full_database":
                scope_multiplier = 1.0
            elif gemini_result.data_scope == "single_user_record":
                scope_multiplier = 0.0001
            elif gemini_result.data_scope == "none":
                scope_multiplier = 0.0

        if company.system_role in ["framework", "infrastructure"] and not gemini_result:
            scope_multiplier = 0.05

        records = int(company.estimated_records_stored * scope_multiplier)
        data_breach = records * cpr
    else:
        data_breach = 0.0

    # Incident response
    incident = bc["incident_response_cost"].get(company.company_size, 100000)

    # Downtime
    hours = de["downtime_hours_by_bug_type"].get(bug_type, 2)

    if asset and "value_per_hour" in asset.description.lower():
        cph = (
            asset.estimated_value_usd / 24
            if "day" in asset.description.lower()
            else company.estimated_downtime_cost_per_hour
            or bc["downtime_cost_per_hour"].get(company.company_size, 12000)
        )
    else:
        cph = company.estimated_downtime_cost_per_hour or bc["downtime_cost_per_hour"].get(
            company.company_size, 12000
        )
    downtime = hours * cph

    # Regulatory fines — per-finding share (capped at project level in main.py)
    reg = 0.0
    fw = [r.upper() for r in company.regulatory_frameworks]
    dt = [
        d.upper() for d in (asset.sensitive_data_types if asset else company.sensitive_data_types)
    ]

    if "GDPR" in fw or "PII" in dt:
        reg += min(
            max(company.annual_revenue, 0) * rm["GDPR"]["fine_percentage_of_arr"],
            rm["GDPR"]["max_fine_usd"],
        )
    if "PCI_DSS" in fw or "FINANCIAL" in dt:
        reg += rm["PCI_DSS"]["avg_fine"]
    if "HIPAA" in fw or "HEALTH" in dt:
        reg += rm["HIPAA"]["max_annual"]

    # Churn / reputation — capped at 25% of annual revenue
    if any(d in dt for d in ["FINANCIAL", "HEALTH"]):
        cr = bc["churn_rate_after_breach"]["high_sensitivity"]
    elif "PII" in dt:
        cr = bc["churn_rate_after_breach"]["medium_sensitivity"]
    else:
        cr = bc["churn_rate_after_breach"]["low_sensitivity"]
    reputation = min(
        max(company.get_total_users(), 0) * max(cr, 0) * max(company.arpu, 0) * 12,
        max(company.annual_revenue, 0) * 0.25,
    )

    breakdown = ImpactBreakdown(
        data_breach_cost=round(data_breach, 2),
        incident_response_cost=round(incident, 2),
        downtime_cost=round(downtime, 2),
        regulatory_penalty=round(reg, 2),
        reputation_damage=round(reputation, 2),
    )

    total = data_breach + incident + downtime + reg + reputation

    # Environment risk adjustment — configurable per asset
    if asset:
        total *= asset.risk_adjustment
        for k in breakdown.model_dump():
            setattr(breakdown, k, getattr(breakdown, k) * asset.risk_adjustment)

    return breakdown, round(total, 2)


def compute_regulatory_total(company: CompanyContext) -> float:
    """Compute the maximum possible regulatory penalty for this company.

    Called once per scan (not per vulnerability) to avoid the inflation
    problem of 100 findings × $20M GDPR fine = $2B.
    """
    rm = _load_kb("regulatory_models.json")

    total = 0.0
    fw = [r.upper() for r in company.regulatory_frameworks]
    dt = [d.upper() for d in company.sensitive_data_types]

    if "GDPR" in fw or "PII" in dt:
        total += min(
            max(company.annual_revenue, 0) * rm["GDPR"]["fine_percentage_of_arr"],
            rm["GDPR"]["max_fine_usd"],
        )
    if "PCI_DSS" in fw or "FINANCIAL" in dt:
        total += rm["PCI_DSS"]["avg_fine"]
    if "HIPAA" in fw or "HEALTH" in dt:
        total += rm["HIPAA"]["max_annual"]

    return round(total, 2)
