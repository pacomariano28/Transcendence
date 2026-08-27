FROM node:24.15.0-alpine3.22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY --chown=node:node . .
USER node
RUN npm run build

FROM node:24.15.0-alpine3.22 AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 4001
CMD ["node", "dist/index.js"]

FROM node:24.15.0-alpine3.22 AS development
WORKDIR /app
COPY prisma ./prisma
COPY package*.json ./
RUN npm ci
# COPY --chown=node:node . .
RUN npx prisma generate
EXPOSE 4001
CMD ["npm", "run", "dev"]
