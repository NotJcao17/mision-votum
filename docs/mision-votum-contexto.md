# Misión Votum — Documento de Contexto del Proyecto

> Documento de especificación para implementación con Claude Code.
> Sistema de votaciones para concursos escolares del Colegio Misión Montessori.

---

## 1. Resumen ejecutivo

**Misión Votum** es una aplicación web para gestionar las votaciones de los concursos semestrales del Colegio Misión Montessori. En estos concursos (por ejemplo "Cook the World" y "Landmark"), equipos de alumnos presentan un trabajo (comida representativa de un país, maqueta de un monumento, etc.) y un grupo de profesores (jueces) los califica en distintas categorías.

El sistema reemplaza el método anterior (un formulario simple) y añade control de quién ha votado, gestión de jueces con credenciales, cálculo automático de resultados y exportación de datos.

**Escala esperada por evento:** ~40 equipos, ~15 jueces, 5-8 categorías. Esto genera entre 3,000 y 4,800 votos por evento. Se realizan 2 eventos al año. El volumen de datos es muy bajo.

---

## 2. Usuarios del sistema

Existen exactamente **dos roles**:

### Administrador
- Una sola persona. Se crea directamente en la base de datos mediante un script de seed (no hay registro público).
- Configura los eventos, gestiona categorías, equipos y jueces, monitorea el progreso de votación y consulta/exporta resultados.
- Trabaja principalmente desde computadora.

### Juez (profesor)
- Múltiples por evento (~15). Son creados por el administrador.
- Cada juez pertenece a **un evento específico** (los jueces no se reutilizan entre eventos; si el mismo profesor participa en dos eventos, tendrá dos cuentas independientes).
- Vota a los equipos desde su **celular** mientras camina por el evento.
- Puede ver qué equipos ya votó y cuáles le faltan, y modificar sus votos mientras el evento esté activo.

---

## 3. Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | **Next.js 15** (App Router) | Frontend + backend unificados (Server Actions / Route Handlers) |
| Lenguaje | **TypeScript** | |
| Base de datos | **Neon** (PostgreSQL serverless) | Scale-to-zero con wake automático (~500ms). No requiere reactivación manual. |
| ORM | **Prisma** | |
| Autenticación | **Custom** | Sin librerías pesadas. JWT en cookie httpOnly. |
| Emails | **Resend** | Sin dominio propio inicialmente (envío desde dominio de Resend). |
| Hosting | **Vercel** (plan Hobby) | No se duerme. Uso no comercial. |
| Exportación Excel | **ExcelJS** | Generación de .xlsx en el servidor. |
| Estilos | Tailwind CSS | Mobile-first para vistas de juez. |

### Justificación de decisiones clave
- **Neon en vez de Supabase:** Supabase free pausa proyectos tras 7 días de inactividad y, tras 90 días pausado, libera la URL del proyecto. Con eventos cada 6 meses esto sería un problema recurrente. Neon despierta automáticamente al primer request sin intervención manual.
- **Auth custom:** Solo hay 1 admin y los jueces usan contraseñas de baja sensibilidad con cifrado reversible (requisito de negocio). Una librería de auth completa sería sobreingeniería.

---

## 4. Modelo de datos (Prisma schema)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum EventStatus {
  DRAFT    // Borrador: todo editable, jueces no pueden entrar
  ACTIVE   // Activo: jueces votan; categorías y rango bloqueados; equipos/jueces solo se pueden añadir o eliminar (no modificar estructura crítica)
  CLOSED   // Cerrado: solo lectura y exportación
}

model Admin {
  id           String   @id @default(cuid())
  username     String   @unique         // login del admin (no usa email)
  email        String?                  // opcional, reservado para recuperación futura
  passwordHash String   // bcrypt
  createdAt    DateTime @default(now())
}

model Event {
  id          String      @id @default(cuid())
  name        String
  description String?
  eventDate   DateTime?
  minScore    Int         @default(1)
  maxScore    Int         @default(5)
  status      EventStatus @default(DRAFT)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  categories  Category[]
  teams       Team[]
  judges      Judge[]
  votes       Vote[]
}

model Category {
  id        String   @id @default(cuid())
  eventId   String
  name      String
  order     Int      @default(0)
  createdAt DateTime @default(now())

  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  votes     Vote[]

  @@index([eventId])
}

model Team {
  id        String   @id @default(cuid())
  eventId   String
  name      String
  createdAt DateTime @default(now())

  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  votes     Vote[]

  @@index([eventId])
}

model Judge {
  id                String   @id @default(cuid())
  eventId           String
  name              String
  username          String   @unique          // único globalmente, autogenerado
  email             String?
  passwordEncrypted String                     // AES-256-GCM, base64
  passwordIv        String                     // IV del cifrado, base64
  passwordAuthTag   String                     // authTag del GCM, base64
  createdAt         DateTime @default(now())

  event             Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  votes             Vote[]

  @@index([eventId])
}

model Vote {
  id         String   @id @default(cuid())
  eventId    String
  judgeId    String
  teamId     String
  categoryId String
  score      Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  event      Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  judge      Judge    @relation(fields: [judgeId], references: [id], onDelete: Cascade)
  team       Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  // Un juez solo puede tener un voto por equipo+categoría. Re-votar = update.
  @@unique([judgeId, teamId, categoryId])
  @@index([eventId])
}
```

### Notas sobre el modelo
- **Cascadas (`onDelete: Cascade`):** al borrar un evento se borra todo lo asociado. Al borrar un juez/equipo/categoría se borran sus votos automáticamente. Esto permite la eliminación con confirmación reforzada descrita en la lógica de negocio.
- **`@@unique([judgeId, teamId, categoryId])`:** garantiza que un juez no pueda tener votos duplicados. Cambiar un voto es un `update`, no un `insert`.
- **`username` único global:** simplifica el login unificado. Se autogenera a partir del nombre (ej: `juan.perez`, y si colisiona `juan.perez2`).
- **Todas las categorías aplican a todos los equipos.** No hay relación equipo-categoría; el cruce ocurre en los votos.

---

## 5. Lógica de negocio

### 5.1 Estados del evento y permisos de edición

| Recurso | DRAFT (Borrador) | ACTIVE (Activo) | CLOSED (Cerrado) |
|---------|------------------|-----------------|------------------|
| Datos generales del evento (nombre, fecha) | Editable | Editable | Solo lectura |
| Rango de calificación (min/max) | Editable | **Bloqueado** | Solo lectura |
| Categorías | CRUD completo | **Bloqueado** (no añadir/modificar/eliminar) | Solo lectura |
| Equipos | CRUD completo | Añadir / eliminar permitido; modificar permitido | Solo lectura |
| Jueces | CRUD completo | Añadir / eliminar permitido; modificar permitido | Solo lectura |
| Votación de jueces | No disponible | **Disponible** | Bloqueada |

- El admin cambia el estado manualmente (Borrador → Activo → Cerrado, y puede reabrir Cerrado → Activo).
- **Devolver de Activo a Borrador** borra todos los votos del evento. Debe requerir confirmación fuerte (texto tipo: "Esto eliminará los X votos registrados. Escribe 'borrador' para confirmar").
- El rango de calificación se bloquea en Activo porque cambiarlo invalidaría votos existentes.
- Las categorías se bloquean en Activo porque modificarlas dejaría votos huérfanos o inconsistentes.

### 5.2 Eliminación de jueces y equipos
- Si el juez/equipo **no tiene votos asociados:** confirmación simple ("¿Eliminar a Juan Pérez?").
- Si **sí tiene votos asociados:** confirmación reforzada que indica cuántos votos se borrarán y requiere escribir una palabra de confirmación. La eliminación es en cascada (borra el juez/equipo y sus votos).

### 5.3 Cálculo de resultados
- **Promedio por equipo y categoría:** suma de los `score` de esa categoría para ese equipo, dividida entre el número de votos recibidos en esa categoría.
- El promedio se calcula **solo con los votos disponibles** (no es obligatorio que todos los jueces voten por todos los equipos).
- **Ganador por categoría:** el equipo con el promedio más alto en esa categoría.
- **Ranking:** se ordena por promedio dentro de cada categoría.
- **No hay ganador general** (decisión explícita; descartado del alcance).
- Los promedios también se usan para calificar a los alumnos, por lo que el admin debe poder ver el detalle por equipo y exportarlo.

### 5.4 Modificación de votos
- Un juez puede cambiar cualquiera de sus votos mientras el evento esté **Activo**.
- Cuando el evento pasa a **Cerrado**, los votos se congelan.
- La pantalla de votación se usa tanto para votar por primera vez como para modificar (carga los valores previos si existen).

### 5.5 Acciones destructivas y protecciones
Como los datos son calificaciones reales de alumnos, toda acción que pueda borrar votos requiere protección. La regla: nada se bloquea por completo (siempre puede haber una corrección legítima), pero todo lo que toque votos exige **confirmación fuerte** (escribir una palabra o el nombre del recurso, no solo un "¿estás seguro?").

| Acción | Qué borra | Protección |
|--------|-----------|-----------|
| Borrar evento en Borrador | Nada valioso (sin votos) | Confirmación simple |
| Borrar evento en Activo o Cerrado | El evento completo y todos sus votos | Confirmación fuerte (escribir el nombre del evento) |
| Devolver evento de Activo a Borrador | Todos los votos del evento | Confirmación fuerte (escribir "borrador") |
| Borrar juez/equipo con votos asociados | Sus votos (cascada) | Confirmación fuerte (indicar cuántos votos se borran) |
| Borrar juez/equipo sin votos | Nada | Confirmación simple |
| Regenerar contraseña de un juez | Invalida la contraseña anterior (no borra votos) | Confirmación simple |

---

## 6. Autenticación

### 6.1 Login unificado
- Una sola pantalla de login con campos **usuario** y **contraseña**.
- El sistema primero intenta validar contra la tabla `Admin` (comparando con el `username`). Si no coincide, busca en `Judge` por `username`.
- Tras validar, se emite un **JWT firmado** guardado en una **cookie httpOnly** con el rol (`admin` o `judge`), el id y (para jueces) el `eventId`.
- Middleware de Next.js protege las rutas según el rol.

### 6.2 Contraseña del admin
- Almacenada con **bcrypt** (hash, no reversible). Es la cuenta más sensible.
- Se crea con un script de seed (ver sección de despliegue).

### 6.3 Contraseñas de jueces (cifrado reversible)
- Requisito de negocio: el admin debe poder **ver** la contraseña de un juez para entregársela en persona o por mensaje si el email no llega o el juez no tiene correo.
- Se usa **AES-256-GCM** con una **clave maestra** (`ENCRYPTION_KEY`) guardada en variables de entorno de Vercel.
- Al crear un juez:
  1. Se genera una contraseña aleatoria legible (ej. 8 caracteres, evitando caracteres ambiguos como `0/O`, `1/l/I`).
  2. Se genera un `username` único a partir del nombre.
  3. Se cifra la contraseña (se guardan `passwordEncrypted`, `passwordIv`, `passwordAuthTag`).
- **El envío de credenciales NO es automático.** Crear un juez nunca dispara un correo. El admin envía credenciales de forma explícita mediante los botones "Enviar credenciales" (individual) o "Enviar credenciales a todos".
- Para el login del juez, el servidor descifra la contraseña almacenada y la compara con la ingresada.
- En la pantalla de gestión de jueces, el admin puede ver la contraseña descifrada de cada juez (operación realizada en el servidor).
- **Riesgo aceptado:** si la BDD se filtrara, las contraseñas no son legibles sin la clave maestra (que vive en otro lado). Son credenciales de baja sensibilidad por diseño.

> **Nota de implementación:** la clave maestra debe ser de 32 bytes. Generarla una vez con `openssl rand -base64 32` y guardarla como `ENCRYPTION_KEY` en Vercel y en `.env` local. Nunca commitearla.

---

## 7. Pantallas (9 en total)

### Públicas / Login
1. **Login unificado** — campos usuario + contraseña. Detecta rol y redirige.

### Administrador (desktop, responsive)
2. **Dashboard principal** — lista de eventos con su estado (Borrador / Activo / Cerrado) y botón "Nuevo evento".
3. **Configuración de evento** — datos generales (nombre, fecha, descripción), rango de calificación (min/max), y **gestión de categorías** integrada en la misma pantalla (lista editable). Los controles se bloquean según el estado del evento.
4. **Gestión de equipos** — lista CRUD + botón "Importar lote" (modal con textarea, un equipo por línea).
5. **Gestión de jueces** — lista CRUD + importación masiva (formato `nombre, email` por línea) + ver contraseña de cada juez + botón "Reenviar credenciales" individual + botón "Enviar credenciales a todos".
6. **Dashboard de progreso del evento activo** — porcentaje global de votación completada; lista de jueces con su progreso individual (ej. "Juan Pérez: 22/40 equipos · 55%"); visibilidad de qué equipos están incompletos. Se actualiza al refrescar (no requiere tiempo real / websockets).
7. **Resultados del evento** — tabla con promedios por categoría, ranking por categoría, y botón "Exportar a Excel". Disponible tanto en estado **Activo** (resultados parciales que se actualizan al refrescar conforme llegan votos) como en **Cerrado** (resultados finales).

### Juez (mobile-first)
8. **Pantalla principal del juez** — lista de equipos con estado visual (Votado / Pendiente).
9. **Pantalla de votación** — formulario con un input/slider por categoría (rango según el evento). Sirve para votar por primera vez (vacío) o modificar (precargado). Tras enviar muestra confirmación visual (toast/banner) y vuelve a la lista. Objetivo de UX: enviar un voto en máximo 3 toques.

> Los mockups de diseño se generarán por separado (Google Stitch) y se anexarán como imágenes. El único requisito temático es que el tema visual sea claro/legible.

---

## 8. Flujos principales

### 8.1 Flujo del administrador (preparar un evento)
1. Inicia sesión.
2. Crea un nuevo evento (queda en estado Borrador).
3. Configura datos generales y rango de calificación.
4. Agrega las categorías (ej. las 6 del concurso).
5. Agrega los equipos (individual o por importación masiva).
6. Agrega los jueces (individual o por importación masiva). El sistema genera usuario y contraseña y, si hay email, los envía.
7. (Opcional) Revisa/reenvía credenciales.
8. Cambia el evento a **Activo** cuando empieza el concurso.
9. Monitorea el progreso en el dashboard (refrescando).
10. Cambia el evento a **Cerrado** cuando todos terminan.
11. Consulta resultados y exporta a Excel.

### 8.2 Flujo del juez (votar)
1. Recibe sus credenciales (email o entregadas por el admin) y un link/QR a la app.
2. Inicia sesión.
3. Ve la lista de equipos (pendientes y votados).
4. Selecciona un equipo, asigna puntuación en cada categoría, envía.
5. Repite hasta completar todos los equipos.
6. Puede volver a un equipo ya votado y modificar su puntuación mientras el evento esté activo.

---

## 9. Exportación a Excel

- Implementada con **ExcelJS** en el servidor (Route Handler, ej. `GET /api/events/[id]/export`).
- El navegador descarga un archivo `.xlsx`.
- **Dos hojas:**
  - **Resumen:** una fila por equipo. Columnas: nombre del equipo, promedio por cada categoría, y posición/ranking. (Útil para calificar alumnos y como respaldo de datos, dado que Neon free no tiene backups automáticos.)
  - **Detalle:** una fila por voto individual. Columnas: equipo, categoría, juez, puntuación, fecha/hora.
- Nombre de archivo sugerido: `{nombre-evento}.xlsx`.

---

## 10. Envío de emails (Resend)

- Se usa para enviar credenciales a los jueces.
- **Sin dominio propio inicialmente:** los correos salen desde un dominio de Resend (ej. `onboarding@resend.dev`). Advertir a los jueces que revisen spam.
- **El envío es siempre manual e intencional.** Crear un juez no envía ningún correo; el admin decide cuándo enviar.
- Acciones que disparan email (todas iniciadas por el admin con un botón explícito):
  - "Enviar credenciales" (individual) → envía usuario + contraseña a ese juez.
  - "Enviar credenciales a todos" → envía a todos los jueces del evento que tengan email registrado.
- **La `RESEND_API_KEY` es obligatoria** para que la función de envío opere. Sin ella, la app funciona con normalidad pero los botones de envío fallarán; en ese caso el admin entrega las credenciales manualmente (puede verlas en la pantalla de gestión de jueces).
- Si Resend reporta problemas de entregabilidad en el primer evento, se puede verificar un dominio propio después (sin cambios de código, solo cambia el remitente).

---

## 11. Requisitos no funcionales

- **Mobile-first** en las vistas de juez (pantallas 8 y 9). El admin puede ser desktop pero responsive.
- **Manejo de errores de red:** mostrar mensajes claros cuando la app no pueda conectar o cargar (no fallar en silencio). Especialmente relevante porque la BDD (Neon) puede tener un cold start de ~500ms tras inactividad larga.
- **Idioma:** español (México). Toda la interfaz y mensajes.
- **Sin tiempo real:** el dashboard de progreso se actualiza al refrescar; no se requieren websockets.
- **Sin registro público:** el admin se crea por seed; los jueces solo por el admin.
- **Privacidad de resultados:** los resultados solo son visibles para el admin (no hay vista pública).
- **Historial:** los eventos no se borran automáticamente; quedan disponibles para consulta posterior.

---

## 12. Variables de entorno

```bash
# Base de datos (Neon)
DATABASE_URL="postgresql://..."

# Cifrado reversible de contraseñas de jueces (32 bytes, base64)
ENCRYPTION_KEY="..."   # generar con: openssl rand -base64 32

# Firma de sesiones JWT
JWT_SECRET="..."       # generar con: openssl rand -base64 32

# Resend
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="onboarding@resend.dev"   # o dominio propio si se verifica después

# Seed del admin (usado solo por el script de seed)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="..."   # contraseña inicial del admin; se hashea con bcrypt al sembrar
```

---

## 13. Despliegue (paso a paso)

1. **Neon:** crear cuenta y un proyecto PostgreSQL. Copiar el connection string a `DATABASE_URL`.
2. **Resend:** crear cuenta, obtener API key. (Opcional) verificar dominio más adelante.
3. **Repositorio:** crear repo en GitHub con el proyecto.
4. **Vercel:** importar el repo, configurar todas las variables de entorno de la sección 12.
5. **Migraciones:** ejecutar `npx prisma migrate deploy` (o `migrate dev` en local) para crear el esquema en Neon.
6. **Seed del admin:** ejecutar el script de seed (`npx prisma db seed`) que crea el registro de `Admin` con la contraseña hasheada a partir de `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
7. **Deploy:** Vercel hace build y publica. La app queda lista.
8. Verificar login del admin y crear un evento de prueba.

> El plan Hobby de Vercel es para uso no comercial; una herramienta interna del colegio sin fines de lucro cumple esta condición.

---

## 14. Casos límite y consideraciones

- **Promedio con votos parciales:** si no todos los jueces votaron a un equipo, el promedio usa solo los votos existentes. Mostrar también cuántos votos componen cada promedio puede ser útil.
- **Cold start de Neon:** tras 6 meses sin uso, el primer request del admin puede tardar ~500ms extra. Manejar con un estado de carga; no es un error.
- **Colisión de usernames:** al autogenerar, si `juan.perez` existe, usar `juan.perez2`, etc.
- **Importación masiva con líneas mal formateadas:** validar y mostrar qué líneas fallaron antes de confirmar la importación; no importar parcialmente sin avisar.
- **Reabrir un evento cerrado:** permitido (Cerrado → Activo). Devolver a Borrador desde Activo borra votos (con confirmación fuerte).
- **Juez sin email:** se permite crearlo; simplemente no se envía correo y el admin le entrega las credenciales manualmente (puede verlas en la pantalla de gestión).

---

## 15. Fuera de alcance (posibles mejoras futuras)

- Registro de estudiantes por equipo (descartado del MVP; no afecta las votaciones).
- Ganador general por promedio de promedios (descartado; se puede añadir después si se requiere).
- Tiempo real con websockets (el refresco manual es suficiente).
- Vista pública de resultados para estudiantes.
- Múltiples administradores.
- Dominio de correo personalizado (se evaluará tras el primer evento según entregabilidad).

---

## 16. Resumen de decisiones tomadas

- Nombre: **Misión Votum**
- Stack: Next.js 15 + Neon (Postgres) + Prisma + Resend + Vercel, auth custom.
- 2 roles: 1 admin (bcrypt, por seed) y jueces por evento (cifrado reversible AES-256-GCM).
- Login unificado.
- Eventos con 3 estados: Borrador / Activo / Cerrado.
- Categorías y rango bloqueados en Activo; equipos y jueces editables (añadir/eliminar/modificar).
- Todas las categorías aplican a todos los equipos.
- Rango de calificación configurable por evento (este concurso: 1 a 5, con 6 categorías).
- Ganador por categoría con promedio simple. Sin ganador general.
- Votos modificables mientras el evento esté activo.
- Importación masiva de equipos y jueces (textarea, una entrada por línea).
- Exportación a Excel (hojas Resumen + Detalle) con ExcelJS.
- Mobile-first para vistas de juez.
- Idioma español. Resultados privados (solo admin). Eventos no se borran.

---

## 17. Plan de implementación por fases

Implementar el proyecto de forma incremental. **Al terminar cada fase se realizan pruebas para verificar que esa parte funciona antes de avanzar a la siguiente.** No avanzar a la fase siguiente con la anterior sin probar.

### Fase 0 — Setup base
- Inicializar Next.js 15 (App Router) + TypeScript + Tailwind CSS.
- Configurar Prisma y la conexión a Neon.
- Crear el `schema.prisma` (sección 4) y correr la migración inicial.
- Crear el script de seed del admin.
- **Prueba:** la app levanta, la migración crea las tablas en Neon, el seed crea el admin y se puede consultar la BDD.

### Fase 1 — Autenticación
- Utilidades de cifrado: bcrypt (admin) y AES-256-GCM (jueces).
- Login unificado (usuario + contraseña) con detección de rol.
- JWT en cookie httpOnly y middleware de protección de rutas.
- **Prueba:** el admin inicia sesión y accede a rutas protegidas; un usuario no autenticado es redirigido al login.

### Fase 2 — Gestión de eventos
- CRUD de eventos y transiciones de estado (Borrador / Activo / Cerrado).
- Dashboard principal del admin (lista de eventos con su estado).
- **Prueba:** crear, editar, listar eventos y cambiar su estado correctamente.

### Fase 3 — Configuración de evento (datos + categorías)
- Pantalla de configuración: datos generales, rango de calificación y gestión de categorías integrada.
- Aplicar bloqueos según el estado del evento (sección 5.1).
- **Prueba:** configurar un evento completo en Borrador; verificar que los bloqueos se aplican al pasar a Activo.

### Fase 4 — Gestión de equipos
- CRUD de equipos + importación masiva (textarea, uno por línea) con validación.
- **Prueba:** crear equipos individuales y por lote; verificar el manejo de líneas mal formateadas.

### Fase 5 — Gestión de jueces
- CRUD de jueces con generación de `username` único y contraseña cifrada (AES).
- Importación masiva (`nombre, email` por línea).
- Ver contraseña descifrada en pantalla.
- **Prueba:** crear jueces, verificar unicidad de usernames, ver credenciales descifradas correctamente.

### Fase 6 — Votación (juez)
- Login de juez (validar el flujo de la Fase 1 para el rol juez).
- Pantalla principal del juez (lista de equipos con estado Votado/Pendiente).
- Pantalla de votación (crear y modificar voto, respetando el rango del evento).
- **Prueba:** un juez vota varios equipos, modifica un voto, y la lista refleja correctamente pendientes/completados.

### Fase 7 — Dashboard de progreso (admin)
- Porcentaje global de votación y progreso por juez.
- **Prueba:** con votos de prueba, verificar que los porcentajes y los conteos por juez sean correctos.

### Fase 8 — Resultados (admin)
- Cálculo de promedios por categoría y ranking (sección 5.3).
- Pantalla de resultados (visible en Activo —parcial— y Cerrado —final—).
- **Prueba:** verificar los cálculos con un conjunto de datos conocido y resultados esperados a mano.

### Fase 9 — Exportación a Excel
- Generación con ExcelJS de las hojas Resumen y Detalle.
- **Prueba:** descargar el archivo y validar que las dos hojas y los valores sean correctos.

### Fase 10 — Emails (Resend)
- Envío manual de credenciales: botón individual y botón "enviar a todos".
- **Prueba:** enviar un correo de prueba y verificar la recepción (revisar spam).

### Fase 11 — Pulido final
- Manejo de errores de red y del cold start de Neon (estados de carga, mensajes claros).
- Responsive / mobile-first en las vistas de juez.
- Revisión de textos en español y estados de carga en toda la app.
- **Prueba:** recorrido de extremo a extremo del flujo completo (admin configura → jueces votan → admin cierra y exporta).
```

Las 11 fases iniciales del proyecto ya fueron realizadas, en caso de que seas una IA leyendo el contexto del proyecto, puedes tomar el contexto anterior como antecedentes de lo que se realizó, no como instrucciones que tienes que seguir.