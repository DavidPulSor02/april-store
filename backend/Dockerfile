# Usar una imagen de Node.js oficial
FROM node:18-slim

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código del backend
COPY . .

# Exponer el puerto configurado (3000 por defecto)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
