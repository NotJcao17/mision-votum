# Misión Votum

Sistema de votaciones para los concursos culturales semestrales del **Colegio
Misión Montessori**. El admin configura eventos (categorías, equipos, jueces) y
los profesores (jueces) califican desde su celular durante el concurso. La app
calcula promedios y rankings por categoría, y exporta los resultados a Excel.

> **Escala esperada por evento:** ~40 equipos, ~15 jueces, 5–8 categorías
> (3 000–4 800 votos por evento, 2 eventos por año).

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | **Next.js 15** (App Router, React 19, Server Components + Server Actions) |
| Lenguaje | **TypeScript** |
| Estilos | **Tailwind CSS 3** (paleta "Mercado" — terracota/crema, fuentes Fraunces + Hanken Grotesk) |
| Base de datos | **PostgreSQL** en [Neon](https://neon.tech) (scale-to-zero, cold start ~500 ms) |
| ORM | **Prisma 6** |
| Autenticación | Custom — bcrypt para el admin, **AES-256-GCM** reversible para jueces (el admin necesita poder ver y reenviar contraseñas), JWT firmado con `jose` en cookie httpOnly |
| Email | **Gmail SMTP** vía `nodemailer` (sin dominio propio; remitente `misionvotum@gmail.com`) |
| Exportación Excel | **ExcelJS** en un Route Handler de Next.js |
| Hosting | **Vercel** (plan Hobby) |
| PWA | Manifest standalone (instalable en móvil, sin barra del navegador) |

---

## Cómo correrlo localmente

### Requisitos
- Node.js 20+
- npm
- Una base de datos PostgreSQL accesible (Neon es lo recomendado)
- Una cuenta Gmail con verificación en 2 pasos activada (para el envío de
  credenciales)

### 1. Clonar e instalar

```bash
git clone https://github.com/NotJcao17/mision-votum.git
cd mision-votum
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz copiando de `.env.example`:

```bash
cp .env.example .env
```

Llena los valores:

| Variable | Para qué | Cómo obtenerla |
|----------|----------|----------------|
| `DATABASE_URL` | Conexión pooled a Postgres | Neon dashboard → tu proyecto → "Connection string" (con pooler) |
| `DIRECT_URL` | Conexión directa para migraciones | El mismo string pero sin `-pooler` en el host |
| `ENCRYPTION_KEY` | Clave AES-256 (32 bytes en base64) | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `JWT_SECRET` | Firma de la cookie de sesión (32 bytes base64) | Igual que arriba con otro valor |
| `SMTP_USER` | Cuenta Gmail remitente | Ej. `misionvotum@gmail.com` |
| `SMTP_PASS` | "Contraseña de aplicación" de Google | https://myaccount.google.com/apppasswords (16 caracteres) |
| `APP_URL` | URL pública (opcional) | Para incluir un botón de login en los emails. Ej. `https://mision-votum.vercel.app` |
| `ADMIN_USERNAME` | Usuario del admin (solo seed) | Ej. `admin` |
| `ADMIN_PASSWORD` | Contraseña inicial del admin | La que quieras; se hashea con bcrypt al sembrar |

### 3. Migrar la base de datos y sembrar el admin

```bash
npx prisma migrate deploy   # aplica las migraciones existentes
npx prisma db seed          # crea/actualiza el admin con los valores del .env
```

> **Importante**: la contraseña del admin en texto plano solo vive en tu `.env`.
> En la BDD solo se guarda el hash. Si la pierdes, re-corre el seed con un
> nuevo `ADMIN_PASSWORD`.

### 4. Levantar

```bash
npm run dev          # http://localhost:3000
```

Inicia sesión con el `ADMIN_USERNAME` / `ADMIN_PASSWORD` que pusiste.

---


## Estructura del proyecto

```
app/
  (auth)/login/        # Pantalla de login (admin y juez en la misma)
  (auth)/logout/       # Route handler que borra la cookie
  admin/               # Área del admin (desktop, responsive)
    page.tsx           #   Dashboard con lista de eventos
    actions.ts         #   Server actions de eventos (crear, editar, estado)
    eventos/[id]/      #   Configuración del evento + nav a sub-pantallas:
      equipos/         #     · CRUD + importación masiva
      jueces/          #     · CRUD + credenciales + envío de emails
      progreso/        #     · Dashboard de avance
      resultados/      #     · Rankings por categoría
  api/eventos/[id]/exportar/   # Route handler que genera el .xlsx
  juez/                # Área del juez (mobile-first)
    page.tsx           #   Lista de equipos (pendientes / votados)
    equipos/[teamId]/  #   Pantalla de votación (chips de calificación)

components/ui/         # Componentes compartidos (Modal, ConfirmDialog,
                       # StatusBadge, Toast, Skeleton, íconos, etc.)
lib/
  auth/                # crypto (bcrypt + AES), JWT (jose), session helpers
  prisma.ts            # Singleton de PrismaClient
  events.ts            # Mapeo estado ES↔EventStatus, orden y progreso
  results.ts           # Cálculo de promedios y rankings por categoría
  excel.ts             # Construcción del workbook (hojas Resumen + Detalle)
  email.ts             # Transporter de Gmail SMTP y plantilla HTML

prisma/
  schema.prisma        # Modelo: Admin, Event, Category, Team, Judge, Vote
  seed.ts              # Script de seed del admin
  migrations/          # Migraciones SQL versionadas

middleware.ts          # Protege /admin y /juez por rol; redirige al login
public/                # Logos, manifest PWA
docs/                  # Espec del proyecto y mockups originales
```

---

## Funcionalidad

### Roles
- **Admin** (uno, creado por seed): configura eventos y consulta resultados.
- **Juez** (~15 por evento, creados por el admin): vota equipos desde su celular.

### Eventos
Cada evento tiene tres estados:

| Estado | Qué se puede hacer |
|--------|-------------------|
| **Borrador** | Admin configura todo. Jueces no entran. |
| **Activo** | Jueces votan. Categorías y rango bloqueados. Equipos y jueces aún editables. |
| **Cerrado** | Solo lectura. Admin puede exportar; jueces no pueden modificar votos. |

Devolver de Activo a Borrador borra todos los votos (confirmación fuerte).
Eliminar equipos/jueces con votos también pide confirmación fuerte.

### Flujo del admin (resumen)
1. Crea evento → configura datos, rango (ej. 1–5) y categorías.
2. Añade equipos (uno por uno o por importación masiva).
3. Añade jueces (uno por uno o por importación). El sistema genera username
   y contraseña automáticamente.
4. Envía credenciales por email (o las entrega manualmente — el admin puede
   verlas con el botón de ojo).
5. Cambia el evento a Activo cuando empieza el concurso.
6. Monitorea el progreso (refresca manualmente).
7. Cierra el evento al terminar.
8. Consulta resultados y exporta el archivo Excel.

### Flujo del juez
1. Inicia sesión con las credenciales recibidas.
2. Ve la lista de equipos: pendientes primero, ya votados después.
3. Selecciona un equipo y califica cada categoría con un chip (rango definido
   por el admin). Envía.
4. Puede regresar a un equipo y modificar su voto mientras el evento esté
   Activo.

### Exportación a Excel
- Botón "Exportar a Excel" en la pantalla de Resultados.
- Genera dos hojas:
  - **Resumen**: una fila por equipo con promedio + posición por cada
    categoría y promedio general.
  - **Detalle**: una fila por voto individual (auditoría).
- Nombre del archivo: `<slug-del-evento>.xlsx`.
