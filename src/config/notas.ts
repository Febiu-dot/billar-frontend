// NOTAS Y ENTREVISTAS de la FEBIU (separadas de la serie historica "Memorias del Billar Uruguayo").
// Para agregar una nota: copiar un bloque al FINAL de NOTAS, cambiar slug, textos, fotos (carpeta public/notas/<slug>/) y fuentes.
// Mientras diga estado: 'borrador' NO se ve en la portada ni en el indice; se revisa entrando a /portada/notas/<slug>?borrador=1
// (y la portada con ?borrador=1 la muestra con la etiqueta BORRADOR). Para publicar: estado 'publicado' y fecha 'AAAA-MM-DD'.
// tipo: 'Nota' (articulo) o 'Entrevista'. Una entrevista en video se agrega como OTRA entrada, con un bloque { t: 'video', youtubeId }.
// Formato del texto: *cursiva* y **negrita**.

export type BloqueNota =
  | { t: 'p'; texto: string; inicial?: boolean }
  | { t: 'h2'; texto: string }
  | { t: 'cita'; texto: string }  // cita destacada (usar una sola por nota)
  | { t: 'fig'; src: string; alt: string; pie?: string; vertical?: boolean }  // vertical: foto de pie, se muestra entera y angosta
  | { t: 'datos'; items: { valor: string; etiqueta: string }[] }
  | { t: 'tabla'; columnas: string[]; filas: string[][] }
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
    estado: 'publicado',
    fecha: '2026-11-24',
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
  {
    slug: 'veronica-gutierrez',
    estado: 'publicado',
    fecha: '2026-11-24',
    tipo: 'Nota',
    titulo: "Verónica Gutiérrez: comenzó a jugar al billar a los 54 años y llegó a la élite mundial",
    bajada: "Tricampeona nacional de cinco quillas, fue quinta en el Mundial de Madrid 2025 y se consagró campeona panamericana en Uruguay en 2026",
    resumen: "Tricampeona nacional, campeona panamericana y quinta en el Mundial de Madrid 2025: empezó a jugar a los 54 años y llegó a la élite mundial.",
    autor: 'FEBIU',
    imagen: '/notas/veronica-gutierrez/veronica-1.jpg',
    imagenAlt: 'Verónica Gutiérrez inclinada sobre la mesa de billar, concentrada en la ejecución de un tiro',
    pieImagen: '',
    aclaracion: "Nota elaborada por la Federación de Billar del Uruguay a partir de una entrevista escrita realizada a Verónica Gutiérrez en noviembre de 2026.",
    cuerpo: [
      { t: "p", texto: "Hay historias deportivas que sorprenden por sus resultados. Otras, por el camino recorrido para conseguirlos. La de Verónica Gutiérrez reúne ambas características." },
      { t: "p", texto: "A comienzos de 2024, con 54 años, Verónica dio sus primeros pasos en el billar de cinco quillas. Apenas un tiempo después, su nombre ya figuraba entre las protagonistas de las principales competencias nacionales e internacionales." },
      { t: "p", texto: "Tres campeonatos nacionales consecutivos, un título panamericano y un quinto puesto mundial forman parte de una trayectoria tan breve como extraordinaria." },
      { t: "datos", items: [{"valor": "54", "etiqueta": "años tenía cuando empezó a jugar, a comienzos de 2024"}, {"valor": "3", "etiqueta": "campeonatos nacionales consecutivos: 2024, 2025 y 2026"}, {"valor": "2026", "etiqueta": "campeona panamericana, en Uruguay"}, {"valor": "5.º", "etiqueta": "puesto en el Mundial de Madrid 2025"}] },
      { t: "p", texto: "Pero detrás de esos resultados hay una historia de aprendizaje, perseverancia, apoyo familiar y una pasión que apareció cuando menos lo esperaba." },
      { t: "h2", texto: "Los primeros tiros en Lavalleja" },
      { t: "p", texto: "El primer acercamiento de Verónica al billar fue casi casual." },
      { t: "p", texto: "Su esposo practicaba este deporte y ella comenzó a acompañarlo a entrenamientos y torneos. Poco a poco, lo que inicialmente observaba desde afuera despertó su curiosidad." },
      { t: "p", texto: "«Me enamoré de la posibilidad de aprender permanentemente, de buscar mejorar cada tiro y de descubrir que detrás de cada jugada hay una estrategia, concentración y mucha dedicación», recuerda." },
      { t: "p", texto: "Sus primeras prácticas fueron en el Centro Democrático de Lavalleja, a comienzos de 2024." },
      { t: "p", texto: "Tenía 54 años y empezaba desde cero." },
      { t: "p", texto: "Su primera competencia oficial fue el torneo «Minas en Abril», de ese mismo año." },
      { t: "p", texto: "Recuerda especialmente los nervios de aquella experiencia y la satisfacción de ejecutar algunos buenos tiros que fueron celebrados por los presentes." },
      { t: "p", texto: "Lo que entonces era una aventura deportiva recién comenzaba." },
      { t: "h2", texto: "De los primeros torneos a los títulos internacionales" },
      { t: "p", texto: "La evolución de Verónica fue notable." },
      { t: "p", texto: "En el ámbito nacional consiguió tres campeonatos consecutivos, correspondientes a 2024, 2025 y 2026." },
      { t: "p", texto: "En el plano internacional obtuvo el vicecampeonato panamericano en Santa Fe, Argentina, en 2025, y posteriormente se consagró campeona panamericana en Uruguay, en 2026." },
      { t: "fig", src: "/notas/veronica-gutierrez/veronica-panamericano.jpg", alt: "Verónica Gutiérrez sonriendo con el trofeo de campeona del Panamericano de 5 Quillas Uruguay 2026, en la Sala Willy Billar, junto al cartel del campeonato", pie: "Verónica Gutiérrez con el trofeo en el Panamericano de Uruguay 2026.", vertical: true },
      { t: "p", texto: "Estos resultados la consolidaron como una de las principales representantes femeninas del billar uruguayo de cinco quillas." },
      { t: "p", texto: "Sin embargo, antes de ese título panamericano, Verónica había vivido en España uno de los momentos más importantes de su trayectoria: el Mundial de 2025." },
      { t: "h2", texto: "Madrid 2025: entre las mejores del mundo" },
      { t: "p", texto: "En noviembre de 2025, Verónica participó en el Campeonato Mundial Femenino de Billar Cinco Quillas, disputado en Madrid." },
      { t: "p", texto: "Allí alcanzó el quinto puesto, un resultado de enorme importancia en su carrera deportiva." },
      { t: "fig", src: "/notas/veronica-gutierrez/veronica-madrid.jpg", alt: "Verónica Gutiérrez de pie frente al cartel del Campeonato Mundial de Billar 5 Quillas Femenino y por Selecciones, Madrid, del 17 al 23 de noviembre de 2025", pie: "Verónica Gutiérrez en el Campeonato Mundial de Madrid 2025.", vertical: true },
      { t: "p", texto: "«Estar entre las mejores jugadoras del mundo fue una experiencia que me permitió dimensionar todo lo que había recorrido, pero también me hizo sentir que todavía hay muchísimo por aprender y por conquistar»." },
      { t: "p", texto: "Entre los encuentros que más recuerda se encuentra una victoria frente a una campeona panamericana, a quien consiguió derrotar por primera vez durante aquel Mundial." },
      { t: "p", texto: "La experiencia internacional también reforzó su convicción de que el billar exige mucho más que habilidad técnica." },
      { t: "p", texto: "Para Verónica, la concentración, el análisis de cada situación y la capacidad de mantener la calma son fundamentales." },
      { t: "p", texto: "«No alcanza con saber ejecutar un tiro: hay que pensar, anticiparse, analizar las posibilidades y tomar decisiones»." },
      { t: "h2", texto: "El desafío de abrir caminos para otras mujeres" },
      { t: "p", texto: "Más allá de sus títulos, Verónica tiene una mirada muy clara sobre el desarrollo del billar femenino en Uruguay." },
      { t: "p", texto: "Considera que la participación de las mujeres ha crecido, aunque todavía es reducida en comparación con la de los hombres." },
      { t: "p", texto: "En su experiencia personal, ha encontrado respeto y compañerismo, y participa habitualmente en competencias junto a jugadores varones." },
      { t: "p", texto: "Sin embargo, reconoce que muchas mujeres todavía perciben al billar como un ambiente exclusivamente masculino." },
      { t: "p", texto: "Para cambiar esa realidad, propone organizar jornadas de iniciación, clases para principiantes, encuentros femeninos y actividades que permitan acercarse al deporte sin necesidad de contar con conocimientos previos." },
      { t: "p", texto: "También considera fundamental dar visibilidad a las jugadoras y sus historias." },
      { t: "p", texto: "«Muchas veces, ver a otra mujer practicando y compitiendo es lo que genera ese primer impulso de decir: “Yo también puedo hacerlo”»." },
      { t: "p", texto: "Y deja un mensaje especialmente dirigido a quienes todavía no se animaron a acercarse a una mesa:" },
      { t: "cita", texto: "«La mesa no distingue género, solamente necesita que alguien se anime a jugar»." },
      { t: "h2", texto: "La familia, un apoyo fundamental" },
      { t: "p", texto: "Cuando habla de su trayectoria, Verónica destaca especialmente el acompañamiento de su familia." },
      { t: "p", texto: "Su esposo fue quien la acercó al billar, pero también sus hijos y su madre han compartido sus alegrías, sus nervios y sus logros deportivos." },
      { t: "p", texto: "Reconoce, además, la importancia de los compañeros que la ayudaron a aprender y de todas las personas que trabajan para mantener viva la actividad en los clubes." },
      { t: "p", texto: "Para ella, el billar no solamente significa competir." },
      { t: "p", texto: "También representa amistades, viajes, experiencias y la posibilidad de conocer personas y lugares que de otra manera quizás nunca habría conocido." },
      { t: "h2", texto: "Una historia que recién comienza" },
      { t: "p", texto: "A pesar de sus importantes resultados, Verónica no considera que haya llegado al final de su recorrido deportivo." },
      { t: "p", texto: "Por el contrario, mantiene el objetivo de seguir perfeccionando su técnica, competir internacionalmente y representar a Uruguay en nuevos campeonatos." },
      { t: "p", texto: "También espera que su experiencia pueda servir de inspiración para otras mujeres." },
      { t: "p", texto: "Su historia demuestra que la edad no tiene por qué ser un impedimento para comenzar una actividad deportiva, aprender, competir y alcanzar objetivos que inicialmente pueden parecer muy lejanos." },
      { t: "p", texto: "En apenas unos años, Verónica Gutiérrez pasó de observar las partidas de su esposo a convertirse en campeona panamericana y ubicarse entre las mejores jugadoras del mundo." },
      { t: "p", texto: "**Una trayectoria que representa un orgullo para el billar uruguayo y una invitación a descubrir que siempre puede existir un nuevo desafío por delante.**" },
      { t: "h2", texto: "Palmarés deportivo" },
      { t: "tabla", columnas: ["Año", "Resultado"], filas: [["2024", "Campeona nacional"], ["2025", "Vicecampeona panamericana — Santa Fe, Argentina"], ["2025", "Campeona nacional"], ["2025", "5.º puesto — Campeonato Mundial Femenino, Madrid, España"], ["2026", "Campeona nacional"], ["2026", "Campeona panamericana — Uruguay"]] },
    ],
    fuentes: [],
    compartir: { descripcion: "Tricampeona nacional, campeona panamericana y quinta en el Mundial de Madrid 2025: empezó a jugar a los 54 años y llegó a la élite mundial.", imagen: '/notas/veronica-gutierrez/veronica-1.jpg', imagenAutorizada: true },
    registroInterno: [
      'Texto aprobado entregado por la administradora el 22/11/2026, incorporado sin cambios (solo tildes y ortografía).',
      'Fotos entregadas por la administradora: ejecución de una jugada (principal), Mundial de Madrid 2025 y Panamericano Uruguay 2026 (con trofeo). Se muestran en su proporción original, sin recortes.',
      'Los epígrafes de las dos fotos interiores siguen la descripción dada por la administradora; la foto principal va sin epígrafe.',
      'Bloque de datos destacados armado solo con cifras del propio texto (54 años, 3 campeonatos nacionales, título panamericano 2026, 5.º en Madrid 2025).',
      'Está en borrador. No va a Memorias. Se publica solo con autorización expresa.',
    ],
  },
];

export const publicadasNotas = () => NOTAS.filter(n => n.estado === 'publicado').sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
