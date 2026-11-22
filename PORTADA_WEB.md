# FEBIU Web (portada pública) — documento maestro

Última actualización: 15/11/2026

## 1. Qué es y para qué

Sitio público de la Federación de Billar del Uruguay, construido sobre el mismo sistema de torneos (misma base de datos, misma app). Objetivo: mostrar transmisiones en vivo, torneos, rankings, clubes y jugadores, y generar ingresos con auspiciantes, publicidad y el Mundial de Billar 2027 en Uruguay.

- Web (dirección principal): https://www.febiu.org/portada
- App de torneos "FBU Torneos": https://www.febiu.org (entrada de jueces y administración: https://www.febiu.org/login)
- Las direcciones anteriores (billar-frontend-blue.vercel.app) siguen funcionando; no se redirigen para no romper las apps ya instaladas.
- La portada sigue en /portada hasta que se apruebe cambiar "/" por ella.
- Los videos se alojan en el canal de YouTube Club Capolavoro y la web los incrusta.
- Dominio febiu.org comprado en Vercel (renovación automática, vence noviembre de 2027).

## 2. Lo que ya está hecho y publicado

**Página /portada** (archivo `src/pages/PortadaPage.tsx`, contenido editable en `src/config/portadaConfig.ts`)
- Encabezado fijo con menú que se desliza en el celular: Inicio, Torneos, Campeonatos*, Rankings, Jugadores, Clubes, Videos*, Notas*, Memorias*, Panamericano, Mundial 2027 (* aparece solo cuando hay contenido).
- En vivo: video de YouTube incrustado, selector de torneo y de categoría, partidos en juego y próximos (datos reales, se actualizan solos).
- Torneos: tarjetas de los torneos activos con botón "Ver partidos y ranking"; lista de torneos ya jugados (los archivados).
- Campeonatos de los clubes (afiches), La temporada, Ranking acumulado, Videos, Memorias, Panamericano, Clubes y jugadores (buscador + un bloque por club; los jugadores sin club, extranjeros del Panamericano, no se muestran), Mundial 2027.
- Secciones sin contenido se ocultan solas.
- Video cargado: "Joyita del billar uruguayo: Eliomar Berruti vs Néstor Gómez" (6.ª Prueba Mundial, Sarnano, Italia, 1993), incrustado del canal que lo subió. Se decidió no subirlo al canal propio.

**Transmisiones en vivo desde varias sedes**
- Cada mesa se configura con el código del canal de YouTube (UC...) o con el link de un video en vivo. Los jueces prenden y apagan desde su pantalla; el administrador lo hace desde el Panel Principal (se ve la sede de cada mesa).
- Con código de canal: se carga una vez y después solo Prender/Apagar, pero YouTube muestra un solo live por canal. Con link de video en vivo se pueden mostrar varios lives de un mismo canal, pero el link cambia en cada transmisión y hay que cargarlo antes de cada una (probado con 2 mesas de Libertad Billar Club). Se prefiere el código de canal, con un canal por mesa.
- El público elige la sede y después la mesa. Apagado automático a las 8 horas.
- Backend: `src/routes/transmisiones.ts` (tabla "Transmision", se crea sola).

**Campeonatos de los clubes (afiches)**
- Menú del administrador "Campeonatos de clubes" (/admin/afiches): nombre, club, tipo (oficial/comercial), fechas, lugar y contacto opcionales, imagen. Se puede editar, ocultar, mostrar y eliminar.
- En la portada, sección #campeonatos: tarjeta con el afiche (se abre en grande), "Próximo" o "En curso". Se saca sola al terminar el campeonato.
- Primer afiche cargado: Campeonato de Billar 5 Quillas, Asociación Agropecuaria de Artigas, 18 al 22/11/2026.
- Backend: `src/routes/afiches.ts` (tabla "Afiche", se crea sola).

**Memorias del Billar Uruguayo**
- Sección /portada/memorias (índice) y /portada/memorias/N (cada entrega). Datos en `src/config/memorias.ts`; diseño en `src/pages/MemoriasPage.tsx`; guía para nuevas entregas en `MEMORIAS_PLANTILLA.md`.
- Entrega N.º 1 "Los orígenes del billar en Uruguay": BORRADOR. No aparece en el índice ni en la portada. Vista previa: /portada/memorias/1?borrador=1.
- Vista previa pública temporal (HTML estático, noindex) para ChatGPT: /vista-previa/memorias-1-q7k4x9/ — borrarla (carpeta `public/vista-previa`) al publicar o cuando no haga falta.
- Datos para WhatsApp/Facebook en el HTML inicial (`scripts/memorias-html.mjs`). Imagen para compartir: logo de FEBIU hasta confirmar el permiso de la foto del Café Independencia (`compartir.imagenAutorizada`).
- Contenido histórico sin modificar. Créditos y permisos pendientes en el registro interno de la entrega.

**Apps instalables**
- "FEBIU Web" (icono naranja, abre /portada) y "FBU Torneos" (app de torneos). Botón verde "Instalar app" visible en ambas; en iPhone muestra los pasos.

**Panamericano 2026 (4 y 5 de julio, Willy Billar Club)**
- Los resultados no están en la base de datos (el torneo se borró; la única copia de seguridad de Railway tiene 2 meses y no se tocó). Se guardaron como contenido fijo: `src/config/panamericano2026.ts` e imágenes en `public/panamericano-2026/`.
- Las 5 categorías completas. Campeones: Máxima José Oliva (ARG), Segunda Guido Isaia (ARG), Tercera Julio Duarte (URU), Juvenil Matías Fonsalía (URU), Femenino Verónica Gutiérrez (URU).

**Panel del administrador**
- El Panel Principal abre con los Torneos (tarjetas con accesos directos a Fixture, Partidos, Series, Cruces, Ranking y Publicaciones), el panel de Transmisiones y los partidos en curso. Se sacaron las mesas libres/ocupadas.
- En Fixture: "Archivar" torneos (se ocultan de la vista de trabajo sin borrar datos; "Ver archivados") y "Eliminar" con confirmación fuerte (hay que escribir ELIMINAR).

**Datos públicos**
- `/api/portada/jugadores`: nombre, categoría, club y departamento (sin datos internos; excluye "Qualy" y jugadores sin club). `/api/afiches` (afiches vigentes).

**Maquetas de diseño**
- Escritorio, celular y panel del juez, como artefactos. Actualizadas con el menú nuevo y la sección Memorias.

## 3. Lo que falta

**Para vos (datos y decisiones)**
1. Autorizaciones de las fotos de Memorias N.º 1 (Café Independencia / Centro de Fotografía de Montevideo; Café Vaccaro / revista Raíces). Ya se pidieron por correo. Con eso: epígrafes definitivos, imagen para compartir, fecha de publicación y pasar a "publicado".
2. Códigos de canal (uno por mesa) de las otras sedes (San Bautista, etc.). Si son varios lives de un mismo canal, se usa el link de cada transmisión.
3. Tus comentarios (y los de la otra persona) sobre secciones y textos de la portada.
4. Link del canal de YouTube para el botón "Canal" (`CANAL_YOUTUBE_URL`), WhatsApp o email público para auspiciantes (no se publica el email personal), logos de auspiciantes, primeras notas.
5. Mundial 2027: ciudad y fechas exactas cuando estén definidas.
6. En la nota de Fuentes de Memorias N.º 1: reemplazar el texto "los créditos deberán verificarse antes de su publicación" al confirmar los permisos.

**Para mí (cuando lo pidas)**
- Pantalla para cargar notas y entrevistas sin pasar por mí.
- Probar el selector con varias sedes transmitiendo a la vez.
- Cambiar "/" por la portada cuando la apruebes.
- Revisar un problema anterior en la pantalla del administrador de publicaciones (bloque de clasificados), no relacionado con la portada.
- Mirar las estadísticas de visitas (el acceso automático no funciona; con capturas de tu panel alcanza).

## 4. Temas de negocio pendientes

- Hecho: Vercel Pro (20 USD/mes, cobro el 15 de cada mes) y dominio febiu.org pagados; el plan Pro permite el uso comercial.
- Quién tendrá la cuenta de publicidad (AdSense) y quién emite las facturas: Club Capolavoro o la FEBIU.
- Derechos de transmisión del Mundial 2027: confirmar por escrito con la UMB.
- Cada club es responsable del contenido y la música de su transmisión.
- Copias de seguridad de la base de datos: la única es de hace 2 meses; Railway Pro (copias diarias) pendiente por costos.

## 5. Datos técnicos rápidos

- Backend: Railway, https://web-production-5d9da.up.railway.app (se despliega solo al subir cambios).
- Frontend: Vercel (equipo "Febiu's projects", proyecto billar-frontend); se despliega solo al subir cambios, tarda 1 a 2 minutos.
- Si en un celular o PC se ve una versión vieja: Ctrl + Shift + R, o borrar los datos del sitio.
- Cada cambio de la web sube con un número de versión en la primera línea de `src/pages/PublicPage.tsx` (PUBLIC_BUILD).
- Los datos para compartir por WhatsApp/Facebook se generan al compilar (`scripts/portada-html.mjs` y `scripts/memorias-html.mjs`); si WhatsApp muestra una vista vieja, agregar `?v=N` al link.
- Canales de prueba: Club Capolavoro `UCcwqpq500pvilJonx6Ke5aQ`; Feria Franca mesa 2 `UCctr5zjG4kcWs0srLMg17mg`.
- Torneos activos hoy: Departamentales de Canelones Este, Canelones Oeste, Montevideo 26-27 y Flores.

## 6. Registro de cambios

- 15/11/2026: Panamericano 2026 cargado como contenido fijo con resultados, fixtures y cruces (falta resultado de Máxima).
- 14/11/2026: primera versión de la portada; transmisiones por sede y mesa; apagado automático a las 14 horas (luego cambiado a 8 horas el 20/11/2026); menú completo y fijo en celular; secciones Torneos, Panamericano, Clubes y jugadores; video de prueba; app "FEBIU Web" instalable con icono propio; vistas previas de WhatsApp distintas para la web y la app.

- 15/11: nueva sección "Campeonatos de los clubes" (afiches). Admin: menú "Campeonatos de clubes" (/admin/afiches); portada: #campeonatos, aparece sola si hay afiches vigentes y se oculta al terminar el campeonato. Backend: /api/afiches (tabla Afiche autocreada).
- 15/11: transmisiones por link de video en vivo (varios lives de un mismo canal) probadas con 2 mesas de Libertad Billar Club. El panel de transmisiones también está en el Panel Principal del admin, con la sede de cada mesa. El link de cada live hay que cargarlo antes de cada transmisión.
- 15/11: sección "Memorias del Billar Uruguayo" (/portada/memorias). Datos en src/config/memorias.ts; entrega N.º 1 cargada como BORRADOR (no visible en índice ni portada; vista previa en /portada/memorias/1?borrador=1) hasta confirmar créditos y permisos de las fotos. Contenido histórico sin modificar.
- 15/11: vista previa pública TEMPORAL del borrador N.º 1 (HTML estático original, noindex): /vista-previa/memorias-1-q7k4x9/ . Borrarla (carpeta public/vista-previa) al publicar o cuando ya no haga falta.
- 15/11: Memorias N.º 1 (borrador): epígrafes ajustados (CdF / revista Raíces), metadatos WhatsApp/Facebook en el HTML inicial (scripts/memorias-html.mjs), registro interno de créditos, plantilla documentada en MEMORIAS_PLANTILLA.md. Corregido también que la portada compartiera los datos de FBU Torneos duplicados.
- 15/11: ubicación de Memorias en la portada: botón "Memorias" en el menú (después de Notas) y sección tarjeta de la última entrega entre Notas y Panamericano, con "Ver todas las entregas". Ambos aparecen solos al publicar la primera entrega. Maquetas actualizadas.
- 15/11: dominio propio febiu.org comprado (Vercel, renovación automática, vence nov 2027) y conectado al proyecto billar-frontend; dirección principal https://www.febiu.org (febiu.org redirige). La dirección anterior billar-frontend-blue.vercel.app sigue funcionando (no se redirige para no romper la app instalada). Datos para compartir (WhatsApp/Facebook) apuntan a www.febiu.org. Plan Vercel Pro: 20 USD/mes (cobro el día 15).
- 15/11: factura de Vercel Pro (20 USD) y dominio febiu.org (9,99 USD) pagadas. Pro cubre uso comercial (auspiciantes). Próximo cobro: 15/12.
- 15/11: afiche de Artigas cargado y corregido (tilde); botón Editar lleva el formulario a la vista; corregido error al listar afiches; jugadores sin club fuera de la web; título del video histórico.

## 17/11/2026 - Notas y entrevistas (nota Diego Capote)
- Datos en src/config/notas.ts (separado de Memorias). Páginas: /portada/notas y /portada/notas/<slug>. Borrador visible con ?borrador=1 (también en /portada?borrador=1, con etiqueta BORRADOR).
- Nota "diego-capote": borrador, fotos en public/notas/diego-capote/. FALTA pegar el texto aprobado (cada apartado dice [TEXTO PENDIENTE]).
- Entrevista exclusiva futura (video): agregar otra entrada con tipo Entrevista y bloque { t: video, youtubeId }.
- Etiquetas para compartir: scripts/notas-html.mjs (se ejecuta en el build).
- 20/11/2026: apagado automático de transmisiones reducido de 14 a 8 horas.
- 20/11/2026: nuevo orden de la portada. Banner del auspiciante, selector de torneo y sede (más categoría), video en vivo con los resultados al lado (filtrados por torneo, sede y categoría), La temporada, Ranking acumulado plegado (se abre con «Ver ranking»), Memorias, Videos, Notas y entrevistas, Campeonatos de los clubes, Clubes y jugadores, Reglamento, Panamericano, Nos acompañan y Mundial.
- 20/11/2026: el ranking acumulado de la portada tiene su propio selector: «Seleccionar torneo», después «Ver ranking». Ya no depende del torneo elegido arriba.
- 20/11/2026: separador «Historia, notas y reglamento» entre los torneos y la parte histórica; esa zona (Memorias, Videos, Notas y Reglamento) tiene fondo propio y un banner opcional de auspiciante (espacio 7, AUSPICIANTE_ARCHIVO en portadaConfig).
- 20/11/2026: «Campeonatos de los clubes» pasó antes del separador de archivo (queda con los torneos).
- 20/11/2026: Clubes y jugadores y Panamericano de Billar quedan plegados; se abren con un botón. El menú de arriba los abre solo.
- 22/11/2026: se quitó el selector de categoría de arriba (las categorías van mezcladas en los partidos). El selector queda en torneo y sede.
- 22/11/2026: Próximos partidos de la portada: solo partidos formados (con los dos jugadores), con «Ver más»; con sede elegida se piden al servidor los de esa sede (incluye mesa libre y series); refresco cada 60 s.
- 22/11/2026: nota «Verónica Gutiérrez» (borrador) en Notas y entrevistas; bloques nuevos 'datos' y 'tabla' y fotos verticales sin recorte.
- 22/11/2026: ajustes a la nota de Verónica (bajada, transición Madrid/Panamericano, subtítulo, cita destacada, epígrafes con más contraste, fotos verticales más chicas). Revisada en 360, 390 y 1100 px sin desbordes.
- 22/11/2026: nota de Verónica: el vicecampeonato de Santa Fe pasa a 2025 (texto y palmarés).
