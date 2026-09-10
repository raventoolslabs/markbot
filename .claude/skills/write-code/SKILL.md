---
name: write-code
description: Convenciones obligatorias al escribir o modificar código en markbot — código en inglés, comentarios en español y breves — junto al flujo de git que envuelve la tarea (pull de development, rama de trabajo, push y PR). Usar SIEMPRE antes de crear o editar cualquier fichero de código, test, SQL, script o estilo, y al terminar la tarea.
---

# Escribir código en markbot

Dos partes, ambas obligatorias: el **flujo de git** que envuelve la tarea y las
**convenciones de escritura** de cada fichero que se toca.

## 1. Antes de escribir: preparar la rama

**Toda rama nace de `development` actualizado.** Nunca de `main` ni de otra rama
de trabajo.

```bash
git fetch origin
git rev-parse --abbrev-ref HEAD          # en qué rama estamos
```

Si no hay desarrollo empezado:

```bash
git checkout development
git pull --ff-only origin development
git checkout -b <tipo>/<descripcion-en-kebab-case>
```

Si la tarea continúa una rama abierta, se sigue en ella y se pone al día con
`git pull --ff-only origin development` (o `git rebase origin/development`). Con
cambios sin confirmar: `git stash push -u`, actualizar, `git stash pop`. No se
descarta trabajo ajeno sin preguntar.

Prefijos de rama: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/`, `ci/`.

## 2. Mientras se escribe

### El código, en inglés

Variables, funciones, clases, tipos, ficheros, rutas de URL, columnas y tablas,
claves de traducción, logs, mensajes de error internos, commits y PR.

### El texto de cara al usuario, fuera del código

La interfaz web no lleva literales en el JSX: el texto vive en
`web/utils/translations/{es,en}.ts`, con **clave en inglés**. Las respuestas del
bot al usuario final (chat, Google Chat) se escriben en español.

### Los comentarios, en español y breves

Se comenta el **porqué**, nunca el **qué**.

- Una o dos líneas.
- Nada de historia ("antes fallaba porque…"): eso es `git log`.
- Sin bloques decorativos, sin JSDoc que repita la firma, sin comentarios obvios.

Al editar un fichero se aplica también hacia atrás: el comentario redundante se recorta.

### Markdown y skills, en español

README, documentación y skills bajo `.claude/skills/` en español; los
identificadores que citan, tal cual están en el código.

## 3. Al terminar: subir y abrir PR

```bash
npm run lint
npx tsc --noEmit
npm test
git add -A && git commit
git push -u origin <rama>
```

PR **siempre contra `development`**:

```bash
gh pr list --head <rama> --state open        # comprobar si ya existe
gh pr create --base development --title "..." --body "..."
```

Si la PR ya existe, el push la actualiza. Título y cuerpo en inglés; el cuerpo
explica qué cambia y por qué, sin enumerar ficheros.
