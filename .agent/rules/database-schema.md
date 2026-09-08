---
trigger: manual
---

# Database Schema Rules

Estas reglas aplican siempre al generar o modificar tablas SQL:

1. Todas las tablas deben crearse dentro del esquema `markbot`.
2. Usar `VARCHAR(40)` para IDs.
3. Todas las tablas deben incluir:
   - `created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP`
4. Todas las claves foráneas deben:
   - Tener nombre explícito
   - Definir comportamiento ON DELETE (CASCADE o SET NULL)
5. Nunca guardar secretos en texto plano (ej: api keys). Solo hashes.
6. Agregar índices en todas las claves foráneas.
7. No usar `SELECT *` en ejemplos de código.
8. El SQL debe ser compatible con PostgreSQL.