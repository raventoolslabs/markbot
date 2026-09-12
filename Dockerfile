# Build stage
FROM node:24-slim AS builder

WORKDIR /usr/src/app

# Install dependencies for native modules if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Dependencies
COPY package*.json ./
RUN npm ci

# Source
COPY . .

# Build
RUN npx tsc && \
    npx tsc-alias && \
    mkdir -p dist/infrastructure/db/scripts && \
    cp -r src/infrastructure/db/scripts/sql dist/infrastructure/db/scripts/

# Production image
FROM node:24-slim

WORKDIR /usr/src/app

# Install production runtime dependencies if needed (e.g. openssl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist
# Copy infrastructure scripts if needed
# The build script does: cp -r src/infrastructure/db/scripts/sql dist/infrastructure/db/scripts/

EXPOSE 6240

CMD ["node", "dist/app/index.js"]
