# Stage 1: Install dependencies
FROM node:26-alpine AS deps
RUN apk add --no-cache libc6-compat && npm install -g npm@latest
WORKDIR /app
COPY package.json package-lock.json* ./
# Copy scripts/ so prepare-husky.mjs can be found by npm ci's prepare hook.
# The script already exits 0 when .git is absent (Docker has no .git dir).
COPY scripts/ ./scripts/
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Stage 2: Build
FROM node:26-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME="ShamBit Admin"
ARG NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Production runner
FROM node:26-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="Shambit Admin Frontend" \
      org.opencontainers.image.description="Next.js Admin Dashboard" \
      org.opencontainers.image.vendor="Shambit Travels"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="::"

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

CMD ["node", "server.js"]
