# ============================================================
#  Stage 1: Builder — compile TypeScript
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm install --save-dev typescript ts-node \
 && npx tsc --build \
 || true

# ============================================================
#  Stage 2: Production — minimal runtime image
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production

EXPOSE 5001

USER nodejs

# Healthcheck uses the /health route defined directly on the app (no /api/v1/hr prefix)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --spider -q http://localhost:5001/health || exit 1

CMD ["node", "dist/app.js"]

# ============================================================
#  Stage 3: Development — hot-reload with ts-node-dev
# ============================================================
FROM node:20-alpine AS development

WORKDIR /app

# Install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm install

# Install ts-node-dev globally for hot reload
RUN npm install -g ts-node-dev

COPY tsconfig.json ./
COPY src ./src

EXPOSE 5001

# Healthcheck works the same way in dev mode
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD wget --spider -q http://localhost:5001/health || exit 1

CMD ["ts-node-dev", "--respawn", "--transpile-only", "--exit-child", "src/app.ts"]