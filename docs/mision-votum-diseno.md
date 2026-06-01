# Misión Votum — Documento de Diseño de Interfaz

> Referencia para el diseño de mockups y prototipado.
> Incluye flujos reales, elementos por pantalla, estados y reglas de UI.
> No incluye decisiones de backend, stack técnico ni base de datos.

---

## 1. Usuarios y contexto de uso

### Administrador
- Una sola persona. Gestiona los concursos del colegio.
- Usa la app desde **computadora** (escritorio), sentado, con tiempo para revisar.
- Necesita: control total sobre la configuración, visibilidad del avance de las votaciones y acceso a los resultados.

### Juez (Profesor)
- Alrededor de 15 por evento.
- Usa la app desde su **celular** (pantalla vertical), mientras camina entre los stands del concurso.
- Necesita: votar rápido, sin confundirse, saber qué equipos le faltan.

---

## 2. Estados del Evento

Cada evento tiene tres estados que determinan qué puede hacer el admin y si los jueces pueden votar.

| Estado | Quién puede hacer qué |
|--------|-----------------------|
| **Borrador** | Solo el admin. Puede configurar todo libremente. Los jueces no pueden entrar a votar. |
| **Activo** | El admin puede ver progreso y resultados parciales, y puede añadir o eliminar equipos y jueces (pero no modificar categorías ni el rango). Los jueces pueden votar. |
| **Cerrado** | Solo lectura para todos. El admin puede ver resultados finales y exportar. Los jueces no pueden votar. |

El admin cambia el estado manualmente desde la pantalla de configuración del evento.

---

## 3. Pantalla de Login

### Contexto
Única pantalla de acceso para ambos roles. El sistema detecta si son credenciales de admin o de juez y redirige al área correspondiente.

### Elementos
- Logo y nombre "Misión Votum" centrado en la parte superior.
- Campo: **Usuario** (texto plano, sin autocompletado).
- Campo: **Contraseña** (oculta por defecto, con ícono de ojo para mostrar u ocultar).
- Botón: **Entrar** (tamaño prominente, ancho completo en mobile).
- Área de error inline (debajo del formulario, no popup): aparece solo cuando las credenciales son incorrectas. Mensaje: *"Usuario o contraseña incorrectos."* No borra los campos; solo el de contraseña se limpia.
- Sin registro, sin "olvidé mi contraseña", sin redes sociales.

### Estados de la pantalla
- **Vacío:** campos vacíos, botón disponible.
- **Cargando:** botón muestra spinner y texto "Entrando…", campos deshabilitados.
- **Error:** mensaje de error visible, campos vuelven a ser editables.
- **Éxito:** redirección inmediata al área correspondiente según el rol.

---

## 4. Área del Administrador (desktop)

### 4.1 Dashboard Principal — Lista de Eventos

#### Para qué sirve
Vista de inicio del admin. Muestra todos los eventos y permite crear uno nuevo.

#### Elementos
- **Header:** nombre de la app a la izquierda. A la derecha: inicial o avatar del admin y botón de cerrar sesión.
- **Botón principal:** "Crear nuevo evento" (prominente, con ícono "+").
- **Lista de eventos:** una tarjeta por evento. Orden: Activos primero, luego Borrador, luego Cerrados.
  - Cada tarjeta muestra:
    - Nombre del evento.
    - Fecha (si tiene), en texto secundario.
    - Badge de estado con color diferenciado (ver sección 9).
    - Botón de editar/configurar.
    - Botón de eliminar.
  - Clic en la tarjeta o en editar → va a la pantalla de Configuración de ese evento.
- **Estado vacío:** mensaje amigable + botón para crear el primer evento.

#### Acciones
| Acción | Resultado |
|--------|-----------|
| Clic en "Crear nuevo evento" | Crea un evento en Borrador y va a su Configuración |
| Clic en tarjeta de evento | Va a la Configuración de ese evento |
| Clic en eliminar evento | Confirmación (ver sección 8) |

---

### 4.2 Configuración de Evento

#### Para qué sirve
Pantalla central de un evento. Concentra toda la administración: datos generales, categorías, equipos, jueces, progreso y resultados.

#### Elementos del encabezado
- Nombre del evento (grande, editable inline al hacer clic).
- Botón de volver al dashboard.
- **Control de estado:** selector visual con tres opciones: Borrador / Activo / Cerrado. El estado actual está resaltado. Al cambiar de estado se disparan confirmaciones cuando aplica (ver sección 8).

#### Navegación interna
Tabs o secciones laterales para navegar entre las partes de la configuración:
- Datos generales
- Categorías
- Equipos *(enlaza a pantalla de Gestión de Equipos)*
- Jueces *(enlaza a pantalla de Gestión de Jueces)*
- Progreso *(disponible solo en estado Activo o Cerrado)*
- Resultados *(disponible solo en estado Activo o Cerrado)*

---

#### Sección: Datos Generales
- Campo: **Nombre del evento** (texto).
- Campo: **Fecha** (date picker o texto).
- Campo: **Descripción** (opcional, textarea pequeña).
- Campo: **Rango de calificación** — dos inputs pequeños inline: "Del [ ] al [ ]". Ejemplo: "Del 1 al 5".
  - En estado **Activo o Cerrado**: campos en solo lectura, ícono de candado visible, tooltip al pasar el mouse: *"No se puede modificar mientras el evento está activo."*
- Botón: **Guardar cambios**.

---

#### Sección: Categorías
- Lista de categorías existentes. Cada fila:
  - Nombre de la categoría (editable inline al hacer clic).
  - Botón de eliminar (×).
- Botón al final: **"+ Añadir categoría"**.
- En estado **Activo o Cerrado**: toda la sección bloqueada. Los nombres son solo lectura, los botones de añadir y eliminar están ocultos o deshabilitados, y aparece un aviso: *"Las categorías no se pueden modificar mientras el evento está activo."*
- **Estado vacío:** *"Aún no hay categorías. Añade al menos una antes de activar el evento."*

---

### 4.3 Gestión de Equipos

#### Para qué sirve
Administrar los equipos que participan en el evento.

#### Elementos
- **Header:** nombre del evento + botón de volver a Configuración.
- **Barra de herramientas:** barra de búsqueda (filtra la lista en tiempo real) + botones "Añadir equipo" e "Importar lote".
- **Lista de equipos:** una fila por equipo con:
  - Nombre del equipo.
  - Número de votos recibidos en total.
  - Botón de editar (lápiz).
  - Botón de eliminar (basurero).
- En estado **Activo o Cerrado**: los botones de editar y eliminar siguen disponibles pero disparan confirmación reforzada si el equipo tiene votos.
- **Estado vacío:** mensaje con instrucción para añadir el primero.

#### Modal: Añadir / Editar equipo
- Campo: nombre del equipo.
- Botones: **Guardar** y **Cancelar**.

#### Modal: Importar lote
- Título: "Importar equipos".
- Instrucción visible: *"Escribe un nombre de equipo por línea."*
- Textarea grande para pegar los nombres.
- Preview dinámico: *"Se importarán 12 equipos."* (se actualiza mientras escribe).
- Líneas con errores (duplicados o vacías) resaltadas en rojo con aviso antes de confirmar.
- Botones: **Importar** y **Cancelar**.

#### Acciones
| Acción | Resultado |
|--------|-----------|
| Añadir equipo | Abre modal |
| Editar equipo | Abre modal con datos cargados |
| Importar lote | Abre modal con textarea |
| Eliminar equipo | Confirmación simple o fuerte según votos (ver sección 8) |

---

### 4.4 Gestión de Jueces

#### Para qué sirve
Administrar los profesores que actuarán como jueces, sus credenciales y el envío de correos.

#### Elementos
- **Header:** nombre del evento + botón de volver a Configuración.
- **Barra de herramientas:** barra de búsqueda + botones "Añadir juez", "Importar lote" y "Enviar credenciales a todos".
  - "Enviar credenciales a todos" está deshabilitado si ningún juez tiene email registrado.
- **Lista de jueces:** una fila por juez con:
  - Nombre completo.
  - Username (en texto secundario, más pequeño).
  - Email (si tiene; si no, muestra "—").
  - Contraseña: mostrada como ●●●●●● con botón de ojo para revelar temporalmente.
  - Botón "Enviar credenciales" (ícono de sobre): activo solo si el juez tiene email.
  - Botón de editar.
  - Botón de eliminar.
- **Estado vacío:** mensaje con instrucción para añadir el primero.

#### Modal: Añadir juez
- Campo: **Nombre completo**.
- Campo: **Email** (opcional).
- Al guardar: el sistema asigna username y contraseña automáticamente. Se muestra el username asignado en una confirmación antes de cerrar el modal.

#### Modal: Importar lote
- Título: "Importar jueces".
- Instrucción: *"Una entrada por línea. Formato: Nombre, email (el email es opcional)."*
- Ejemplo visible: `Juan Pérez, juan@misión.edu`
- Textarea grande.
- Preview del número de jueces detectados.
- Líneas con errores de formato resaltadas en rojo.
- Botones: **Importar** y **Cancelar**.

#### Revelar contraseña
- Al hacer clic en el ojo, la contraseña se muestra en texto claro. No es editable, es solo visualización. Se oculta automáticamente al quitar el clic o después de unos segundos.

#### Acciones
| Acción | Resultado |
|--------|-----------|
| Añadir juez | Abre modal |
| Editar juez | Abre modal con nombre y email cargados |
| Importar lote | Abre modal con textarea |
| Revelar contraseña | Toggle de visibilidad |
| Enviar credenciales (individual) | Acción inmediata + toast: *"Credenciales enviadas a juan@misión.edu"* |
| Enviar credenciales a todos | Confirmación: *"¿Enviar credenciales a los X jueces con email registrado?"* → Sí / Cancelar |
| Eliminar juez | Confirmación simple o fuerte según votos (ver sección 8) |

---

### 4.5 Dashboard de Progreso

#### Para qué sirve
Ver el avance de las votaciones durante el evento. Se actualiza al presionar "Refrescar" (no automático).

#### Disponible en
Estado **Activo** y **Cerrado**.

#### Elementos
- **Header:** nombre del evento + botón "Refrescar" (ícono de actualizar).
- **Métrica principal:** número grande con el porcentaje global completado. Ejemplo: *"67% completado"*.
- **Barra de progreso global:** visual, ancha, debajo del porcentaje.
- **Resumen textual:** *"X de Y jueces han completado todos sus votos."*
- **Lista de jueces con progreso individual:**
  - Los jueces sin ningún voto aparecen primero, con badge llamativo en rojo o naranja: "Sin votos".
  - Los jueces que completaron todos sus votos aparecen al final, con badge verde: "Completo".
  - Cada fila muestra:
    - Nombre del juez.
    - Fracción de equipos votados: *"22 / 40 equipos"*.
    - Porcentaje individual.
    - Barra de progreso individual, estrecha.

---

### 4.6 Resultados del Evento

#### Para qué sirve
Ver los resultados calculados por categoría y exportar los datos.

#### Disponible en
Estado **Activo** (resultados parciales) y **Cerrado** (resultados finales).

#### Elementos
- **Header:** nombre del evento + badge de estado + botón "Exportar a Excel".
- **Banner de resultados parciales** (solo en estado Activo): fondo ámbar/naranja suave, texto: *"Resultados parciales — el evento sigue activo y los votos pueden cambiar."*
- **Resultados por categoría:** una sección colapsable por cada categoría.
  - Título de la categoría como encabezado de sección.
  - Tabla de ranking con columnas:
    - **Posición:** 1.°, 2.°, 3.°… (con tratamiento especial al primer lugar: medalla o fondo diferente).
    - **Equipo:** nombre.
    - **Promedio:** con una cifra decimal (ej. 4.3).
    - **Votos:** número de jueces que calificaron a ese equipo en esa categoría.
  - Nota al pie de cada categoría si hay equipos con pocos votos: *"Algunos equipos tienen menos votos que otros. El promedio se calcula con los votos disponibles."*

---

## 5. Área del Juez (mobile, pantalla vertical)

### 5.1 Lista de Equipos

#### Para qué sirve
Vista principal del juez. Sabe cuánto lleva votado y elige a quién calificar a continuación.

#### Elementos
- **Header:** saludo personalizado *"Hola, [nombre del juez]"* + nombre del evento + botón de cerrar sesión (discreto, en la esquina).
- **Progreso personal:** texto *"Has votado a X de 40 equipos"* + barra de progreso.
- **Lista de equipos:** los pendientes aparecen primero.
  - **Equipo pendiente:** nombre del equipo + badge "Pendiente" (naranja o ámbar).
  - **Equipo votado:** nombre del equipo + badge "Votado" (verde) + promedio que el juez le dio (ej. *"Tu calificación: 3.8"*).
  - Cada ítem es tappable y lleva a la pantalla de votación de ese equipo.
- **Estado si no puede votar** (evento en Borrador o Cerrado): lista visible pero no tappable, con banner: *"La votación no está disponible en este momento."*

---

### 5.2 Pantalla de Votación

#### Para qué sirve
El juez califica a un equipo en todas las categorías. Debe poder completarse en pocos segundos, con botones grandes y sin ambigüedad.

#### Elementos
- **Header:** nombre del equipo que se está calificando + botón de volver (flecha o "← Volver").
- **Banner de voto previo** (solo si el juez ya votó a este equipo antes): banner sutil, no intrusivo: *"Ya calificaste a este equipo. Puedes actualizar tu puntuación."*
- **Por cada categoría** (apiladas verticalmente, con espacio generoso entre ellas para no confundirlas):
  - Nombre de la categoría en texto claro y legible.
  - Control de puntuación: fila de botones grandes tipo "selector de chips" o "segmented control", uno por cada valor del rango (ej. 1 — 2 — 3 — 4 — 5).
    - El valor seleccionado tiene fondo de color sólido y es visualmente inconfundible.
    - Los valores no seleccionados están en gris claro o con solo contorno.
    - Si el juez ya votó antes, el valor previo aparece seleccionado al cargar la pantalla.
    - Cada botón es suficientemente grande para tocarse sin error con el pulgar.
- **Validación:** si el juez intenta enviar sin haber seleccionado todas las categorías, el botón no responde y aparece un mensaje inline: *"Debes calificar todas las categorías antes de enviar."*
- **Botón de acción** (al final, grande, ancho completo):
  - Primera vez: **"Enviar voto"**.
  - Si ya votó antes: **"Actualizar voto"**.
- **Tras enviar:** toast de confirmación (*"✓ Voto enviado para [nombre del equipo]"*) + la app vuelve automáticamente a la lista de equipos.

---

## 6. Acciones Destructivas y Confirmaciones

### Confirmación simple
Diálogo pequeño: *"¿Eliminar [nombre]? Esta acción no se puede deshacer."* + botones Cancelar y Eliminar.

**Se usa para:**
- Eliminar un equipo o juez sin votos asociados.
- Eliminar un evento en estado Borrador (sin votos).

### Confirmación fuerte
Diálogo más prominente con color rojo o naranja en el encabezado. Indica exactamente qué se va a borrar. El botón de confirmar solo se activa cuando el admin escribe una palabra en un campo de texto (ej. *"eliminar"* o el nombre del recurso).

**Se usa para:**
- Eliminar un equipo con votos: *"Esto eliminará al equipo [nombre] y sus X votos registrados. Escribe 'eliminar' para confirmar."*
- Eliminar un juez con votos: *"Esto eliminará al juez [nombre] y sus X votos. Escribe 'eliminar' para confirmar."*
- Eliminar un evento en estado Activo o Cerrado: *"Esto eliminará el evento [nombre] y todos sus X votos. Escribe el nombre del evento para confirmar."*
- Devolver un evento de Activo a Borrador: *"Esto borrará todos los votos registrados (X votos). El evento volverá a Borrador. Escribe 'borrador' para confirmar."*

### Tabla completa
| Acción | Confirmación | Qué se elimina |
|--------|-------------|----------------|
| Eliminar equipo sin votos | Simple | Nada importante |
| Eliminar juez sin votos | Simple | Nada importante |
| Eliminar equipo con votos | Fuerte | Sus votos en cascada |
| Eliminar juez con votos | Fuerte | Sus votos en cascada |
| Eliminar evento en Borrador | Simple | El evento vacío |
| Eliminar evento en Activo o Cerrado | Fuerte | Todo el evento y sus votos |
| Devolver evento de Activo a Borrador | Fuerte | Todos los votos del evento |

---

## 7. Mensajes de Feedback

### Toasts (notificaciones temporales)
Aparecen en la esquina, desaparecen solos en 3-4 segundos:
- **Éxito (verde):** *"✓ Voto enviado."*, *"✓ Credenciales enviadas."*, *"✓ Cambios guardados."*, *"✓ Evento activado."*
- **Error (rojo):** *"No se pudo enviar el correo. Intenta de nuevo."*, *"Error al guardar. Revisa tu conexión."*

### Errores inline
Aparecen debajo del campo que los causó, en texto pequeño rojo. Nunca en popup o alert del navegador.

### Estados de carga
Cuando la app procesa una acción:
- El botón muestra spinner y texto cambiado (ej. *"Guardando…"* en vez de *"Guardar"*).
- Los campos del formulario se deshabilitan mientras procesa.

### Estado de conexión lenta
Si la carga inicial toma más de 2-3 segundos (puede ocurrir tras inactividad larga), mostrar un indicador de *"Conectando…"* en vez de un error inmediato. No asumir que algo falló solo porque tarda unos segundos.

### Estado vacío
Cuando una lista no tiene elementos:
- Mensaje amigable explicando que no hay datos aún.
- Instrucción de qué hacer.
- Nunca una lista en blanco sin explicación.
- Ejemplos: *"Aún no hay equipos. Añade el primero con el botón de arriba."*, *"Todavía no hay eventos creados."*

---

## 8. Reglas de Bloqueo

Elementos que se deshabilitan según el estado del evento:

| Elemento | Bloqueado cuando | Comportamiento visual |
|----------|-----------------|----------------------|
| Rango de calificación | Evento Activo o Cerrado | Solo lectura + ícono de candado + tooltip explicativo al pasar el mouse |
| Añadir / editar / eliminar categorías | Evento Activo o Cerrado | Sección con aviso visible, botones ocultos o deshabilitados |
| Votación del juez | Evento en Borrador o Cerrado | Lista visible pero no tappable + banner explicativo |
| Pantalla de Progreso | Evento en Borrador | No disponible o con mensaje *"El evento aún no ha iniciado."* |
| Pantalla de Resultados | Evento en Borrador | No disponible o con mensaje *"El evento aún no ha iniciado."* |
| Botón "Enviar credenciales" individual | Juez sin email | Deshabilitado + tooltip: *"Este juez no tiene email registrado."* |
| Botón "Enviar credenciales a todos" | Ningún juez tiene email | Deshabilitado |

---

## 9. Colores de Estado

Los colores de los badges deben ser consistentes en toda la app:

### Estado del evento
| Estado | Color |
|--------|-------|
| Borrador | Gris neutro |
| Activo | Verde |
| Cerrado | Azul o morado apagado |

### Estado de voto del juez
| Estado | Color |
|--------|-------|
| Pendiente | Naranja o ámbar |
| Votado | Verde |
| Sin votos (ningún voto emitido) | Rojo o naranja fuerte |
| Completo (todos los equipos votados) | Verde oscuro o con ícono de check |

---

## 10. Flujo de Navegación

### Admin
```
Login
  └→ Dashboard (lista de eventos)
       ├→ Crear evento → Configuración (nuevo evento en Borrador)
       └→ Clic en evento → Configuración del evento
            ├→ Datos generales + Categorías (en la misma pantalla)
            ├→ Gestión de Equipos
            │    └→ Volver a Configuración
            ├→ Gestión de Jueces
            │    └→ Volver a Configuración
            ├→ [Activar evento]
            ├→ Dashboard de Progreso (disponible en Activo/Cerrado)
            └→ Resultados (disponible en Activo/Cerrado)
                 └→ Exportar a Excel
```

### Juez
```
Login
  └→ Lista de Equipos
       └→ Clic en equipo → Pantalla de Votación
            └→ Enviar voto → vuelve automáticamente a Lista de Equipos
                 └→ Repetir hasta completar todos los equipos
```
