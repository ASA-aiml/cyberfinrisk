"""Shared test fixtures — sample CompanyContext, findings, and results.

Reused across all engine tests to ensure consistent test input.
"""

import pytest
from models.company import AssetContext, CompanyContext


@pytest.fixture
def sample_company():
    return CompanyContext(
        company_name="TestCorp",
        industry="technology",
        annual_revenue=10_000_000,
        monthly_revenue=833_333,
        active_users=50_000,
        arpu=120.0,
        engineer_hourly_cost=150.0,
        deployment_exposure="public",
        infrastructure_type="cloud",
        sensitive_data_types=["PII", "financial"],
        regulatory_frameworks=["GDPR", "PCI_DSS"],
        estimated_records_stored=500_000,
        estimated_downtime_cost_per_hour=12_000,
        company_size="mid_size",
        system_role="saas_product",
    )

@pytest.fixture
def zero_revenue_company():
    return CompanyContext(
        company_name="ZeroCorp",
        industry="technology",
        annual_revenue=0,
        monthly_revenue=0,
        active_users=0,
        arpu=0,
        engineer_hourly_cost=150.0,
        deployment_exposure="internal",
        infrastructure_type="cloud",
        sensitive_data_types=[],
        regulatory_frameworks=[],
        estimated_records_stored=0,
        company_size="startup",
        system_role="internal_tool",
    )

@pytest.fixture
def prod_asset():
    return AssetContext(
        name="Payment API",
        description="Production payment processing endpoint",
        paths=["api/payment", "payment/"],
        business_function="Payment processing",
        estimated_value_usd=5_000_000,
        sensitive_data_types=["PII", "financial"],
        exposure="internet-facing",
        environment="prod",
        risk_adjustment=1.0,
    )

@pytest.fixture
def dev_asset():
    return AssetContext(
        name="Dev Sandbox",
        description="Development sandbox environment",
        paths=["sandbox/", "dev/"],
        business_function="Development testing",
        estimated_value_usd=10_000,
        sensitive_data_types=["PII"],
        exposure="internal",
        environment="dev",
        risk_adjustment=0.01,
    )
