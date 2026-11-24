// Contenido editable de la portada (/portada).
// Lo que esta vacio NO se muestra en la pagina.

export interface Auspiciante {
  nombre: string;
  logo: string;      // ruta del logo, ej: /auspiciantes/marca.png
  url?: string;      // link opcional
}

export interface VideoItem {
  titulo: string;
  tipo: 'Campeonato' | 'Clase' | 'Jugadas' | 'Entrevista' | 'Histórico';
  youtubeId: string; // ej: dQw4w9WgXcQ
  fecha?: string;
}

export interface NotaItem {
  titulo: string;
  tipo: string;
  fecha?: string;
  autor?: string;
  resumen?: string;
  imagen?: string;
}

// Directo de YouTube. Vacio = se muestra "proxima transmision".
// Ejemplos: 'https://www.youtube.com/embed/live_stream?channel=ID_DEL_CANAL' o 'https://www.youtube.com/embed/ID_DEL_VIDEO'
export const YOUTUBE_EMBED_URL = '';
export const CANAL_YOUTUBE_URL = '';

// Datos de contacto para auspiciantes. Vacios = no se muestra el boton.
export const CONTACTO = {
  email: '',
  whatsapp: '', // solo numeros con codigo de pais, ej: 59899123456
};

export const TRANSMISION_PRESENTADA_POR: Auspiciante | null = null;
export const AUSPICIANTE_PRINCIPAL: Auspiciante | null = null;
// Banner que separa los torneos de la parte historica (notas, memorias, reglamento). Si es null, no se muestra (solo en la vista previa).
export const AUSPICIANTE_ARCHIVO: Auspiciante | null = null;
export const AUSPICIANTES_OFICIALES: Auspiciante[] = [];

export const VIDEOS: VideoItem[] = [
  { titulo: 'Joyita del billar uruguayo: Eliomar Berruti vs Néstor Gómez', tipo: 'Histórico', youtubeId: 'LmH1rnet3AY', fecha: '6ª Prueba Mundial · Sarnano, Italia · 1993' },
];
export const NOTAS: NotaItem[] = [];

export const PANAMERICANO_PROXIMO = 'Julio 2027';
// Confirmado por la UMB (noticia del 24/11/2026): Uruguay sede del Mundial, del 4 al 7 de noviembre de 2027.
export const MUNDIAL = { fecha: 'Del 4 al 7 de noviembre de 2027', sede: 'Uruguay', cortaFecha: '4 al 7 de noviembre de 2027' };
