FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

RUN addgroup -S -g 1001 nestuser && adduser -S -u 1001 -G nestuser -s /sbin/nologin -D nestuser

COPY --from=builder /app/package*.json ./
RUN chown -R nestuser:nestuser /app
USER nestuser

RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/templates ./src/templates

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]