---
trigger: always_on
---

# DDD Architecture Rules

Node.js + TypeScript

## 1. Arquitectura Obligatoria

El proyecto debe seguir una arquitectura basada en Domain-Driven Design
(DDD) con separación estricta de capas.

    src/
      api/
      app/
      domain/
      infrastructure/
      shared/

------------------------------------------------------------------------

## 2. Responsabilidades por Capa

### api/

-   Controllers
-   Routes
-   DTOs de entrada/salida
-   Validación de transporte
-   Autenticación / autorización
-   No contiene lógica de negocio

### app/

-   Commands y Queries
-   Handlers (Use Cases)
-   Orquestación de flujo
-   Interfaces (Ports) de repositorios
-   No contiene lógica de persistencia concreta

### domain/

-   Entidades
-   Value Objects
-   Agregados
-   Servicios de dominio
-   Eventos de dominio
-   Excepciones de dominio
-   No depende de api ni infrastructure

### infrastructure/

-   Implementaciones de repositorios
-   ORM / Query Builders
-   Esquemas de base de datos
-   Integraciones externas
-   Adaptadores técnicos

### shared/

-   Utilidades transversales
-   Tipos comunes
-   Result patterns
-   Helpers

------------------------------------------------------------------------

## 3. Convenciones de Nombres

### Carpetas

-   Usar kebab-case

### Archivos

-   Usar kebab-case

### Clases

-   Usar PascalCase

### Interfaces

-   Usar PascalCase
-   No usar prefijo I

### Variables y funciones

-   Usar camelCase

### Constantes globales

-   Usar UPPER_SNAKE_CASE

------------------------------------------------------------------------

## 4. Separación de Modelos

### Modelos de Base de Datos

Ubicación:

    infrastructure/db/schema

Reglas: - Pueden usar tipos específicos del ORM - Pueden usar
snake_case - Pueden usar tipos técnicos - No deben usarse directamente
en el dominio

### Modelos de Dominio

Ubicación:

    domain/

Reglas: - No deben depender de ORM - No deben usar tipos técnicos - No
usar any - No usar snake_case

------------------------------------------------------------------------

## 5. Casos de Uso

-   Un caso de uso = una clase
-   Separar Commands y Queries
-   Cada acción del negocio debe tener su propio Handler
-   El handler orquesta
-   La lógica de negocio vive en el dominio

------------------------------------------------------------------------

## 6. Dependencias Permitidas

Permitido:

    api → app→ domain
    infrastructure → domain

Prohibido:

    domain → infrastructure
    domain → api
    app → api

------------------------------------------------------------------------

## 7. Carpeta public/

Ubicación:

    public/

Contenido permitido: - HTML estático - Imágenes - Favicon - CSS -
Archivos descargables

Reglas: - No contiene código TypeScript - No contiene lógica de
negocio - No depende de ninguna capa - No importar desde src/

Diferenciación:

  Carpeta   Propósito
  --------- ---------------------------------------
  shared/   Código reutilizable interno
  public/   Recursos estáticos expuestos por HTTP

------------------------------------------------------------------------

Este documento define las reglas arquitectónicas obligatorias del
proyecto.