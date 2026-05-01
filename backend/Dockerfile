FROM python:3.11-slim

WORKDIR /app

# Non-root user setup
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install system dependencies + Trivy
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appuser . .

# Limit Semgrep memory to avoid OOM on low-memory servers (Render free = 512MB)
ENV SEMGREP_MAX_MEMORY=256

# Use the non-root user
USER appuser

# Expose the API port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
