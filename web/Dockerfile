
FROM node:20.11-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set API_URL for build time if needed (Next.js bakes env vars prefixed with NEXT_PUBLIC_)
# But we are using server-side rewrites, so it reads process.env at runtime.
RUN npm run build

FROM node:20.11-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
