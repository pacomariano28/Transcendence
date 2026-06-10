# srcs/backend/playlist-service/Dockerfile
FROM node:24.15.0-alpine3.22 AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY --chown=node:node . .
USER node
RUN npm run build

FROM node:24.15.0-alpine3.22 AS production
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 4004
CMD ["node", "dist/index.js"]

FROM node:24.15.0-alpine3.22 AS development
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
# en dev montamos el código desde volumen, por eso no copiamos el resto
EXPOSE 4004
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npx tsx prisma/seed.ts && npm run dev"]