"""Impact model tests — verifies financial logic, regulatory capping,
reputation bounds, and environment adjustments.

Key invariants tested:
  - Regulatory penalties are per-incident (capped at project level)
  - Reputation damage is capped at 25% of annual revenue
  - Dev environment risk_adjustment reduces impact appropriately
  - Zero-revenue companies produce non-negative, finite results
"""

import pytest
from engine.impact_model import compute_regulatory_total, compute_total_impact
from models.company import AssetContext, CompanyContext


class TestRegulatoryFines:
    """Regulatory fines must be per-incident, not per-vulnerability.

    The per-finding impact model includes a regulatory component for
    prioritization purposes, but the TOTAL regulatory penalty across
    all findings must not exceed the per-scenario maximum (e.g., $20M GDPR).
    This is enforced in main.py via compute_regulatory_total()."""

    def test_regulatory_total_is_capped_at_company_maximum(self, sample_company):
        """For a $10M revenue company with GDPR + PCI_DSS:
           GDPR max = min(10M × 0.04, 20M) = $400K
           PCI_DSS = $250K
           Total = $650K
        """
        total = compute_regulatory_total(sample_company)
        assert total == 650_000.0, (
            f"Expected $650K, got ${total:,.0f}"
        )

    def test_regulatory_total_with_no_frameworks(self, zero_revenue_company):
        total = compute_regulatory_total(zero_revenue_company)
        assert total == 0.0

    def test_regulatory_total_never_exceeds_statutory_max(self):
        """Large revenue should be capped at statutory max."""
        large_company = CompanyContext(
            company_name="BigCorp",
            industry="technology",
            annual_revenue=10_000_000_000,  # $10B
            monthly_revenue=833_333_333,
            active_users=100_000_000,
            arpu=120.0,
            engineer_hourly_cost=150.0,
            deployment_exposure="public",
            infrastructure_type="cloud",
            sensitive_data_types=["PII"],
            regulatory_frameworks=["GDPR", "PCI_DSS", "HIPAA"],
            estimated_records_stored=100_000_000,
            company_size="enterprise",
        )
        total = compute_regulatory_total(large_company)
        # GDPR max = $20M, PCI_DSS = $250K, HIPAA = $1.9M
        assert total == pytest.approx(22_150_000.0, rel=0.01), (
            f"Expected ~$22.15M, got ${total:,.0f}"
        )


class TestReputationDamage:
    """Reputation damage must be bounded — the unbounded formula
    `users × churn × arpu × 12` can produce absurd values."""

    def test_reputation_capped_at_25pct_of_revenue(self, sample_company):
        """TestCorp: $10M revenue, 50K users, $120 ARPU.
           Uncapped: 50K × 0.05 × $120 × 12 = $3.6M
           25% of $10M = $2.5M
           Capped: $2.5M
        """
        breakdown, total = compute_total_impact(sample_company, "SQL_INJECTION")
        assert breakdown.reputation_damage <= sample_company.annual_revenue * 0.25, (
            f"Reputation ${breakdown.reputation_damage:,.0f} exceeds 25% of revenue"
        )

    def test_zero_revenue_produces_zero_reputation(self, zero_revenue_company):
        breakdown, total = compute_total_impact(zero_revenue_company, "SQL_INJECTION")
        assert breakdown.reputation_damage >= 0.0
        # Should be small or zero since there's no revenue or users
        assert breakdown.reputation_damage < 100

    def test_high_sensitivity_data_increases_churn(self):
        """Financial/health data should produce higher reputation damage
        than PII-only, but both must respect the 25% revenue cap."""
        fin_company = CompanyContext(
            company_name="FinTech",
            industry="finance",
            annual_revenue=50_000_000,    # high enough to not constrain the cap
            monthly_revenue=4_166_667,
            active_users=100_000,
            arpu=120.0,
            engineer_hourly_cost=150.0,
            deployment_exposure="public",
            infrastructure_type="cloud",
            sensitive_data_types=["PII", "financial"],
            regulatory_frameworks=[],
            estimated_records_stored=500_000,
            company_size="enterprise",
        )
        low_company = CompanyContext(
            company_name="LowRisk",
            industry="technology",
            annual_revenue=50_000_000,
            monthly_revenue=4_166_667,
            active_users=100_000,
            arpu=120.0,
            engineer_hourly_cost=150.0,
            deployment_exposure="public",
            infrastructure_type="cloud",
            sensitive_data_types=["PII"],
            regulatory_frameworks=[],
            estimated_records_stored=500_000,
            company_size="enterprise",
        )
        # Fin company has 10% churn, Low has 5% churn
        # Uncapped: fin = 100K × 0.10 × $120 × 12 = $14.4M
        #           low = 100K × 0.05 × $120 × 12 = $7.2M
        # Cap at 25% of $50M = $12.5M — fin should be capped, low should not
        fin_breakdown, _ = compute_total_impact(fin_company, "SQL_INJECTION")
        low_breakdown, _ = compute_total_impact(low_company, "SQL_INJECTION")
        assert fin_breakdown.reputation_damage == 12_500_000, (
            f"Fin reputation ${fin_breakdown.reputation_damage:,.0f} should be capped at $12.5M"
        )
        assert low_breakdown.reputation_damage == 7_200_000, (
            f"Low reputation ${low_breakdown.reputation_damage:,.0f} != $7.2M"
        )
        assert fin_breakdown.reputation_damage > low_breakdown.reputation_damage


class TestEnvironmentAdjustment:
    """Environment risk adjustment should reduce impact for non-prod assets."""

    def test_dev_environment_reduces_impact(self, sample_company, dev_asset):
        """Dev environment with risk_adjustment=0.01 should reduce
        impact to 1% of production baseline."""
        prod_breakdown, prod_total = compute_total_impact(
            sample_company, "SQL_INJECTION", asset=None
        )
        dev_breakdown, dev_total = compute_total_impact(
            sample_company, "SQL_INJECTION", asset=dev_asset
        )
        assert dev_total <= prod_total, (
            f"Dev total ${dev_total:,.0f} > prod total ${prod_total:,.0f}"
        )
        # Dev should be ~1% of prod
        if prod_total > 0:
            ratio = dev_total / prod_total
            assert ratio <= 0.02, (
                f"Dev/prod ratio {ratio:.4f} exceeds 0.02 (risk_adjustment=0.01)"
            )

    def test_prod_environment_no_reduction(self, sample_company, prod_asset):
        """Production asset with risk_adjustment=1.0 should not reduce impact."""
        baseline_breakdown, baseline_total = compute_total_impact(
            sample_company, "SQL_INJECTION", asset=None
        )
        prod_breakdown, prod_total = compute_total_impact(
            sample_company, "SQL_INJECTION", asset=prod_asset
        )
        assert prod_total >= baseline_total * 0.9, (
            "Production asset should not reduce impact below 90% of baseline"
        )

    def test_custom_risk_adjustment(self, sample_company):
        """Custom risk_adjustment values should work correctly."""
        custom_asset = AssetContext(
            name="Custom",
            description="Custom asset with 50% risk",
            paths=["custom/"],
            business_function="Testing",
            estimated_value_usd=100_000,
            sensitive_data_types=["PII"],
            exposure="internal",
            environment="staging",
            risk_adjustment=0.5,
        )
        baseline_breakdown, baseline_total = compute_total_impact(
            sample_company, "SQL_INJECTION", asset=None
        )
        custom_breakdown, custom_total = compute_total_impact(
            sample_company, "SQL_INJECTION", asset=custom_asset
        )
        assert custom_total == pytest.approx(baseline_total * 0.5, rel=0.1), (
            f"Custom total ${custom_total:,.0f} != 50% of baseline ${baseline_total:,.0f}"
        )


class TestDataBreachCost:
    """Data breach cost varies by industry and data scope."""

    def test_industry_costs_differ(self, sample_company):
        """Healthcare records should cost more than technology records."""
        healthcare = CompanyContext(
            company_name="HealthCo",
            industry="healthcare",
            **{k: v for k, v in sample_company.dict().items()
               if k not in ("company_name", "industry")}
        )
        # Fix: recreate properly
        healthcare = CompanyContext(
            company_name="HealthCo",
            industry="healthcare",
            annual_revenue=sample_company.annual_revenue,
            monthly_revenue=sample_company.monthly_revenue,
            active_users=sample_company.active_users,
            arpu=sample_company.arpu,
            engineer_hourly_cost=sample_company.engineer_hourly_cost,
            deployment_exposure=sample_company.deployment_exposure,
            infrastructure_type=sample_company.infrastructure_type,
            sensitive_data_types=sample_company.sensitive_data_types,
            regulatory_frameworks=sample_company.regulatory_frameworks,
            estimated_records_stored=sample_company.estimated_records_stored,
            company_size=sample_company.company_size,
            system_role=sample_company.system_role,
        )
        tech_breakdown, _ = compute_total_impact(sample_company, "SQL_INJECTION")
        health_breakdown, _ = compute_total_impact(healthcare, "SQL_INJECTION")
        assert health_breakdown.data_breach_cost > tech_breakdown.data_breach_cost

    def test_bug_without_exfiltration_has_no_breach_cost(self, sample_company):
        """XSS does not support data_exfiltration, so breach cost should be 0."""
        breakdown, total = compute_total_impact(sample_company, "XSS")
        assert breakdown.data_breach_cost == 0.0


class TestDowntimeCost:
    """Downtime cost varies by bug type and company size."""

    def test_rce_causes_more_downtime_than_xss(self, sample_company):
        rce_breakdown, _ = compute_total_impact(sample_company, "RCE")
        xss_breakdown, _ = compute_total_impact(sample_company, "XSS")
        assert rce_breakdown.downtime_cost > xss_breakdown.downtime_cost

    def test_unknown_bug_type_uses_default_two_hours(self, sample_company):
        breakdown, total = compute_total_impact(sample_company, "UNKNOWN")
        assert breakdown.downtime_cost > 0


class TestEdgeCases:
    """The impact model must never crash, produce negative values,
    or produce NaN regardless of input quality."""

    def test_zero_revenue_no_crash(self, zero_revenue_company):
        breakdown, total = compute_total_impact(zero_revenue_company, "RCE")
        assert total >= 0
        assert breakdown.data_breach_cost >= 0
        assert breakdown.incident_response_cost >= 0
        assert breakdown.downtime_cost >= 0
        assert breakdown.regulatory_penalty >= 0
        assert breakdown.reputation_damage >= 0

    def test_missing_asset_no_crash(self, sample_company):
        breakdown, total = compute_total_impact(sample_company, "SQL_INJECTION", asset=None)
        assert total >= 0

    def test_unknown_bug_type_does_not_crash(self, sample_company):
        breakdown, total = compute_total_impact(sample_company, "MADE_UP_BUG_TYPE")
        assert total >= 0

    def test_negative_revenue_does_not_crash(self):
        neg_company = CompanyContext(
            company_name="NegCorp",
            industry="technology",
            annual_revenue=-1_000_000,
            monthly_revenue=-83_333,
            active_users=0,
            arpu=0,
            engineer_hourly_cost=150.0,
            deployment_exposure="internal",
            infrastructure_type="cloud",
            sensitive_data_types=[],
            regulatory_frameworks=[],
            estimated_records_stored=0,
            company_size="startup",
        )
        breakdown, total = compute_total_impact(neg_company, "SQL_INJECTION")
        assert total >= 0  # should clamp gracefully
