# ==============================================================================
# Production Dockerfile for TimeForge Standalone Google Cloud Run Deployment
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json ./

# Install all dependencies needed for build
RUN npm install

# Copy application source files
COPY . .

# Build Vite frontend assets and bundle Express backend to dist/server.cjs
RUN npm run build

# ==============================================================================
# Runner stage (Minimal, hardened production container)
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package config and compiled distribution files
COPY package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Cloud Run automatically routes incoming traffic to $PORT (default: 8080)
EXPOSE 8080

# Run the bundled standalone server
CMD ["node", "dist/server.cjs"]
