// MEMORIAS DEL BILLAR URUGUAYO — serie semanal de la FEBIU.
// Para agregar una entrega nueva: copiar el bloque de la ultima entrega al FINAL de ENTREGAS, cambiar el numero,
// el texto, las imagenes (carpeta public/memorias/NN/) y las fuentes. Mientras diga estado: 'borrador' NO se ve en
// el indice ni en la portada; se puede revisar entrando a /portada/memorias/N?borrador=1.
// Para publicarla: cambiar estado a 'publicado' y poner la fecha ('AAAA-MM-DD').
// Cada entrega tiene: numero, titulo, bajada, resumen, cuerpo, fuentes, compartir (WhatsApp/Facebook) y registroInterno (creditos/permisos, no se muestra).
// Enlace permanente de cada entrega: /portada/memorias/N
// Formato del texto: *cursiva* y **negrita**. El contenido historico no se modifica sin consulta.

export type Bloque =
  | { t: 'p'; texto: string; inicial?: boolean }
  | { t: 'h2'; texto: string }
  | { t: 'cita'; texto: string }
  | { t: 'fig'; src: string; alt: string; pie: string };

export interface Fuente { texto: string; enlace?: { url: string; etiqueta: string } }

export interface Entrega {
  numero: number;
  estado: 'borrador' | 'publicado';
  fecha: string | null;          // fecha de publicacion AAAA-MM-DD (solo cuando se publica)
  titulo: string;
  bajada: string;                // subtitulo debajo del titulo
  resumen: string;               // texto breve para el indice y para compartir
  portada: string;               // imagen del indice
  portadaAlt: string;
  cuerpo: Bloque[];
  fuentes: Fuente[];
  proxima?: string;
  // Datos para compartir por WhatsApp / Facebook (van en el HTML inicial de la pagina)
  compartir: { descripcion: string; imagen: string; imagenAutorizada: boolean };
  // Registro interno: NO se muestra en la web. Creditos, permisos y verificaciones pendientes.
  registroInterno: string[];
}

export const ENTREGAS: Entrega[] = [
  {
    numero: 1,
    estado: 'publicado', // publicada el 24/11/2026 con autorizacion expresa de Capo
    fecha: '2026-11-24',
    titulo: 'Los orígenes del billar en Uruguay',
    bajada: 'De los antiguos cafés montevideanos a los primeros pasos de la organización deportiva.',
    resumen: 'Primera entrega de Memorias del Billar Uruguayo: del billar en los cafés montevideanos del siglo XIX a la organización federativa.',
    portada: '/memorias/01/cafe-independencia.jpg',
    portadaAlt: 'Fachada histórica del Café Independencia, con la palabra Billares en el vidrio',
    cuerpo: [
      { t: 'fig', src: '/memorias/01/cafe-independencia.jpg', alt: 'Fachada histórica del Café Independencia, con la palabra Billares en el vidrio',
        pie: '**Café Independencia, Plaza Independencia, Montevideo, década de 1920 (aprox.). Fotografía de autores municipales. Centro de Fotografía de Montevideo – Intendencia de Montevideo. Archivo N.º 0574FMHB.CDF.IMO.UY.**' },
      { t: 'p', inicial: true, texto: 'Mucho antes de los campeonatos nacionales y de las grandes actuaciones internacionales, el billar ya tenía un lugar en la vida social montevideana. Los cafés reunían a vecinos, viajeros y aficionados alrededor de sus mesas, en espacios donde el entretenimiento convivía con la conversación y el intercambio de noticias.' },
      { t: 'h2', texto: 'Una pista documental de 1841' },
      { t: 'p', texto: 'El historiador Juan Antonio Varese, al estudiar los antiguos cafés de Montevideo, recuperó anuncios de prensa que permiten rastrear la presencia del billar en la primera mitad del siglo XIX. En *El Nacional* del 14 de abril de 1841 figura el aviso de un establecimiento de «Billar y Café» en la calle San Luis, número 57, a cargo del señor Bernard.' },
      { t: 'p', texto: 'Otros avisos de aquel mismo año mencionan fondas, cafés y billares en distintos puntos de la ciudad. No se trata todavía de un registro de competencias deportivas, sino de una evidencia de que el juego formaba parte de la oferta de aquellos establecimientos.' },
      { t: 'h2', texto: 'Los cafés como espacios de encuentro' },
      { t: 'p', texto: 'En una época anterior a los clubes especializados y a los sistemas modernos de torneos, las mesas instaladas en los cafés ofrecían un lugar de práctica y reunión. Allí podían observarse las destrezas de jugadores experimentados, aprender golpes y compartir partidas.' },
      { t: 'p', texto: 'La evolución de ese ambiente social hacia una actividad organizada no fue inmediata. Reconstruirla exige reunir avisos, fotografías, recuerdos y registros de las instituciones que aparecieron con el paso de las décadas.' },
      { t: 'h2', texto: 'El recuerdo del Café Vaccaro' },
      { t: 'p', texto: 'Entre los nombres asociados a la memoria del billar montevideano aparece el Café Vaccaro, en el barrio Goes. Un reportaje de la revista *Ahora*, publicado en octubre de 1972, evocó a jugadores de comienzos del siglo XX y recuperó testimonios vinculados con ese establecimiento.' },
      { t: 'fig', src: '/memorias/01/cafe-vaccaro.jpg', alt: 'Obra del pintor Álvaro Saralegui Rosé que representa el Café Vaccaro, en el barrio Goes, Montevideo',
        pie: '**Café Vaccaro, barrio Goes, Montevideo.** Obra del pintor Álvaro Saralegui Rosé. Reproducida con autorización de Juan Antonio Varese. Fuente: revista *Raíces*.' },
      { t: 'p', texto: 'Esos relatos nos acercan a una etapa en la que la fama de los buenos billaristas se construía ante quienes observaban sus partidas. Son recuerdos que merecen conservarse, pero también contrastarse con otras fuentes para distinguir con precisión fechas, nombres y resultados.' },
      { t: 'h2', texto: '1936: un hito de la organización federativa' },
      { t: 'p', texto: 'El reportaje de *Ahora* de 1972 señala el año 1936 como fecha de fundación de la Federación Uruguaya de Billar y menciona entre sus impulsores a Francisco Ferraro, Doroteo Sena, Favaro, Luis Adami, Daniel Silva Corres, Sarda Folle y José Alzpuru.' },
      { t: 'p', texto: 'Este dato abre una investigación fundamental: conocer los primeros estatutos, las autoridades y los clubes vinculados a aquella Federación, y establecer documentalmente su relación con las estructuras federativas posteriores.' },
      { t: 'cita', texto: 'La historia del billar uruguayo comenzó mucho antes de sus grandes títulos: también vive en los cafés, las mesas y las personas que transmitieron su afición de una generación a otra.' },
      { t: 'h2', texto: 'Una memoria para construir entre todos' },
      { t: 'p', texto: 'Con esta serie, la Federación de Billar del Uruguay se propone reunir y divulgar documentos, fotografías, resultados y testimonios sobre el desarrollo del deporte en el país. Cada nueva entrega incorporará protagonistas y episodios de distintas épocas, con el compromiso de identificar las fuentes y señalar los datos que aún requieran confirmación.' },
      { t: 'p', texto: 'Invitamos a los clubes, jugadores y familias a colaborar con recuerdos, recortes de prensa, fotografías y documentos que permitan enriquecer esta historia compartida.' },
    ],
    fuentes: [
      { texto: '**Juan Antonio Varese.** «Influencia francesa en los cafés montevideanos (1.ª parte)», revista *Raíces*. Incluye referencias a avisos de *El Nacional* de 1841.',
        enlace: { url: 'https://raicesuruguay.com/raices/varese05.html', etiqueta: 'Consultar investigación' } },
      { texto: '**Revista Ahora.** Reportaje sobre el billar uruguayo, 8 de octubre de 1972. Documento histórico utilizado para las referencias al Café Vaccaro y a la Federación de 1936.',
        enlace: { url: 'https://sitiosdememoria.uy/sites/default/files/2025-07/10/ahora.-revista-de-los-domingos_n16_f8-10-1972.pdf', etiqueta: 'Consultar facsímil' } },
      { texto: '**Imágenes:** la fotografía del Café Independencia pertenece al archivo histórico del Centro de Fotografía de Montevideo (Intendencia de Montevideo), liberado bajo licencia CC0 1.0 Universal. La obra del Café Vaccaro, del pintor Álvaro Saralegui Rosé, se reproduce con autorización de Juan Antonio Varese.',
        enlace: { url: 'https://cdf.montevideo.gub.uy/fotografias/bares-y-almacenes', etiqueta: 'Ver ficha en el CdF' } },
    ],
    compartir: {
      descripcion: 'Un recorrido por los antiguos cafés montevideanos, los primeros jugadores y los antecedentes de la organización federativa del billar uruguayo.',
      imagen: '/memorias/01/cafe-independencia.jpg',
      imagenAutorizada: true, // CC0 1.0 verificada el 17/11/2026 (CdF 0574FMHB)
    },
    registroInterno: [
      'Café Independencia (cafe-independencia.jpg): VERIFICADO el 17/11/2026. Es la misma fotografía de la ficha del Centro de Fotografía de Montevideo, archivo 0574FMHB.CDF.IMO.UY (Café Independencia, Plaza Independencia, década de 1920 aprox.; autoría: fotógrafos municipales). Ficha: https://cdf.montevideo.gub.uy/fotografias/bares-y-almacenes . Condiciones: el CdF libera su archivo histórico municipal (FMH) bajo licencia CC0 1.0 Universal (https://cdf.montevideo.gub.uy/articulo/el-archivo-historico-disponible-en-alta-resolucion). Nota del CdF: las fotos ingresadas por donación de particulares se rigen por otro reglamento; esta es del fondo municipal (código FMH). Mantener el crédito del epígrafe.',
      'Café Vaccaro (cafe-vaccaro.jpg): NO es una fotografía; es una obra del pintor Álvaro Saralegui Rosé, localizada en la revista Raíces. Juan Antonio Varese autorizó por correo electrónico su uso en la web institucional de FEBIU, con la condición de mencionar su nombre y el del pintor (17/11/2026). Autorización resuelta; conservar el correo.',
      'Fuente documental disponible para futuras entregas: Juan Antonio Varese ofreció textos y dibujos de sus libros, citando libro, autor y edición: Personajes y tertulias en cafés y bares de Montevideo (Planeta, 2018); Crónicas del tiempo libre (Planeta, 2020); Cafés montevideanos con historias (Planeta, 2023); Cafés & cafeterías (Planeta, 2025). Los de 2018 y 2023 tienen referencias útiles a billares y cafés antiguos. Comprobar en cada uso que esté comprendido en su autorización. No se incorporó nada a la entrega N.º 1.',
      'La entrega sigue en borrador hasta autorización expresa. La imagen para compartir en redes es la del Café Independencia (compartir.imagenAutorizada = true, CC0 1.0 verificada).',
    ],
    proxima: 'Los grandes maestros de los antiguos cafés: protagonistas y recuerdos de los primeros años del billar uruguayo.',
  },
];

export const publicadas = () =>
  ENTREGAS.filter(e => e.estado === 'publicado').sort((a, b) => b.numero - a.numero);
