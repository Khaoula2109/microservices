FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
# Ne PAS copier .env
COPY src ./src
COPY *.js ./

FROM node:18-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/*.js ./

# S'assurer qu'il n'y a PAS de .env
RUN rm -f .env

USER appuser

EXPOSE 3000
CMD ["node", "src/server.js"]
