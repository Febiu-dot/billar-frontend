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
  | { t: 'fig'; src: string; alt: string; pie: string }
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
    pieImagen: 'Diego Capote en competencia. Archivo FEBIU.',
    aclaracion: 'Nota de elaboración propia de la Federación de Billar del Uruguay, basada en las fuentes periodísticas que se citan al final. No es una entrevista exclusiva.',
    cuerpo: [
      { t: 'h2', texto: 'Lugano 2019: Uruguay entre los mejores del mundo' },
      { t: 'p', texto: TEXTO_PENDIENTE },
      { t: 'h2', texto: 'Una historia que comenzó lejos de las mesas' },
      { t: 'p', texto: TEXTO_PENDIENTE },
      { t: 'fig', src: '/notas/diego-capote/capote-2.jpg', alt: 'Diego Capote con chaleco azul preparando un tiro en una sala de billar con lámparas verdes', pie: 'Diego Capote en competencia. Archivo FEBIU.' },
      { t: 'h2', texto: 'Austria 2023: la historia vuelve a repetirse' },
      { t: 'p', texto: TEXTO_PENDIENTE },
      { t: 'h2', texto: 'De las finales mundiales a nuestros campeonatos departamentales' },
      { t: 'p', texto: TEXTO_PENDIENTE },
    ],
    fuentes: [
      { texto: 'Hoy Canelones — Martín Romego (24/01/2019).', enlace: { url: 'https://hoycanelones.com.uy/?p=25703', etiqueta: 'Ver la publicación original' } },
      { texto: 'Confederación Uruguaya de Deportes (25/01/2019).', enlace: { url: 'https://www.cud.org.uy/noticias/el-benjamin-del-equipo-vicecampeon-mundial-de-billar/', etiqueta: 'Ver la publicación original' } },
      { texto: 'El País — Ovación (13/11/2023).', enlace: { url: 'https://www.elpais.com.uy/ovacion/multideportivo/uruguay-es-vicecampeon-mundial-de-billar-vencio-en-semifinales-a-argentina-y-cayo-en-la-final-con-italia', etiqueta: 'Ver la publicación original' } },
    ],
    compartir: {
      descripcion: 'Integró las selecciones uruguayas que llegaron a las finales mundiales de 2019 y 2023. Hoy continúa compitiendo en los campeonatos departamentales.',
      imagen: '/notas/diego-capote/capote-1.jpg',
      imagenAutorizada: true,
    },
    registroInterno: [
      'Creado el 17/11/2026 a pedido de Capo. Estado: BORRADOR; no publicar sin su autorización expresa.',
      'Texto: falta pegar el texto completo aprobado (apartados: Lugano 2019; Una historia que comenzó lejos de las mesas; Austria 2023; De las finales mundiales a nuestros campeonatos departamentales). Hasta entonces cada apartado muestra "[TEXTO PENDIENTE]". Debe incorporarse sin resumir ni modificar la redacción.',
      'Fotos: dos fotografías de Diego Capote en competencia (capote-1.jpg y capote-2.jpg), del archivo de FEBIU, indicadas por Capo como autorizadas para publicación. Son de 640 px de ancho; si hay originales más grandes, conviene reemplazarlas.',
      'Se presenta como nota de elaboración propia basada en fuentes periodísticas, no como entrevista exclusiva. Fuentes: Hoy Canelones (Martín Romego, 24/01/2019), CUD (25/01/2019), El País Ovación (13/11/2023).',
      'Una entrevista exclusiva (posiblemente en video) a Diego Capote irá como entrada independiente (tipo Entrevista, bloque video), separada de esta nota y de Memorias.',
    ],
  },
];

export const publicadasNotas = () => NOTAS.filter(n => n.estado === 'publicado').sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
