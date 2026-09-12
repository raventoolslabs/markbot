# Markbot

Bot diseñado para interactuar con un proyecto de Markdown.
Este proyecto consiste en un backend desarrollado en Node.js/Express y un frontend en Next.js.

## Características
- **Backend**: API REST en Express.js.
- **Frontend**: Aplicación Next.js para la página de inicio.

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
   - `GOOGLE_CLIENT_ID`: Client ID de OAuth2, para el login de usuarios con Google.

## Comandos

### Desarrollo
Para arrancar el entorno de desarrollo completo (Backend y Frontend):
```bash
npm run dev
```
Esto iniciará:
- Backend en puerto 6240 (reinicio automático con nodemon).
- Frontend en puerto 6241, publicado en `https://markbot.raventools.labs` por el proxy.

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
  - `/api`: Capa HTTP: rutas, controladores y middlewares.
  - `/app`: Casos de uso y configuración.
  - `/domain`: Entidades y excepciones.
  - `/infrastructure`: Base de datos, colas y servicios externos.
- `/web`: Código fuente del frontend (Next.js).
- `/tests`: Tests con Jest y Supertest.
