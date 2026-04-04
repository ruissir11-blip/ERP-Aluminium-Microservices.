# ============================================================
#  AI Service Dockerfile — ERP Aluminium
#  FastAPI + Prophet + Statsmodels + Scikit-learn
# ============================================================

# ---------- Stage 1: Builder (compile heavy deps) ----------
FROM python:3.10-slim AS builder

WORKDIR /build

# Install build dependencies required by prophet, statsmodels, numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps into a virtual-env so we can copy it cleanly
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt


# ---------- Stage 2: Production (slim runtime) ----------
FROM python:3.10-slim AS production

WORKDIR /app

# Install only the runtime libs (no compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopenblas0 \
    liblapack3 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r aiservice && useradd -r -g aiservice -d /app -s /sbin/nologin aiservice

# Copy virtual-env from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy application code
COPY . .

# Create models directory for persisting trained models
RUN mkdir -p /app/models && chown -R aiservice:aiservice /app

# Switch to non-root user
USER aiservice

# Expose port 8000 (FastAPI)
EXPOSE 8000

# Healthcheck — verifies the /health endpoint responds
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
