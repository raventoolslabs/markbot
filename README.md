# Markbot

Bot diseñado para interactuar con un proyecto de Markdown y Google Chat. 
Este proyecto consiste en un backend desarrollado en Node.js/Express y un frontend en Next.js.

## Características
- **Backend**: API REST en Express.js con integración para Google Chat.
- **Frontend**: Aplicación Next.js para la página de inicio.
- **Integración**: Configurado para desarrollo con `bocaltunnel` (via `lt`) para exponer el servidor localmente a Google Chat.

## Requisitos previos
- Node.js (v18 o superior recomendado)
- npm

## Configuración

1. Instalación de dependencias:
   ```bash
   npm install
   ```

2. Configuración de variables de entorno:
   Copia el archivo `.env.example` a `.env` y rellena los valores necesarios.
   ```bash
   cp .env.example .env
   ```
   Variables clave:
   - `PORT`: Puerto del backend (6240).
   - `APP_HOST`: URL base para callbacks (ej. `https://tu-tunnel.loca.lt`).
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Credenciales OAuth2.
   - `SPACE_ID`: ID del espacio de Google Chat.

## Comandos

### Desarrollo
Para arrancar el entorno de desarrollo completo (Backend, Frontend y Tunnel):
```bash
npm run dev
```
Esto iniciará:
- Backend en puerto 6240 (reinicio automático con nodemon).
- Frontend en puerto 6241, publicado en `https://markbot.raventools.labs` por el proxy.
- Túnel local exponiendo el puerto 6240 a internet.

### Producción
Para compilar y arrancar en modo producción:
```bash
npm run build
npm start
```
- `npm run build`: Compila el TypeScript del backend y construye la aplicación Next.js.
- `npm start`: Ejecuta el backend (puerto 6240) y el frontend (puerto 6241) concurrentemente.

### Tests
Para ejecutar los tests unitarios y de integración:
```bash
npm test
```

## Estructura del Proyecto
- `/src`: Código fuente del backend (Express).
  - `/modules`: Módulos de la aplicación (ej. Google Chat).
  - `/routes`: Definición de rutas base.
- `/web`: Código fuente del frontend (Next.js).
- `/tests`: Tests con Jest y Supertest.
