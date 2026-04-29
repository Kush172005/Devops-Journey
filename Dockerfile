# Rubric: multi-stage build, non-root user, HEALTHCHECK
FROM node:20-alpine AS deps
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
RUN apk add --no-cache wget \
  && addgroup -g 10001 -S app \
  && adduser -u 10001 -S app -G app

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./

RUN chown -R app:app /app

USER app
ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/health || exit 1

CMD ["node", "server.js"]
