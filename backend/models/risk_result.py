from pydantic import BaseModel


class ImpactBreakdown(BaseModel):
    data_breach_cost: float
    incident_response_cost: float
    downtime_cost: float
    regulatory_penalty: float
    reputation_damage: float

    def model_dump(self):
        return {
            "data_breach_cost": self.data_breach_cost,
            "incident_response_cost": self.incident_response_cost,
            "downtime_cost": self.downtime_cost,
            "regulatory_penalty": self.regulatory_penalty,
            "reputation_damage": self.reputation_damage,
        }


class GeminiAnalysis(BaseModel):
    is_exploitable: bool
    exploitability_confidence: str  # "high", "medium", "low"
    exploitability_reasoning: str  # plain English explanation
    business_context: str  # what this endpoint/code actually does
    authentication_required: str = "unknown"
    data_scope: str = "unknown"
    adjusted_probability: float
    false_positive_likelihood: str
    recommended_fix: str
    fix_complexity: str


class AttackChain(BaseModel):
    chain_id: str
    vulnerability_ids: list[str]
    chain_description: str
    combined_severity: str
    combined_expected_loss: float
    chain_steps: list[str]


class ConfidenceInterval(BaseModel):
    p10: float  # 10th percentile (optimistic)
    p50: float  # 50th percentile (median expected loss)
    p90: float  # 90th percentile (pessimistic)
    mean: float  # arithmetic mean
    iterations: int = 10000  # Monte Carlo iterations used


class RiskResult(BaseModel):
    vulnerability_id: str
    bug_type: str
    file: str
    line: int
    severity: str
    exposure: str
    code_context: str = ""
    message: str = ""
    probability_of_exploit: float
    gemini_analysis: GeminiAnalysis | None = None
    effective_probability: float
    impact_breakdown: ImpactBreakdown
    total_impact: float
    expected_loss: float  # P50 from Monte Carlo
    expected_loss_p10: float = 0.0  # 10th percentile
    expected_loss_p90: float = 0.0  # 90th percentile
    risk_score: int = 0  # 0-1000 normalized
    fix_effort_hours: float
    fix_cost_usd: float
    priority_score: float
    roi_of_fixing: float
    business_brief: str
    attack_chains: list[str] | None = None
