// NOTAS Y ENTREVISTAS de la FEBIU (separadas de la serie historica "Memorias del Billar Uruguayo").
// Para agregar una nota: copiar un bloque al FINAL de NOTAS, cambiar slug, textos, fotos (carpeta public/notas/<slug>/) y fuentes.
// Mientras diga estado: 'borrador' NO se ve en la portada ni en el indice; se revisa entrando a /portada/notas/<slug>?borrador=1
// (y la portada con ?borrador=1 la muestra con la etiqueta BORRADOR). Para publicar: estado 'publicado' y fecha 'AAAA-MM-DD'.
// tipo: 'Nota' (articulo) o 'Entrevista'. Una entrevista en video se agrega como OTRA entrada, con un bloque { t: 'video', youtubeId }.
// Formato del texto: *cursiva* y **negrita**.

export type BloqueNota =
  | { t: 'p'; texto: string; inicial?: boolean }
  | { t: 'h2'; texto: string }
  | { t: 'cita'; texto: string }
  | { t: 'fig'; src: string; alt: string; pie?: string }
  | { t: 'video'; youtubeId: string; pie?: string };

export interface FuenteNota { texto: string; enlace?: { url: string; etiqueta: string } }

export interface Nota {
  slug: string;
  estado: 'borrador' | 'publicado';
  fecha: string | null;          // fecha de publicacion AAAA-MM-DD (solo cuando se publica)
  tipo: 'Nota' | 'Entrevista';
  titulo: string;
  bajada: string;                // subtitulo debajo del titulo
  resumen: string;               // descripcion breve para el listado y para compartir
  autor: string;
  imagen: string;                // foto principal
  imagenAlt: string;
  pieImagen: string;
  aclaracion?: string;           // aviso sobre como se elaboro la nota (se muestra antes de las fuentes)
  cuerpo: BloqueNota[];
  fuentes: FuenteNota[];
  compartir: { descripcion: string; imagen: string; imagenAutorizada: boolean };
  registroInterno: string[];     // NO se muestra en la web
}

export const TEXTO_PENDIENTE = '[TEXTO PENDIENTE: pegar aqui el texto aprobado, sin cambios]';

export const NOTAS: Nota[] = [
  {
    slug: 'diego-capote',
    estado: 'borrador',
    fecha: null,
    tipo: 'Nota',
    titulo: 'Diego Capote: dos veces vicecampeón mundial y protagonista del billar uruguayo',
    bajada: 'Integró las selecciones uruguayas que llegaron a las finales mundiales de 2019 y 2023. Hoy continúa compitiendo en los campeonatos departamentales, compartiendo las mesas con jugadores de distintas generaciones.',
    resumen: 'Integró las selecciones uruguayas que llegaron a las finales mundiales de 2019 y 2023 y hoy sigue compitiendo en los campeonatos departamentales.',
    autor: 'FEBIU',
    imagen: '/notas/diego-capote/capote-1.jpg',
    imagenAlt: 'Diego Capote inclinado sobre una mesa de billar de paño azul, apuntando un tiro',
    pieImagen: '',
    aclaracion: 'Nota de elaboración propia de la Federación de Billar del Uruguay, basada en las fuentes periodísticas que se citan al final. No es una entrevista exclusiva.',
    cuerpo: [
      { t: "p", texto: "Hay deportistas que, después de alcanzar importantes resultados internacionales, continúan vinculados a las competencias que forman parte de sus orígenes. Diego Capote es uno de ellos." },
      { t: "p", texto: "Su nombre está asociado a dos de las actuaciones más destacadas del billar uruguayo de cinco quillas: los vicecampeonatos mundiales por equipos obtenidos en Lugano, Suiza, en 2019, y en Austria, en 2023." },
      { t: "p", texto: "Pero su trayectoria no pertenece solamente al pasado. Capote continúa participando en los campeonatos departamentales, manteniendo su vínculo con la actividad competitiva nacional." },
      { t: "h2", texto: "Lugano 2019: Uruguay entre los mejores del mundo" },
      { t: "p", texto: "En enero de 2019, el periodista Martín Romego publicó en *Hoy Canelones* una extensa entrevista a Diego Capote, pocos días después de que la selección uruguaya alcanzara la final del Campeonato Mundial por Equipos disputado en Lugano." },
      { t: "p", texto: "Aquel torneo dejó una actuación memorable. Uruguay superó a Argentina en semifinales y disputó el título mundial frente a Italia, una de las grandes potencias de esta disciplina." },
      { t: "p", texto: "Capote tuvo un papel destacado durante la competencia. Entre sus triunfos individuales sobresalió el conseguido ante Alejandro Martinotti, campeón mundial argentino, una victoria de especial significado por la jerarquía del rival." },
      { t: "p", texto: "La entrevista permitió conocer también el esfuerzo que había detrás de aquella actuación: las horas de entrenamiento, la preparación y el compromiso de un grupo de jugadores que consiguió colocar nuevamente a Uruguay entre los protagonistas del billar internacional." },
      { t: "h2", texto: "Una historia que comenzó lejos de las mesas" },
      { t: "p", texto: "Antes de dedicarse al billar, Diego Capote había transitado por el fútbol." },
      { t: "p", texto: "Según recordó una publicación de la Confederación Uruguaya de Deportes en enero de 2019, jugó en Liverpool y Darling de Canelones y participó en selecciones juveniles departamentales." },
      { t: "p", texto: "Con el tiempo, encontró en el billar una nueva pasión deportiva." },
      { t: "p", texto: "Su recorrido demuestra que la dedicación, la experiencia competitiva y la perseverancia pueden llevar a un deportista uruguayo a enfrentarse con los mejores exponentes internacionales de una disciplina." },
      { t: "p", texto: "También refleja las dificultades económicas y organizativas que muchas veces acompañan a los representantes de deportes que no cuentan con la difusión de las grandes disciplinas." },
      { t: "fig", src: "/notas/diego-capote/capote-2.jpg", alt: "Diego Capote con chaleco azul preparando un tiro en una sala de billar con lámparas verdes", pie: "" },
      { t: "h2", texto: "Austria 2023: la historia vuelve a repetirse" },
      { t: "p", texto: "Cuatro años después de Lugano, el billar uruguayo volvió a vivir una jornada histórica." },
      { t: "p", texto: "En el Campeonato Mundial por Equipos disputado en Austria, Uruguay alcanzó nuevamente la final, después de superar a Argentina en semifinales." },
      { t: "p", texto: "Italia volvió a ser el rival en la definición del título y la selección uruguaya obtuvo su segundo vicecampeonato mundial en ese período." },
      { t: "p", texto: "Diego Capote formó parte de aquella nueva conquista, reafirmando su presencia en una generación de jugadores que logró resultados de enorme importancia para el billar nacional." },
      { t: "p", texto: "La actuación tuvo repercusión en la prensa uruguaya, incluyendo una publicación de *El País* que recogió declaraciones del jugador después del campeonato." },
      { t: "h2", texto: "De las finales mundiales a nuestros campeonatos departamentales" },
      { t: "p", texto: "Una de las particularidades más interesantes de la trayectoria de Diego Capote es su continuidad en la actividad competitiva nacional." },
      { t: "p", texto: "Hoy sigue participando en los campeonatos departamentales organizados dentro de la estructura federativa, compartiendo las mesas con jugadores de distintas categorías y generaciones." },
      { t: "p", texto: "Su presencia representa una oportunidad para quienes comienzan a desarrollar su carrera deportiva: competir frente a un jugador con experiencia en dos finales mundiales y observar de cerca el nivel de exigencia que requiere el billar internacional." },
      { t: "p", texto: "Porque los grandes resultados no se construyen solamente en los campeonatos mundiales. También se alimentan de la actividad cotidiana de los clubes, de los torneos departamentales y del trabajo permanente de quienes mantienen vivo nuestro deporte." },
      { t: "p", texto: "**Diego Capote representa esa conexión entre el billar uruguayo que compite en el mundo y el que se juega cada semana en nuestros clubes.**" },
    ],
    fuentes: [
      { texto: "**Hoy Canelones** — Martín Romego, 24 de enero de 2019.\n«Mano a mano con Diego Capote, vicecampeón de Billar con Uruguay en el Mundial de Suiza».", enlace: { url: "https://hoycanelones.com.uy/?p=25703", etiqueta: 'Ver la publicación original' } },
      { texto: "**Confederación Uruguaya de Deportes** — 25 de enero de 2019.\n«El benjamín del equipo vicecampeón mundial de billar».", enlace: { url: "https://www.cud.org.uy/noticias/el-benjamin-del-equipo-vicecampeon-mundial-de-billar/", etiqueta: 'Ver la publicación original' } },
      { texto: "**El País — Ovación** — 13 de noviembre de 2023.\n«Uruguay es vicecampeón mundial de billar: venció en semifinales a Argentina y cayó en la final con Italia».", enlace: { url: "https://www.elpais.com.uy/ovacion/multideportivo/uruguay-es-vicecampeon-mundial-de-billar-vencio-en-semifinales-a-argentina-y-cayo-en-la-final-con-italia", etiqueta: 'Ver la publicación original' } },
    ],
    compartir: {
      descripcion: 'Integró las selecciones uruguayas que llegaron a las finales mundiales de 2019 y 2023. Hoy continúa compitiendo en los campeonatos departamentales.',
      imagen: '/notas/diego-capote/capote-1.jpg',
      imagenAutorizada: true,
    },
    registroInterno: [
      'Creado el 17/11/2026 a pedido de Capo. Estado: BORRADOR; no publicar sin su autorización expresa.',
      'Texto: incorporado el 19/11/2026 tal cual el archivo aprobado por Capo (copiado por programa, sin resumir ni modificar la redacción).',
      'Fotos: dos fotografías de Diego Capote en competencia (capote-1.jpg y capote-2.jpg), del archivo de FEBIU, indicadas por Capo como autorizadas para publicación. Son de 640 px de ancho y Capo indicó (19/11/2026) que no tiene mejores; se publican SIN epígrafe, por indicación suya.',
      'Se presenta como nota de elaboración propia basada en fuentes periodísticas, no como entrevista exclusiva. Fuentes: Hoy Canelones (Martín Romego, 24/01/2019), CUD (25/01/2019), El País Ovación (13/11/2023).',
      'Una entrevista exclusiva (posiblemente en video) a Diego Capote irá como entrada independiente (tipo Entrevista, bloque video), separada de esta nota y de Memorias.',
    ],
  },
];

export const publicadasNotas = () => NOTAS.filter(n => n.estado === 'publicado').sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
