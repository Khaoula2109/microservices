
FROM node:18-alpine


WORKDIR /app


COPY package*.json ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.ts ./


RUN npm cache clean --force && npm install --legacy-peer-deps


COPY . .

EXPOSE 5173

# Clear Vite cache and start dev server
CMD ["sh", "-c", "rm -rf node_modules/.vite && npm run dev -- --host 0.0.0.0"]