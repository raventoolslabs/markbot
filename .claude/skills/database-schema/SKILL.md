---
name: database-schema
description: Reglas del esquema SQL de markbot (PostgreSQL, esquema markbot, init.sql idempotente). Usar SIEMPRE al crear o modificar tablas, índices o claves foráneas, o al escribir consultas en un repositorio.
---

# Esquema de base de datos de markbot

El esquema completo vive en `src/infrastructure/db/scripts/sql/init.sql`. No hay
runner de migraciones: `managerDb.initialize()` ejecuta ese fichero en **cada
arranque**, así que toda sentencia tiene que ser idempotente
(`CREATE ... IF NOT EXISTS`, `DROP ... IF EXISTS`, `ALTER ... ADD COLUMN IF NOT EXISTS`).
Los tipos de fila de Kysely están en `src/infrastructure/db/schema/` y se
registran en `Database.ts`.

## Reglas

1. Todas las tablas dentro del esquema `markbot`. `CREATE SCHEMA IF NOT EXISTS markbot`
   va antes de la primera tabla.
2. Identificadores `VARCHAR(40)`.
3. Toda tabla incluye `created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP`.
4. Toda clave foránea con **nombre explícito** y **`ON DELETE` declarado**:
   `CASCADE` para dato derivado, `SET NULL` o `RESTRICT` para lo que no debe
   desaparecer solo.
5. Índice en toda clave foránea y en toda columna por la que se filtre.
6. Nunca un secreto en claro (API keys, tokens): solo hashes.
7. El estado va en columnas propias, nunca dentro de un JSONB `metadata`.
8. Sin `SELECT *` fuera de un repositorio, ni en ejemplos: columnas enumeradas.
9. SQL compatible con PostgreSQL.

Los documentos y su índice vectorial **no** viven aquí: son de Pergamo, y markbot
los consulta por su API.
