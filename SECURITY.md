# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.x     | ✅ |
| < 3.0   | ❌ |

## Reporting a Vulnerability

CyberFinRisk is a security risk quantification tool — we take vulnerabilities seriously.

If you discover a security issue, **do not open a public issue**. Please report it privately:

- **Email**: [shadilrayyan2@gmail.com](mailto:shadilrayyan2@gmail.com)
- **PGP Key**: Available on request

You should receive a response within **48 hours**. If you don't, please follow up.

### What to include
- Type of vulnerability (XSS, SQLi, RCE, etc.)
- Steps to reproduce
- Affected versions
- Any potential impact or exploit scenario

### What to expect
1. Acknowledgment of receipt within 48 hours
2. Verification and impact assessment within 5 business days
3. A fix timeline communicated within 10 business days
4. Credit in release notes (if desired) once the fix is published

## Scope

The following are **in scope** for security reports:
- Backend API (`backend/`) — authentication, authorization, injection, data leakage
- Frontend application (`frontend/`) — XSS, CSRF, auth bypass, insecure data handling
- CI/CD pipeline (`/.github/workflows/`) — supply chain risks, secrets exposure
- Docker images — base image vulnerabilities, unnecessary components

The following are **out of scope**:
- Third-party scanner findings (Semgrep, Trivy) in sample/toy repositories
- Missing security headers on non-production deployments
- Rate limiting on personal/demo instances

## Hall of Fame

We maintain a [SECURITY.md](SECURITY.md) acknowledgments section. Contributors who report valid issues may be listed here (with permission).
