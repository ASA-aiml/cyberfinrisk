"""
Asset Criticality Scorer based on file path heuristics.
Maps vulnerability file paths to criticality multipliers.

Replaces the binary 'internet-facing vs internal' flag with
a more granular, path-aware criticality score.
"""

# File path keywords -> (criticality_label, multiplier, explanation)
_PATH_RULES: list[tuple[list[str], str, float, str]] = [
    # Highest criticality — financial & auth paths
    (["payment", "billing", "checkout", "stripe", "invoice", "transaction"],
     "payment_critical", 2.5, "Payment processing code — breaches have direct financial and PCI DSS exposure"),
    (["auth", "login", "oauth", "jwt", "token", "session", "2fa", "mfa", "password"],
     "auth_critical", 2.2, "Authentication code — exploitation could lead to full account takeover"),
    (["admin", "superuser", "internal/", "backoffice", "staff"],
     "admin_access", 1.8, "Admin/privileged access code — limited exposure but full system control if exploited"),
    # High criticality — data access
    (["api/", "/api", "graphql", "rest/", "/rpc"],
     "public_api", 1.7, "Public API endpoint — directly user-accessible and likely externally reachable"),
    (["user", "account", "profile", "customer", "personal"],
     "user_data", 1.6, "User data handling code — breach risks PII exposure"),
    (["db/", "database", "repository", "dao", "orm", "models/"],
     "data_layer", 1.5, "Database / ORM layer — vulnerabilities can cascade to full data access"),
    # Medium criticality
    (["upload", "file", "storage", "s3", "blob", "asset"],
     "file_handling", 1.3, "File upload/storage code — path traversal and RCE risks are elevated"),
    (["notification", "email", "sms", "webhook"],
     "communication", 1.1, "Communication/notification code — low direct data risk but useful for phishing pivot"),
    # Low criticality — test, dev, and tooling paths
    (["test/", "tests/", "spec/", "__tests__", "fixtures/"],
     "test_code", 0.2, "Test code — unlikely to be deployed in production"),
    (["migrations/", "seed", "scripts/"],
     "devops_script", 0.4, "Migration/seeding script — rarely exploitable in live environment"),
]

DEFAULT_LABEL = "standard"
DEFAULT_MULTIPLIER = 1.0
DEFAULT_EXPLANATION = "Standard code path — no specific criticality adjustment applied"


def get_asset_criticality(file_path: str) -> tuple[str, float, str]:
    """
    Analyze a file path and return:
    - criticality_label: Human-readable category (e.g. 'payment_critical')
    - multiplier: Float to apply to the expected loss (1.0 = no change)
    - explanation: Why this path was rated this way

    Matches the FIRST applicable rule in priority order.
    """
    if not file_path:
        return DEFAULT_LABEL, DEFAULT_MULTIPLIER, DEFAULT_EXPLANATION

    path_lower = file_path.lower().replace("\\", "/")

    for keywords, label, multiplier, explanation in _PATH_RULES:
        if any(kw in path_lower for kw in keywords):
            return label, multiplier, explanation

    return DEFAULT_LABEL, DEFAULT_MULTIPLIER, DEFAULT_EXPLANATION
