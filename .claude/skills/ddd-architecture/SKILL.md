---
name: ddd-architecture
description: Arquitectura obligatoria de markbot — capas api, app, domain e infrastructure, qué puede importar a qué, dónde vive cada cosa y convenciones de nombres. Usar SIEMPRE antes de crear un fichero nuevo bajo src/, al mover código entre capas o al decidir dónde colocar una funcionalidad.
---

# Arquitectura de markbot

markbot sigue Domain-Driven Design con separación estricta de capas. La regla
que sostiene todo lo demás es la tabla de dependencias: si un import la rompe,
el código está en la capa equivocada.

```
src/
  api/              transporte: http/{controllers,middlewares,routes,types,openapi}
  app/              config.ts, casos de uso y puertos
  domain/           entidades y excepciones
  infrastructure/   db, auth, email, google, logging, queue, utils e integraciones externas
  scripts/          utilidades de línea de comandos
```

No hay `src/shared/`: la configuración está en `src/app/config.ts`, el logger en
`src/infrastructure/logging/` y las utilidades técnicas en `src/infrastructure/utils/`.

## 1. Dependencias permitidas

```
  api             →  app  →  domain
  infrastructure  →  domain
  infrastructure  →  app/ports        y solo app/ports: eso es un adaptador
  cualquiera      →  app/config, infrastructure/logging
```

Prohibido:

```
  domain  →  infrastructure     el dominio no sabe que existe una base de datos
  domain  →  api                ni que existe HTTP
  app     →  api                un caso de uso no conoce req ni res
  app     →  infrastructure     salvo config y logger; lo demás, por su puerto en app/ports
```

Un caso de uso depende de la **interfaz** declarada en `src/app/ports/`, no de su
implementación, y la recibe por el constructor. Así se prueba con dobles sin
levantar Postgres ni servicios externos.

No hay `container.ts`: el punto de composición son los controladores de
`src/api/http/controllers/`, que instancian las implementaciones de
`infrastructure` y se las pasan a los handlers. Es el único sitio donde `api`
toca `infrastructure`.

## 2. Qué va en cada capa

### `src/api/`

Controladores, rutas, middlewares (autenticación), tipos de entrada/salida y
OpenAPI. Solo transporte: leer la petición, invocar un caso de uso y dar forma a
la respuesta. La traducción de un error a código HTTP vive aquí.

**Sin lógica de negocio ni SQL.**

### `src/app/`

- `app/use-cases/<agregado>/{commands,queries}/`: un caso de uso por fichero.
- `app/ports/repositories/`: interfaces de persistencia y de servicios externos.
- `app/services/`: servicios de aplicación compartidos entre casos de uso.

El handler **orquesta**: ordena las llamadas y controla el flujo. No conoce
`req` ni `res` y no escribe SQL.

### `src/domain/`

Entidades, value objects y excepciones: el vocabulario del negocio.

- No importa nada de `api`, `app` ni `infrastructure`.
- **Sin `any`.**
- Sin `snake_case`: eso es forma de la base de datos o de una API externa.

### `src/infrastructure/`

Implementaciones de los puertos: repositorios Kysely, esquemas y mappers de BD,
clientes de APIs externas (Google, Pergamo…), correo, cola y logger. Aquí sí se
usa `snake_case` y tipos del driver.

Cada repositorio o adaptador trae su **mapper** entre la forma externa y la
entidad: la conversión ocurre en un sitio.

### `public/`

Recursos estáticos servidos por HTTP. Sin TypeScript, sin lógica, sin imports de `src/`.

## 3. Nombres

- Ficheros y carpetas en kebab-case. Las entidades y filas heredadas en
  PascalCase (`Document.ts`, `DocumentRow.ts`) se respetan; lo nuevo, en kebab-case.
- Clases e interfaces en PascalCase, **sin prefijo `I`**.
- Variables y funciones en camelCase; constantes de módulo en UPPER_SNAKE_CASE.
- Sufijos que dicen qué es cada cosa: `.command.ts`, `.query.ts`, `.handler.ts`,
  `.repository.ts`, `.mapper.ts`, `.controller.ts`, `.routes.ts`,
  `.middleware.ts`, `.util.ts`.

## 4. Imports con alias

`tsconfig.json` declara `@/*` → `src/*`. Se usa siempre para cruzar de capa;
dentro de la misma carpeta, import relativo.

## 5. Casos de uso

- Un caso de uso = **una clase** con un método `execute`.
- Commands y queries en carpetas separadas: un command cambia estado, una query no.
- Entrada tipada en `<accion>.command.ts` / `<accion>.query.ts`, lógica en `<accion>.handler.ts`.
- Dependencias por constructor, tipadas con sus puertos.

```ts
export class UploadDocumentHandler {
    constructor(private documents: DocumentRepository) {}
    async execute(command: UploadDocumentCommand): Promise<Document> { ... }
}
```

## 6. Modelos: dos, y no se mezclan

| | Ubicación | Puede |
|---|---|---|
| Fila de BD / respuesta externa | `src/infrastructure/db/schema/`, adaptador | `snake_case`, tipos del driver |
| Entidad de dominio | `src/domain/entities/` | camelCase, tipos propios, sin `any` |

Una fila **nunca** sale de `infrastructure`: lo que cruza hacia `app` es la
entidad, y la convierte el mapper.

## 7. Al añadir algo nuevo

En este orden:

1. ¿Qué concepto del negocio es? → entidad en `src/domain/`.
2. ¿Qué necesita del exterior? → interfaz en `src/app/ports/`.
3. ¿Qué hace? → caso de uso en `src/app/use-cases/`.
4. ¿Cómo se hace de verdad? → implementación en `src/infrastructure/`.
5. ¿Cómo se pide? → controlador y ruta en `src/api/http/`.

Para SQL, ver la skill `database-schema`.
