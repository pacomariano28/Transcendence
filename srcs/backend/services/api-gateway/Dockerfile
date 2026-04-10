FROM node:24-alpine3.22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY --chown=node:node . .
USER node
RUN npm run build

FROM node:24-alpine3.22 AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]

FROM node:24-alpine3.22 AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY --chown=node:node . .
USER node
EXPOSE 4000
CMD ["npm", "run", "dev"]
