
FROM node:18-alpine


WORKDIR /app


COPY package*.json ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.ts ./


RUN npm ci


COPY . .

EXPOSE 5173


CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]