# FROM node:24-alpine3.22

# WORKDIR /app

# # Dependencias
# COPY package*.json ./
# RUN npm install

# # Código
# COPY . .
# RUN npm run build

# # Puerto interno del servicio (ajústalo por servicio)
# EXPOSE 4000

# # Comando dev (requiere script "dev" en package.json)
# CMD ["npm", "dev"]

# Stage 1: Compilación (Build)
FROM node:24-alpine3.22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Producción
FROM node:24-alpine3.22 AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 4003

CMD ["node", "dist/index.js"]

# Stage 3: Desarrollo
FROM node:24-alpine3.22 AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4003

CMD ["npm", "run", "dev"]
