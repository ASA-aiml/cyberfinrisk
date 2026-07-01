import random
import statistics


def monte_carlo_expected_loss(
    probability: float,
    total_impact: float,
    iterations: int = 10000,
    prob_uncertainty: float = 0.3,
    impact_uncertainty: float = 0.5,
) -> dict:
    """Run Monte Carlo simulation to estimate expected loss distribution.

    Uses triangular distributions for both probability and impact.
    All stdlib — zero additional dependencies.

    Args:
        probability: Baseline probability of exploit (0-1)
        total_impact: Baseline total financial impact in USD
        iterations: Number of Monte Carlo iterations (default 10K)
        prob_uncertainty: Uncertainty factor for probability (default 0.3 = ±30%)
        impact_uncertainty: Uncertainty factor for impact (default 0.5 = ±50%)

    Returns:
        dict with p10, p50, p90, mean, iterations
    """
    if probability <= 0 or total_impact <= 0:
        return {"p10": 0.0, "p50": 0.0, "p90": 0.0, "mean": 0.0, "iterations": iterations}

    p_low = max(0.001, probability * (1.0 - prob_uncertainty))
    p_high = min(0.99, probability * (1.0 + prob_uncertainty * 3))
    i_low = max(0.0, total_impact * (1.0 - impact_uncertainty))
    i_high = total_impact * (1.0 + impact_uncertainty)

    # Pre-allocate result list to avoid per-iteration allocations
    losses = [0.0] * iterations
    for i in range(iterations):
        p = random.triangular(p_low, p_high, probability)
        imp = random.triangular(i_low, i_high, total_impact)
        losses[i] = round(p * imp, 2)

    losses.sort()
    idx10 = max(0, int(iterations * 0.10) - 1)
    idx50 = max(0, int(iterations * 0.50) - 1)
    idx90 = max(0, min(iterations - 1, int(iterations * 0.90) - 1))

    return {
        "p10": round(losses[idx10], 2),
        "p50": round(losses[idx50], 2),
        "p90": round(losses[idx90], 2),
        "mean": round(statistics.mean(losses), 2),
        "iterations": iterations,
    }


def compute_expected_loss(probability: float, total_impact: float) -> float:
    """Direct point estimate (used as fallback when Monte Carlo is unavailable)."""
    return round(probability * total_impact, 2)


def compute_priority_score(expected_loss: float, fix_effort_hours: float) -> float:
    """Priority = expected loss per hour of fix effort."""
    if fix_effort_hours <= 0:
        return 0.0
    return round(expected_loss / fix_effort_hours, 2)


def compute_fix_cost(fix_effort_hours: float, engineer_hourly_cost: float) -> float:
    return round(fix_effort_hours * engineer_hourly_cost, 2)


def compute_roi(expected_loss: float, fix_cost: float) -> float:
    if fix_cost <= 0:
        return 0.0
    return round(expected_loss / fix_cost, 1)


def compute_risk_score(expected_loss: float, max_expected_loss: float) -> int:
    """Normalize expected loss to a 0-1000 scale relative to the max finding."""
    if max_expected_loss <= 0 or expected_loss <= 0:
        return 0
    ratio = expected_loss / max_expected_loss
    return min(1000, int(ratio * 1000))
