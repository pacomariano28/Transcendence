<<<<<<< HEAD
FROM node:24.15.0-alpine3.22 AS builder
=======
FROM node:24-alpine3.22 AS builder
>>>>>>> main
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY --chown=node:node . .
USER node
RUN npm run build

<<<<<<< HEAD
FROM node:24.15.0-alpine3.22 AS production
=======
FROM node:24-alpine3.22 AS production
>>>>>>> main
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 5173
# CMD ["npm", "run", "build"]

<<<<<<< HEAD
FROM node:24.15.0-alpine3.22 AS development
=======
FROM node:24-alpine3.22 AS development
USER node
>>>>>>> main
WORKDIR /app
COPY package*.json ./
RUN npm ci
# COPY --chown=node:node . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
