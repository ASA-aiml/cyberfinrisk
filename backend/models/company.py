from pydantic import BaseModel


class AssetContext(BaseModel):
    name: str
    description: str = ""
    paths: list[str]  # Substrings to match file paths
    business_function: str
    estimated_value_usd: float  # Financial value to the business
    sensitive_data_types: list[str]  # e.g., ["PII", "credentials"]
    exposure: str  # "internet-facing", "internal", "none"
    environment: str  # "prod", "staging", "dev", "test"
    risk_adjustment: float = (
        1.0  # Multiplier for non-prod environments; 0.01 for dev, 0.1 for staging
    )


class CompanyContext(BaseModel):
    company_name: str
    industry: str
    annual_revenue: float
    monthly_revenue: float
    active_users: int | None = 0
    # Support for variations in the user's test list
    active_customers: int | None = None
    active_stores: int | None = None
    developers_using_platform: int | None = None

    arpu: float
    engineer_hourly_cost: float
    deployment_exposure: str  # "public", "internal", "private"
    infrastructure_type: str  # "cloud", "on_prem", "hybrid"
    sensitive_data_types: list[str]  # ["PII", "financial", "health", "credentials"]
    regulatory_frameworks: list[str]  # ["GDPR", "PCI_DSS", "HIPAA", "CCPA"]
    estimated_records_stored: int
    estimated_downtime_cost_per_hour: float | None = None
    company_size: str = "mid_size"
    system_role: str = "saas_product"  # "saas_product", "infrastructure", "framework", "internal_tool", "microservice"
    stack_description: str | None = None
    product_description: str | None = None
    assets: list[AssetContext] | None = None

    def get_total_users(self) -> int:
        return (
            self.active_users
            or self.active_customers
            or self.active_stores
            or self.developers_using_platform
            or 0
        )
