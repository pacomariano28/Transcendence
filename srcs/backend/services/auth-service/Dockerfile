#Stage 1: Builder
# Instala deps + compilar ts a js en el dist/

FROM node:24-alpine3.22 AS builder
# Trabajamos en el directorio /app que lo genera
WORKDIR /app

# Copiamos el package.json y el package-lock.json para instalar las dependencias en el /app
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copiamos el resto del código fuente al contenedor
COPY . .

# Compilamos el código TypeScript a JavaScript en el directorio dist/
RUN npm run build

#################################################

#Stage 2: production
# Así es como se usará en producción
# Instala deps y copia el ejecutable de dist/ y lo ejecutamos con node. Ejecuta el archivo compilado ya.

FROM node:24-alpine3.22 AS production
WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

# Copiamos solo el código compilado de dist/ al contenedor
COPY --from=builder /app/dist ./dist

# Exponemos el puerto en el que la aplicación se ejecutará
EXPOSE 4002

# Comando para ejecutar la aplicación en producción
CMD ["node", "dist/index.js"]

#################################################


#Stage 3: development
# Con este stage trabajaremos nosotros en desarrollo ( es + rapido )
# Instala deps + copia codigo ( no compila ) y ejecuta npm run dev

FROM node:24-alpine3.22 AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4002

CMD ["npm", "run", "dev"]