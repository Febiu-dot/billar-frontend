# FEBIU Web (portada pública) — documento maestro

Última actualización: 14/11/2026

## 1. Qué es y para qué

Sitio público de la Federación de Billar del Uruguay, construido sobre el mismo sistema de torneos (misma base de datos, misma app). Objetivo: mostrar transmisiones en vivo, torneos, rankings, clubes y jugadores, y generar ingresos con auspiciantes, publicidad y el Mundial de Billar 2027 en Uruguay.

- Web: https://billar-frontend-blue.vercel.app/portada
- App de torneos: https://billar-frontend-blue.vercel.app/ (lleva a /publico; no se tocó)
- La portada sigue en /portada hasta que se apruebe cambiar "/" por ella.
- Los videos se alojan en el canal de YouTube Club Capolavoro y la web los incrusta.

## 2. Lo que ya está hecho y publicado

**Página /portada** (archivo `src/pages/PortadaPage.tsx`, contenido editable en `src/config/portadaConfig.ts`)
- Encabezado fijo con menú que se desliza en el celular: Inicio, Torneos, Rankings, Jugadores, Clubes, Videos, Notas, Panamericano, Mundial 2027 (Videos y Notas aparecen solo cuando hay contenido).
- En vivo: video de YouTube incrustado, selector de torneo y de categoría, partidos en juego y próximos (datos reales, se actualizan solos).
- Torneos: tarjetas de los torneos activos (hoy los 4 departamentales) con botón "Ver partidos y ranking"; lista de torneos ya jugados.
- La temporada, Ranking acumulado (por categoría, top 10), Videos (hay un video de prueba), Panamericano, Clubes y jugadores (buscador + un bloque por club, 559 jugadores), Mundial de Billar 2027 al final.
- Secciones sin contenido se ocultan solas (Videos, Notas, Auspiciantes).

**Transmisiones en vivo desde varias sedes**
- Cada mesa tiene su canal de YouTube (código UC...). El juez prende y apaga cada mesa con un botón grande en su pantalla ("Transmisiones en vivo").
- El público elige primero la sede y después la mesa; funciona con muchas transmisiones a la vez.
- Apagado automático: una mesa prendida se apaga sola a las 14 horas.
- Backend: `src/routes/transmisiones.ts` (tabla "Transmision", se crea sola).

**App instalable aparte**
- La portada se instala como "FEBIU Web" con icono naranja propio y abre siempre la portada. La app de torneos sigue como "FBU Torneos".
- Al compartir por WhatsApp cada link muestra su propio título, descripción e imagen.

**Panamericano 2026 (4 y 5 de julio, Willy Billar Club)**
- Los resultados no están en la base de datos del sistema (el torneo se borró; hay una sola copia de seguridad de hace 2 meses en Railway que no se tocó). Se guardaron como contenido fijo: `src/config/panamericano2026.ts` e imágenes en `public/panamericano-2026/`.
- Máxima, Segunda, Tercera, Juvenil y Femenino con campeón, subcampeón, semifinalistas, fixture inicial y cruces finales. Máxima también completa (campeón José Oliva, ARG).
- Campeones: Máxima José Oliva (ARG), Segunda Guido Isaia (ARG), Tercera Julio Duarte (URU), Juvenil Matías Fonsalía (URU), Femenino Verónica Gutiérrez (URU).
- Pendiente de decidir: cambiar el botón "Eliminar torneo" de la app por "Archivar" para que no se pierdan datos, y contratar Railway Pro para copias de seguridad diarias.

**Datos públicos**
- Endpoint nuevo `/api/portada/jugadores`: nombre, categoría, club y departamento (sin datos internos). Excluye los jugadores de relleno "Qualy".

**Maquetas de diseño (para revisar con otras personas)**
- Escritorio, celular y panel del juez, publicadas como artefactos. La maqueta del celular ya tiene el menú nuevo.

## 3. Lo que falta

**Para vos (datos y decisiones)**
1. (Resuelto 15/11) Máxima del Panamericano 2026 ya está cargada.
2. Códigos o links de los canales de YouTube de cada mesa de las otras sedes (San Bautista, etc.). Yo los convierto a código y los dejo listos para pegar.
3. Tus comentarios (y los de la otra persona) sobre secciones y textos de la portada.
4. Link del canal de YouTube para el botón "Canal" (`CANAL_YOUTUBE_URL`), WhatsApp o email público para auspiciantes (no se publica el email personal), logos de auspiciantes, primeras notas y videos definitivos (título, tipo y fecha de cada uno).
5. Mundial 2027: ciudad y fechas exactas cuando estén definidas.

**Para mí (cuando lo pidas)**
- Reemplazar el video de prueba por los reales.
- Pantalla para cargar notas y entrevistas sin pasar por mí (hoy me pasás el texto y lo cargo).
- Probar el selector de sedes con varias sedes transmitiendo a la vez.
- Cambiar "/" por la portada cuando la apruebes.
- Revisar un problema anterior en la pantalla del administrador de publicaciones (bloque de clasificados), que no se relaciona con la portada.
- Mirar las estadísticas de visitas otra vez (el acceso automático no funciona; con capturas de tu panel alcanza).

## 4. Temas de negocio pendientes (antes de cobrar)

- Quién tendrá la cuenta de publicidad (AdSense) y quién emite las facturas: Club Capolavoro o la FEBIU.
- Plan de Vercel: el actual es gratuito y no permite uso comercial; pasar al plan Pro (unos 20 dólares por mes) antes de cobrar al primer auspiciante.
- Dirección propia (dominio) para la web.
- Derechos de transmisión del Mundial 2027: confirmar por escrito con la UMB.
- Cada club es responsable del contenido y la música de su transmisión.

## 5. Datos técnicos rápidos

- Backend: Railway, https://web-production-5d9da.up.railway.app (se despliega solo al subir cambios).
- Frontend: Vercel, proyecto billar-frontend (se despliega solo al subir cambios; tarda 1 a 2 minutos).
- Si en un celular se ve una versión vieja: borrar los datos del sitio.
- Cada cambio de la web sube con un número de versión en la primera línea de `src/pages/PublicPage.tsx` (PUBLIC_BUILD).
- Canales de prueba: Club Capolavoro `UCcwqpq500pvilJonx6Ke5aQ`; Feria Franca mesa 2 `UCctr5zjG4kcWs0srLMg17mg`.
- Torneos activos hoy: Departamentales de Canelones Este, Canelones Oeste, Montevideo 26-27 y Flores.

## 6. Registro de cambios

- 15/11/2026: Panamericano 2026 cargado como contenido fijo con resultados, fixtures y cruces (falta resultado de Máxima).
- 14/11/2026: primera versión de la portada; transmisiones por sede y mesa; apagado automático a las 14 horas; menú completo y fijo en celular; secciones Torneos, Panamericano, Clubes y jugadores; video de prueba; app "FEBIU Web" instalable con icono propio; vistas previas de WhatsApp distintas para la web y la app.

- 15/11: nueva sección "Campeonatos de los clubes" (afiches). Admin: menú "Campeonatos de clubes" (/admin/afiches); portada: #campeonatos, aparece sola si hay afiches vigentes y se oculta al terminar el campeonato. Backend: /api/afiches (tabla Afiche autocreada).
- 15/11: transmisiones por link de video en vivo (varios lives de un mismo canal) probadas con 2 mesas de Libertad Billar Club. El panel de transmisiones también está en el Panel Principal del admin, con la sede de cada mesa. El link de cada live hay que cargarlo antes de cada transmisión.
- 15/11: sección "Memorias del Billar Uruguayo" (/portada/memorias). Datos en src/config/memorias.ts; entrega N.º 1 cargada como BORRADOR (no visible en índice ni portada; vista previa en /portada/memorias/1?borrador=1) hasta confirmar créditos y permisos de las fotos. Contenido histórico sin modificar.
- 15/11: vista previa pública TEMPORAL del borrador N.º 1 (HTML estático original, noindex): /vista-previa/memorias-1-q7k4x9/ . Borrarla (carpeta public/vista-previa) al publicar o cuando ya no haga falta.
- 15/11: Memorias N.º 1 (borrador): epígrafes ajustados (CdF / revista Raíces), metadatos WhatsApp/Facebook en el HTML inicial (scripts/memorias-html.mjs), registro interno de créditos, plantilla documentada en MEMORIAS_PLANTILLA.md. Corregido también que la portada compartiera los datos de FBU Torneos duplicados.
