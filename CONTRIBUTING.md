# Contributing to CyberFinRisk

Thanks for your interest! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/cyberfinrisk.git`
3. Set up the development environment (see [README.md](README.md#quick-start))
4. Create a feature branch: `git checkout -b feat/your-feature`

## Development Workflow

```bash
# Install all dependencies
make install

# Run linter
make lint

# Run tests
make test

# Run everything before pushing
make check
```

## Code Conventions

- **Python**: Follow ruff rules (configured in `pyproject.toml`). Run `ruff check .` before committing.
- **TypeScript/React**: Follow ESLint + Prettier config in `frontend/`. Run `npm run lint` and `npm run prettier`.
- **Commit messages**: Use [conventional commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- **Tests**: New features must include tests. Fixes must not break existing tests.

## Pre-commit Hooks

We use pre-commit hooks to catch issues early:

```bash
pip install pre-commit
pre-commit install
```

## Pull Request Process

1. Ensure your code passes all CI checks (lint, test, build)
2. Update documentation if you change any public API or behavior
3. Add a changelog entry if applicable
4. Request review from a maintainer
5. Squash commits before merging

## Project Structure

```
backend/        — FastAPI + risk engine (Python)
frontend/       — Next.js dashboard (TypeScript)
tests/          — Pytest suite (backend)
helm/           — Kubernetes deployment
monitoring/     — Prometheus + Grafana + OpenTelemetry
```

## Code of Conduct

Be respectful, constructive, and inclusive. Harassment of any kind will not be tolerated.
