# Misión Votum

Sistema de votaciones para concursos escolares. La especificación completa
está en `mision-votum-contexto.md` — es la fuente de verdad del proyecto.

## Cómo trabajar en este proyecto
- Sigue el documento de contexto FASE POR FASE (sección 17).
- NO avances a la siguiente fase hasta que yo apruebe la actual.
- Antes de codear cada fase, primero presenta un plan de esa fase y espera mi OK.
- Al terminar cada fase, ejecuta sus pruebas y haz un commit de git con
  un mensaje descriptivo (ej. "Fase 3: configuración de evento").

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL (Neon)
- Auth custom (bcrypt para admin, AES-256-GCM para jueces), JWT en cookie httpOnly
- Resend para emails, ExcelJS para exportación

## Convenciones
- Idioma de la interfaz y los textos: español (México).
- Vistas de juez: mobile-first. Vistas de admin: desktop responsive.
- Nunca commitear secretos (.env va en .gitignore).
- Mensajes de error claros y manejo de estados de carga en toda la app.

## Comandos
- Dev: `npm run dev`
- Migraciones: `npx prisma migrate dev`
- Seed admin: `npx prisma db seed`
