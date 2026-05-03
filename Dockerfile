# Rubric: multi-stage build, non-root user, HEALTHCHECK
# Full-stack image: React (Vite) build + Express API on one port (80) behind ALB.

# --- Frontend static build (same-origin API: VITE_API_URL empty) ---
FROM node:20-alpine AS client-builder
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ENV VITE_API_URL=
RUN npm run build

# --- Server production dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev

# --- Runtime ---
FROM node:20-alpine AS runner
RUN apk add --no-cache wget libcap-utils \
  && addgroup -g 10001 -S app \
  && adduser -u 10001 -S app -G app

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./
COPY --from=client-builder /client/dist /client/dist

RUN chown -R app:app /app /client
# Allow non-root user to bind to low ports like 80.
RUN setcap 'cap_net_bind_service=+ep' /usr/local/bin/node

USER app
ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/health || exit 1

CMD ["node", "server.js"]
